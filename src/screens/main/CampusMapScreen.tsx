import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { supabase } from '../../lib/supabase';
import { pathfindingService, CampusNode, CampusEdge } from '../../services/PathfindingService';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CampusMapScreen() {
  const { width, height } = useWindowDimensions();
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [nodes, setNodes] = useState<CampusNode[]>([]);
  const [edges, setEdges] = useState<{ from: string; to: string; weight: number }[]>([]);
  const [startNode, setStartNode] = useState<string | null>(null);
  const [endNode, setEndNode] = useState<string | null>(null);
  const [path, setPath] = useState<CampusNode[]>([]);
  
  // Admin builder mode state
  const [selectedNodeForEdge, setSelectedNodeForEdge] = useState<string | null>(null);

  const loadGraph = async () => {
    const success = await pathfindingService.loadGraph();
    if (success) {
      setNodes(pathfindingService.getNodes());
      setEdges(pathfindingService.getEdges());
    }
  };

  useEffect(() => {
    loadGraph();
  }, []);

  useEffect(() => {
    if (startNode && endNode) {
      const p = pathfindingService.findShortestPath(startNode, endNode);
      if (p) setPath(p);
      else setPath([]);
    } else {
      setPath([]);
    }
  }, [startNode, endNode, nodes, edges]);

  const handleSvgPress = async (e: any) => {
    if (!isAdminMode) return;
    
    // Attempt to get local coordinates relative to the SVG
    const { locationX, locationY } = e.nativeEvent;
    
    // In a real app we might ask for node name and type
    const newNodeName = `Node ${nodes.length + 1}`;
    
    const { data, error } = await supabase.from('campus_nodes').insert({
      node_name: newNodeName,
      node_type: 'waypoint',
      floor_number: 1, // Added default floor_number
      x_coord: locationX,
      y_coord: locationY
    }).select().single();

    if (error) {
      Alert.alert('Error inserting node', error.message);
    } else if (data) {
      // Reload graph
      await loadGraph();
    }
  };

  const handleNodePress = async (node: CampusNode) => {
    if (isAdminMode) {
      if (selectedNodeForEdge === null) {
        setSelectedNodeForEdge(node.id);
      } else {
        if (selectedNodeForEdge !== node.id) {
          // Calculate Euclidean distance for weight
          const n1 = nodes.find(n => n.id === selectedNodeForEdge);
          if (n1) {
            const dist = Math.sqrt(Math.pow(n1.x_coord - node.x_coord, 2) + Math.pow(n1.y_coord - node.y_coord, 2));
            const { error } = await supabase.from('campus_edges').insert({
              from_node_id: selectedNodeForEdge,
              to_node_id: node.id,
              weight_meters: dist
            });
            if (error) {
              Alert.alert('Error inserting edge', error.message);
            } else {
              await loadGraph();
            }
          }
        }
        setSelectedNodeForEdge(null);
      }
    } else {
      // User mode: select start/end for pathfinding
      if (!startNode) {
        setStartNode(node.id);
      } else if (!endNode && node.id !== startNode) {
        setEndNode(node.id);
      } else {
        setStartNode(node.id);
        setEndNode(null);
      }
    }
  };

  // Helper to check if edge is part of the path
  const isEdgeInPath = (from: string, to: string) => {
    if (path.length < 2) return false;
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i].id;
      const p2 = path[i + 1].id;
      if ((p1 === from && p2 === to) || (p1 === to && p2 === from)) {
        return true;
      }
    }
    return false;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Campus Map</Text>
        <View style={styles.adminToggle}>
          <Text style={styles.adminText}>Admin Mode</Text>
          <Switch value={isAdminMode} onValueChange={setIsAdminMode} />
        </View>
      </View>

      <View style={styles.infoBar}>
        {isAdminMode ? (
          <Text style={styles.infoText}>
            {selectedNodeForEdge ? 'Tap another node to connect.' : 'Tap empty space to add node. Tap a node to start an edge.'}
          </Text>
        ) : (
          <Text style={styles.infoText}>
            {startNode && endNode ? 'Path found!' : startNode ? 'Select destination...' : 'Select starting point...'}
          </Text>
        )}
        {(!isAdminMode && (startNode || endNode)) && (
          <TouchableOpacity onPress={() => { setStartNode(null); setEndNode(null); }} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.mapContainer}>
        <TouchableOpacity activeOpacity={1} onPress={handleSvgPress} style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%">
            {/* Draw Edges */}
            {edges.map((edge, i) => {
              const n1 = nodes.find(n => n.id === edge.from);
              const n2 = nodes.find(n => n.id === edge.to);
              if (!n1 || !n2) return null;
              
              const isPath = isEdgeInPath(edge.from, edge.to);
              
              return (
                <Line
                  key={`edge-${i}`}
                  x1={n1.x_coord}
                  y1={n1.y_coord}
                  x2={n2.x_coord}
                  y2={n2.y_coord}
                  stroke={isPath ? '#3B82F6' : '#E5E7EB'}
                  strokeWidth={isPath ? 4 : 2}
                />
              );
            })}

            {/* Draw Nodes */}
            {nodes.map(node => {
              const isStart = node.id === startNode;
              const isEnd = node.id === endNode;
              const isSelectedForEdge = node.id === selectedNodeForEdge;
              
              let fill = '#9CA3AF'; // default
              if (isStart) fill = '#10B981'; // green
              else if (isEnd) fill = '#EF4444'; // red
              else if (isSelectedForEdge) fill = '#F59E0B'; // orange

              return (
                <G key={node.id} onPress={() => handleNodePress(node)}>
                  <Circle
                    cx={node.x_coord}
                    cy={node.y_coord}
                    r={12}
                    fill={fill}
                  />
                  <SvgText
                    x={node.x_coord}
                    y={node.y_coord + 24}
                    fontSize="10"
                    fill="#374151"
                    textAnchor="middle"
                  >
                    {node.node_name}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  adminToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminText: {
    marginRight: 8,
    fontSize: 14,
    color: '#4B5563',
  },
  infoBar: {
    padding: 12,
    backgroundColor: '#DBEAFE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoText: {
    color: '#1E3A8A',
    fontSize: 14,
  },
  clearBtn: {
    backgroundColor: '#BFDBFE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  clearBtnText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});
