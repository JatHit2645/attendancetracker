import { MAP_NODES, MAP_EDGES, MapNode } from '../data/MapGraph';

interface RouteResult {
  path: MapNode[];
  totalDistancePixels: number;
  estimatedMinutes: number;
  floorChanges: { nodeId: string; fromFloor: number; toFloor: number }[];
}

export interface MultiFloorRoute {
  segments: { floor: number; path: MapNode[] }[];
  totalDistancePixels: number;
  estimatedMinutes: number;
  floorChanges: { nodeId: string; fromFloor: number; toFloor: number }[];
}

// 1 pixel roughly equals 0.5 meters on our campus map scale
const PIXEL_TO_METER = 0.5;
// Average walking speed = 1.4 m/s (approx 84 m/min)
const METERS_PER_MINUTE = 80;

export const PathfindingService = {
  findShortestPath(startId: string, endId: string): RouteResult | null {
    const nodes = new Map<string, MapNode>();
    MAP_NODES.forEach(n => nodes.set(n.id, n));

    const resolveId = (id: string) => {
      if (nodes.has(`ent_${id}`)) return `ent_${id}`;
      if (nodes.has(`door_${id}`)) return `door_${id}`;
      return id;
    };

    const resolvedStart = resolveId(startId);
    const resolvedEnd = resolveId(endId);

    if (resolvedStart === resolvedEnd) return { path: [], totalDistancePixels: 0, estimatedMinutes: 0, floorChanges: [] };

    const adjacencyList = new Map<string, { to: string; cost: number }[]>();
    MAP_NODES.forEach(n => adjacencyList.set(n.id, []));

    // Build bi-directional graph
    MAP_EDGES.forEach(edge => {
      adjacencyList.get(edge.from)?.push({ to: edge.to, cost: edge.distance });
      adjacencyList.get(edge.to)?.push({ to: edge.from, cost: edge.distance });
    });

    // Dijkstra's Algorithm
    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const unvisited = new Set<string>();

    MAP_NODES.forEach(n => {
      distances.set(n.id, Infinity);
      previous.set(n.id, null);
      unvisited.add(n.id);
    });

    if (!nodes.has(resolvedStart)) return null;

    distances.set(resolvedStart, 0);

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let currentId: string | null = null;
      let minDistance = Infinity;

      unvisited.forEach(id => {
        const dist = distances.get(id)!;
        if (dist < minDistance) {
          minDistance = dist;
          currentId = id;
        }
      });

      if (currentId === null || currentId === resolvedEnd) break;

      unvisited.delete(currentId);
      const currentDist = distances.get(currentId)!;

      const neighbors = adjacencyList.get(currentId) || [];
      for (const neighbor of neighbors) {
        if (!unvisited.has(neighbor.to)) continue;

        const alt = currentDist + neighbor.cost;
        if (alt < distances.get(neighbor.to)!) {
          distances.set(neighbor.to, alt);
          previous.set(neighbor.to, currentId);
        }
      }
    }

    // Backtrack path
    if (distances.get(resolvedEnd) === Infinity) return null; // No path found

    const pathIds: string[] = [];
    let curr: string | null = resolvedEnd;
    while (curr !== null) {
      pathIds.unshift(curr);
      curr = previous.get(curr)!;
    }

    const pathNodes = pathIds.map(id => nodes.get(id)!);
    const totalDistancePixels = distances.get(resolvedEnd)!;
    
    // Time estimation
    const distanceMeters = totalDistancePixels * PIXEL_TO_METER;
    const estimatedMinutes = Math.max(1, Math.ceil(distanceMeters / METERS_PER_MINUTE));

    // Calculate floor changes
    const floorChanges: { nodeId: string; fromFloor: number; toFloor: number }[] = [];
    for (let i = 0; i < pathNodes.length - 1; i++) {
      if (pathNodes[i].floor !== pathNodes[i+1].floor) {
        floorChanges.push({
          nodeId: pathNodes[i].id,
          fromFloor: pathNodes[i].floor,
          toFloor: pathNodes[i+1].floor
        });
      }
    }

    return {
      path: pathNodes,
      totalDistancePixels,
      estimatedMinutes,
      floorChanges
    };
  },

  findMultiFloorPath(startId: string, endId: string): MultiFloorRoute | null {
    const route = this.findShortestPath(startId, endId);
    if (!route) return null;

    const segments: { floor: number; path: MapNode[] }[] = [];
    let currentSegment: MapNode[] = [];
    let currentFloor = route.path.length > 0 ? route.path[0].floor : 0;

    route.path.forEach((node) => {
      if (node.floor !== currentFloor) {
        segments.push({ floor: currentFloor, path: [...currentSegment] });
        currentFloor = node.floor;
        currentSegment = [node];
      } else {
        currentSegment.push(node);
      }
    });

    if (currentSegment.length > 0) {
      segments.push({ floor: currentFloor, path: currentSegment });
    }

    return {
      segments,
      totalDistancePixels: route.totalDistancePixels,
      estimatedMinutes: route.estimatedMinutes,
      floorChanges: route.floorChanges
    };
  }
};
