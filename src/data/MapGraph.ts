import { CAMPUS_BUILDINGS, MAIN_PATHS } from './CampusBuildings';

export interface MapNode {
  id: string;
  x: number;
  y: number;
  floor: number;
  type: 'entrance' | 'corridor' | 'staircase' | 'connector';
}

export interface MapEdge {
  from: string;
  to: string;
  distance: number;
  floor: number;
}

const calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

// Returns the closest point on a line segment to a given point
const getClosestPointOnSegment = (p: {x: number, y: number}, a: {x: number, y: number}, b: {x: number, y: number}) => {
  const atob = { x: b.x - a.x, y: b.y - a.y };
  const atop = { x: p.x - a.x, y: p.y - a.y };
  const len = atob.x * atob.x + atob.y * atob.y;
  let dot = atop.x * atob.x + atop.y * atob.y;
  const t = Math.min(1, Math.max(0, dot / len));
  return {
    x: a.x + atob.x * t,
    y: a.y + atob.y * t,
  };
};

export const generateMapGraph = () => {
  const nodes: MapNode[] = [];
  const edges: MapEdge[] = [];

  const addNode = (node: MapNode) => {
    if (!nodes.find(n => n.id === node.id)) {
      nodes.push(node);
    }
  };

  const addEdge = (from: string, to: string, distance: number, floor: number) => {
    edges.push({ from, to, distance, floor });
    edges.push({ from: to, to: from, distance, floor }); // Undirected
  };

  // 1. Add all path waypoints and their sequential edges
  MAIN_PATHS.forEach(path => {
    for (let i = 0; i < path.nodes.length; i++) {
      const p = path.nodes[i];
      const nodeId = `wp_${path.id}_${i}`;
      addNode({ id: nodeId, x: p.x, y: p.y, floor: 0, type: 'corridor' });

      if (i > 0) {
        const prev = path.nodes[i - 1];
        const prevId = `wp_${path.id}_${i - 1}`;
        const dist = calculateDistance(prev.x, prev.y, p.x, p.y);
        addEdge(prevId, nodeId, dist, 0);
      }
    }
  });

  // 2. Connect paths if they intersect or have close nodes (simple heuristic: merge nodes within 10px)
  // To avoid complexity, we just add edges between waypoints that are very close (< 15px)
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const n1 = nodes[i];
      const n2 = nodes[j];
      if (n1.type === 'corridor' && n2.type === 'corridor') {
        const dist = calculateDistance(n1.x, n1.y, n2.x, n2.y);
        if (dist < 20) {
          addEdge(n1.id, n2.id, dist, 0);
        }
      }
    }
  }

  // 3. Add buildings and connect them to the closest path segment
  CAMPUS_BUILDINGS.forEach(building => {
    const doorId = `door_${building.id}`;
    addNode({ id: doorId, x: building.x, y: building.y, floor: 0, type: 'entrance' });

    let closestDist = Infinity;
    let closestPoint = { x: 0, y: 0 };
    let attachNodes: [string, string] | null = null;
    
    // Find closest segment across all paths
    MAIN_PATHS.forEach(path => {
      for (let i = 0; i < path.nodes.length - 1; i++) {
        const n1 = path.nodes[i];
        const n2 = path.nodes[i + 1];
        const cp = getClosestPointOnSegment({ x: building.x, y: building.y }, n1, n2);
        const dist = calculateDistance(building.x, building.y, cp.x, cp.y);
        if (dist < closestDist) {
          closestDist = dist;
          closestPoint = cp;
          attachNodes = [`wp_${path.id}_${i}`, `wp_${path.id}_${i + 1}`];
        }
      }
    });

    if (attachNodes) {
      const connId = `conn_${building.id}`;
      addNode({ id: connId, x: closestPoint.x, y: closestPoint.y, floor: 0, type: 'connector' });
      addEdge(doorId, connId, closestDist, 0);

      // We ideally want to insert connId between attachNodes[0] and attachNodes[1]
      // To keep it simple, just add edges from connId to both endpoints
      const n1 = nodes.find(n => n.id === attachNodes![0])!;
      const n2 = nodes.find(n => n.id === attachNodes![1])!;
      addEdge(connId, n1.id, calculateDistance(closestPoint.x, closestPoint.y, n1.x, n1.y), 0);
      addEdge(connId, n2.id, calculateDistance(closestPoint.x, closestPoint.y, n2.x, n2.y), 0);
    }
  });

  return { nodes, edges };
};

const graph = generateMapGraph();
export const MAP_NODES = graph.nodes;
export const MAP_EDGES = graph.edges;
