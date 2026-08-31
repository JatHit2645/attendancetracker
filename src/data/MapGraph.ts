export interface MapNode {
  id: string;
  x: number;
  y: number;
}

export interface MapEdge {
  from: string;
  to: string;
  distance: number;
}

export const MAP_NODES: MapNode[] = [
  // Building Centers
  { id: '1', x: 498, y: 195 },
  { id: '2', x: 434, y: 182 },
  { id: '3', x: 388, y: 240 },
  { id: '4', x: 330, y: 280 },
  { id: '5', x: 278, y: 345 },
  { id: '6', x: 296, y: 185 },
  { id: '7', x: 228, y: 175 },
  { id: '8', x: 195, y: 245 },
  { id: '9', x: 186, y: 302 },
  { id: '10', x: 120, y: 260 },
  { id: '11', x: 174, y: 458 },
  { id: '12', x: 285, y: 495 },
  { id: '13a', x: 348, y: 435 },
  { id: '13b', x: 460, y: 420 },
  { id: '13c', x: 456, y: 495 },
  { id: '14', x: 545, y: 365 },
  { id: '15', x: 415, y: 350 },
  { id: '16', x: 592, y: 485 },
  { id: '17', x: 72, y: 133 },

  // Doorway Nodes (Exit from building to corridor)
  { id: 'door_1', x: 498, y: 260 },
  { id: 'door_2', x: 434, y: 260 },
  { id: 'door_3', x: 388, y: 260 },
  { id: 'door_4', x: 330, y: 260 },
  { id: 'door_5', x: 278, y: 310 },
  { id: 'door_6', x: 296, y: 260 },
  { id: 'door_7', x: 228, y: 260 },
  { id: 'door_8', x: 195, y: 260 },
  { id: 'door_9', x: 150, y: 302 },
  { id: 'door_10', x: 150, y: 260 },
  { id: 'door_11', x: 225, y: 458 },
  { id: 'door_12', x: 250, y: 495 },
  { id: 'door_13a', x: 360, y: 435 },
  { id: 'door_13b', x: 420, y: 420 },
  { id: 'door_13c', x: 480, y: 495 },
  { id: 'door_14', x: 480, y: 365 },
  { id: 'door_15', x: 415, y: 310 },
  { id: 'door_16', x: 480, y: 485 },
  { id: 'door_17', x: 72, y: 260 },

  // Corridor Junctions & Waypoints
  { id: 'wp_main_w2', x: 72, y: 260 },
  { id: 'wp_main_w', x: 150, y: 260 },
  { id: 'wp_main_8', x: 195, y: 260 },
  { id: 'wp_main_7', x: 228, y: 260 },
  { id: 'wp_junc_sw', x: 270, y: 260 },
  { id: 'wp_main_6', x: 296, y: 260 },
  { id: 'wp_main_4', x: 330, y: 260 },
  { id: 'wp_junc_se', x: 360, y: 260 },
  { id: 'wp_main_3', x: 388, y: 260 },
  { id: 'wp_main_2', x: 434, y: 260 },
  { id: 'wp_main_1', x: 498, y: 260 },

  // SW Corridor Path
  { id: 'wp_sw_5', x: 270, y: 310 },
  { id: 'wp_sw_11', x: 225, y: 400 },
  { id: 'wp_sw_12', x: 250, y: 450 },

  // SE Corridor Path
  { id: 'wp_se_15', x: 360, y: 310 },
  { id: 'wp_se_13b', x: 420, y: 380 },
  { id: 'wp_se_14', x: 480, y: 365 },
  { id: 'wp_se_16', x: 480, y: 440 },
];

const calculateDistance = (n1: MapNode, n2: MapNode) => {
  return Math.sqrt(Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2));
};

const rawEdges = [
  // Connect Buildings to Doorways
  ['1', 'door_1'], ['2', 'door_2'], ['3', 'door_3'], ['4', 'door_4'],
  ['5', 'door_5'], ['6', 'door_6'], ['7', 'door_7'], ['8', 'door_8'],
  ['9', 'door_9'], ['10', 'door_10'], ['11', 'door_11'], ['12', 'door_12'],
  ['13a', 'door_13a'], ['13b', 'door_13b'], ['13c', 'door_13c'],
  ['14', 'door_14'], ['15', 'door_15'], ['16', 'door_16'], ['17', 'door_17'],

  // Main Horizontal Corridor
  ['wp_main_w2', 'wp_main_w'],
  ['wp_main_w', 'wp_main_8'],
  ['wp_main_8', 'wp_main_7'],
  ['wp_main_7', 'wp_junc_sw'],
  ['wp_junc_sw', 'wp_main_6'],
  ['wp_main_6', 'wp_main_4'],
  ['wp_main_4', 'wp_junc_se'],
  ['wp_junc_se', 'wp_main_3'],
  ['wp_main_3', 'wp_main_2'],
  ['wp_main_2', 'wp_main_1'],

  // Attach Doorways to Main Corridor
  ['door_17', 'wp_main_w2'],
  ['door_10', 'wp_main_w'],
  ['door_9', 'wp_main_w'], 
  ['door_8', 'wp_main_8'],
  ['door_7', 'wp_main_7'],
  ['door_6', 'wp_main_6'],
  ['door_4', 'wp_main_4'],
  ['door_3', 'wp_main_3'],
  ['door_2', 'wp_main_2'],
  ['door_1', 'wp_main_1'],

  // SW Corridor 
  ['wp_junc_sw', 'wp_sw_5'],
  ['wp_sw_5', 'wp_sw_11'],
  ['wp_sw_11', 'wp_sw_12'],
  
  // Attach Doorways to SW Corridor
  ['door_5', 'wp_sw_5'],
  ['door_11', 'wp_sw_11'],
  ['door_12', 'wp_sw_12'],

  // SE Corridor
  ['wp_junc_se', 'wp_se_15'],
  ['wp_se_15', 'wp_se_13b'],
  ['wp_se_13b', 'wp_se_14'],
  ['wp_se_14', 'wp_se_16'],

  // Attach Doorways to SE Corridor
  ['door_15', 'wp_se_15'],
  ['door_13a', 'wp_se_15'],
  ['door_13b', 'wp_se_13b'],
  ['door_14', 'wp_se_14'],
  ['door_16', 'wp_se_16'],
  ['door_13c', 'wp_se_16'],
];

export const MAP_EDGES: MapEdge[] = rawEdges.map(([from, to]) => {
  const n1 = MAP_NODES.find(n => n.id === from);
  const n2 = MAP_NODES.find(n => n.id === to);
  if (!n1 || !n2) throw new Error(`Missing node for edge: ${from} -> ${to}`);
  return {
    from,
    to,
    distance: calculateDistance(n1, n2),
  };
});
