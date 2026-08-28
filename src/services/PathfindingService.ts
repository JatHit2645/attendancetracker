import { supabase } from '../lib/supabase';

export type CampusNode = {
  id: string;
  floor_id: string;
  node_name: string;
  node_type: string;
  x_coord: number;
  y_coord: number;
};

export type CampusEdge = {
  id: string;
  from_node_id: string;
  to_node_id: string;
  weight: number;
};

export class PathfindingService {
  private nodes: Map<string, CampusNode> = new Map();
  private adjacencyList: Map<string, { to: string; weight: number }[]> = new Map();

  async loadGraph() {
    const { data: nodesData, error: nodesError } = await supabase
      .from('campus_nodes')
      .select('*');

    const { data: edgesData, error: edgesError } = await supabase
      .from('campus_edges')
      .select('*');

    if (nodesError || edgesError) {
      console.error('Error loading graph:', nodesError, edgesError);
      return false;
    }

    this.nodes.clear();
    this.adjacencyList.clear();

    if (nodesData) {
      for (const node of nodesData) {
        this.nodes.set(node.id, node);
        this.adjacencyList.set(node.id, []);
      }
    }

    if (edgesData) {
      for (const edge of edgesData) {
        if (!this.adjacencyList.has(edge.from_node_id)) {
          this.adjacencyList.set(edge.from_node_id, []);
        }
        if (!this.adjacencyList.has(edge.to_node_id)) {
          this.adjacencyList.set(edge.to_node_id, []);
        }
        const weight = edge.weight_meters;
        this.adjacencyList.get(edge.from_node_id)!.push({ to: edge.to_node_id, weight });
        // Assuming undirected graph for pathfinding unless stated otherwise
        this.adjacencyList.get(edge.to_node_id)!.push({ to: edge.from_node_id, weight });
      }
    }
    return true;
  }

  getNodes() {
    return Array.from(this.nodes.values());
  }

  getEdges() {
    const edges: { from: string; to: string; weight: number }[] = [];
    for (const [from, neighbors] of this.adjacencyList.entries()) {
      for (const neighbor of neighbors) {
        edges.push({ from, to: neighbor.to, weight: neighbor.weight });
      }
    }
    return edges;
  }

  findShortestPath(startNodeId: string, endNodeId: string): CampusNode[] | null {
    if (!this.adjacencyList.has(startNodeId) || !this.adjacencyList.has(endNodeId)) {
      return null;
    }

    const distances: Map<string, number> = new Map();
    const previous: Map<string, string | null> = new Map();
    const unvisited: Set<string> = new Set();

    for (const nodeId of this.adjacencyList.keys()) {
      distances.set(nodeId, Infinity);
      previous.set(nodeId, null);
      unvisited.add(nodeId);
    }
    distances.set(startNodeId, 0);

    while (unvisited.size > 0) {
      let closestNode: string | null = null;
      let minDistance = Infinity;
      
      for (const nodeId of unvisited) {
        const dist = distances.get(nodeId)!;
        if (dist < minDistance) {
          minDistance = dist;
          closestNode = nodeId;
        }
      }

      if (closestNode === null || closestNode === endNodeId) {
        break;
      }

      unvisited.delete(closestNode);

      const neighbors = this.adjacencyList.get(closestNode) || [];
      for (const neighbor of neighbors) {
        if (!unvisited.has(neighbor.to)) continue;

        const altDistance = distances.get(closestNode)! + neighbor.weight;
        if (altDistance < distances.get(neighbor.to)!) {
          distances.set(neighbor.to, altDistance);
          previous.set(neighbor.to, closestNode);
        }
      }
    }

    const path: CampusNode[] = [];
    let current: string | null = endNodeId;

    if (distances.get(endNodeId) === Infinity) {
      return null; // No path found
    }

    while (current !== null) {
      path.unshift(this.nodes.get(current)!);
      current = previous.get(current)!;
    }

    return path;
  }
}

export const pathfindingService = new PathfindingService();
