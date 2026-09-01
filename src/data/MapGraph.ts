export interface MapNode {
  id: string;
  x: number;
  y: number;
  floor: number;
  type: 'entrance' | 'corridor' | 'staircase';
}

export interface MapEdge {
  from: string;
  to: string;
  distance: number;
  floor: number;
}

export const MAP_NODES: MapNode[] = [
  // Doorways
  { id: 'door_1', x: 498, y: 220, floor: 0, type: 'entrance' },
  { id: 'door_2', x: 434, y: 229, floor: 0, type: 'entrance' },
  { id: 'door_3', x: 388, y: 255, floor: 0, type: 'entrance' },
  { id: 'door_4', x: 330, y: 260, floor: 0, type: 'entrance' },
  { id: 'door_5', x: 278, y: 310, floor: 0, type: 'entrance' },
  { id: 'door_6', x: 296, y: 229, floor: 0, type: 'entrance' },
  { id: 'door_7', x: 228, y: 227, floor: 0, type: 'entrance' },
  { id: 'door_8', x: 195, y: 260, floor: 0, type: 'entrance' },
  { id: 'door_9', x: 186, y: 330, floor: 0, type: 'entrance' },
  { id: 'door_10', x: 120, y: 220, floor: 0, type: 'entrance' },
  { id: 'door_11', x: 225, y: 458, floor: 0, type: 'entrance' },
  { id: 'door_12', x: 250, y: 495, floor: 0, type: 'entrance' },
  { id: 'door_13a', x: 360, y: 435, floor: 0, type: 'entrance' },
  { id: 'door_13b', x: 420, y: 420, floor: 0, type: 'entrance' },
  { id: 'door_13c', x: 480, y: 495, floor: 0, type: 'entrance' },
  { id: 'door_14', x: 480, y: 365, floor: 0, type: 'entrance' },
  { id: 'door_15', x: 415, y: 290, floor: 0, type: 'entrance' },
  { id: 'door_16', x: 480, y: 485, floor: 0, type: 'entrance' },
  { id: 'door_17', x: 72, y: 170, floor: 0, type: 'entrance' },

  // Staircases for buildings 7, 8, 9 (4-floor buildings)
  { id: 'stair_7_0', x: 228, y: 200, floor: 0, type: 'staircase' },
  { id: 'stair_7_1', x: 228, y: 200, floor: 1, type: 'staircase' },
  { id: 'stair_7_2', x: 228, y: 200, floor: 2, type: 'staircase' },
  { id: 'stair_7_3', x: 228, y: 200, floor: 3, type: 'staircase' },
  
  { id: 'stair_8_0', x: 195, y: 275, floor: 0, type: 'staircase' },
  { id: 'stair_8_1', x: 195, y: 275, floor: 1, type: 'staircase' },
  { id: 'stair_8_2', x: 195, y: 275, floor: 2, type: 'staircase' },
  { id: 'stair_8_3', x: 195, y: 275, floor: 3, type: 'staircase' },

  { id: 'stair_9_0', x: 186, y: 350, floor: 0, type: 'staircase' },
  { id: 'stair_9_1', x: 186, y: 350, floor: 1, type: 'staircase' },
  { id: 'stair_9_2', x: 186, y: 350, floor: 2, type: 'staircase' },
  { id: 'stair_9_3', x: 186, y: 350, floor: 3, type: 'staircase' },

  // Corridor Waypoints - Main Line
  { id: 'wp_m_1', x: 72, y: 245, floor: 0, type: 'corridor' },
  { id: 'wp_m_2', x: 120, y: 245, floor: 0, type: 'corridor' },
  { id: 'wp_m_3', x: 150, y: 245, floor: 0, type: 'corridor' },
  { id: 'wp_m_4', x: 186, y: 245, floor: 0, type: 'corridor' },
  { id: 'wp_m_5', x: 200, y: 245, floor: 0, type: 'corridor' },
  { id: 'wp_m_6', x: 228, y: 245, floor: 0, type: 'corridor' },
  { id: 'wp_m_7', x: 250, y: 245, floor: 0, type: 'corridor' }, // Junction SW
  { id: 'wp_m_8', x: 278, y: 245, floor: 0, type: 'corridor' },
  { id: 'wp_m_9', x: 296, y: 245, floor: 0, type: 'corridor' },
  { id: 'wp_m_10', x: 330, y: 245, floor: 0, type: 'corridor' },
  { id: 'wp_m_11', x: 360, y: 245, floor: 0, type: 'corridor' }, // Junction SE
  { id: 'wp_m_12', x: 388, y: 245, floor: 0, type: 'corridor' },
  { id: 'wp_m_13', x: 415, y: 245, floor: 0, type: 'corridor' },
  { id: 'wp_m_14', x: 434, y: 245, floor: 0, type: 'corridor' },
  { id: 'wp_m_15', x: 480, y: 245, floor: 0, type: 'corridor' },
  { id: 'wp_m_16', x: 498, y: 245, floor: 0, type: 'corridor' },
  { id: 'wp_m_17', x: 520, y: 245, floor: 0, type: 'corridor' },

  // Corridor Waypoints - SW Line
  { id: 'wp_sw_1', x: 250, y: 280, floor: 0, type: 'corridor' },
  { id: 'wp_sw_2', x: 250, y: 310, floor: 0, type: 'corridor' },
  { id: 'wp_sw_3', x: 250, y: 345, floor: 0, type: 'corridor' },
  { id: 'wp_sw_4', x: 250, y: 380, floor: 0, type: 'corridor' },
  { id: 'wp_sw_5', x: 250, y: 410, floor: 0, type: 'corridor' },
  { id: 'wp_sw_6', x: 250, y: 458, floor: 0, type: 'corridor' },
  { id: 'wp_sw_7', x: 250, y: 495, floor: 0, type: 'corridor' },

  // Corridor Waypoints - SE Line
  { id: 'wp_se_1', x: 360, y: 280, floor: 0, type: 'corridor' },
  { id: 'wp_se_2', x: 360, y: 310, floor: 0, type: 'corridor' },
  { id: 'wp_se_3', x: 360, y: 350, floor: 0, type: 'corridor' },
  { id: 'wp_se_4', x: 360, y: 390, floor: 0, type: 'corridor' },
  { id: 'wp_se_5', x: 360, y: 435, floor: 0, type: 'corridor' },
  { id: 'wp_se_6', x: 380, y: 435, floor: 0, type: 'corridor' },
  { id: 'wp_se_7', x: 420, y: 435, floor: 0, type: 'corridor' },
  { id: 'wp_se_8', x: 420, y: 420, floor: 0, type: 'corridor' },
  { id: 'wp_se_9', x: 450, y: 435, floor: 0, type: 'corridor' },
  { id: 'wp_se_10', x: 480, y: 435, floor: 0, type: 'corridor' },
  { id: 'wp_se_11', x: 480, y: 365, floor: 0, type: 'corridor' },
  { id: 'wp_se_12', x: 480, y: 400, floor: 0, type: 'corridor' },
  { id: 'wp_se_13', x: 480, y: 485, floor: 0, type: 'corridor' },
  { id: 'wp_se_14', x: 480, y: 495, floor: 0, type: 'corridor' },

  // Corridor Waypoints - Garden Loop (Around block 15)
  { id: 'wp_g_1', x: 380, y: 280, floor: 0, type: 'corridor' },
  { id: 'wp_g_2', x: 450, y: 280, floor: 0, type: 'corridor' },
  { id: 'wp_g_3', x: 450, y: 310, floor: 0, type: 'corridor' },
  { id: 'wp_g_4', x: 450, y: 350, floor: 0, type: 'corridor' },
  { id: 'wp_g_5', x: 450, y: 390, floor: 0, type: 'corridor' },
];

const calculateDistance = (n1: MapNode, n2: MapNode) => {
  if (n1.floor !== n2.floor) return 15; // Staircase vertical distance
  return Math.sqrt(Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2));
};

const rawEdges: [string, string][] = [
  // Main Corridor Connections
  ['wp_m_1', 'wp_m_2'], ['wp_m_2', 'wp_m_3'], ['wp_m_3', 'wp_m_4'],
  ['wp_m_4', 'wp_m_5'], ['wp_m_5', 'wp_m_6'], ['wp_m_6', 'wp_m_7'],
  ['wp_m_7', 'wp_m_8'], ['wp_m_8', 'wp_m_9'], ['wp_m_9', 'wp_m_10'],
  ['wp_m_10', 'wp_m_11'], ['wp_m_11', 'wp_m_12'], ['wp_m_12', 'wp_m_13'],
  ['wp_m_13', 'wp_m_14'], ['wp_m_14', 'wp_m_15'], ['wp_m_15', 'wp_m_16'],
  ['wp_m_16', 'wp_m_17'],

  // SW Corridor Connections
  ['wp_m_7', 'wp_sw_1'], ['wp_sw_1', 'wp_sw_2'], ['wp_sw_2', 'wp_sw_3'],
  ['wp_sw_3', 'wp_sw_4'], ['wp_sw_4', 'wp_sw_5'], ['wp_sw_5', 'wp_sw_6'],
  ['wp_sw_6', 'wp_sw_7'],

  // SE Corridor Connections
  ['wp_m_11', 'wp_se_1'], ['wp_se_1', 'wp_se_2'], ['wp_se_2', 'wp_se_3'],
  ['wp_se_3', 'wp_se_4'], ['wp_se_4', 'wp_se_5'], ['wp_se_5', 'wp_se_6'],
  ['wp_se_6', 'wp_se_7'], ['wp_se_7', 'wp_se_8'], ['wp_se_7', 'wp_se_9'],
  ['wp_se_9', 'wp_se_10'], ['wp_se_10', 'wp_se_11'], ['wp_se_10', 'wp_se_12'],
  ['wp_se_12', 'wp_se_13'], ['wp_se_13', 'wp_se_14'],

  // Garden Loop Connections
  ['wp_se_1', 'wp_g_1'], ['wp_m_14', 'wp_g_2'], ['wp_g_2', 'wp_g_3'],
  ['wp_g_3', 'wp_g_4'], ['wp_g_4', 'wp_g_5'], ['wp_g_5', 'wp_se_9'],

  // Door Connections to Corridors
  ['door_1', 'wp_m_16'],
  ['door_2', 'wp_m_14'],
  ['door_3', 'wp_m_12'],
  ['door_4', 'wp_m_10'],
  ['door_5', 'wp_sw_2'],
  ['door_6', 'wp_m_9'],
  ['door_7', 'wp_m_6'],
  ['door_8', 'wp_m_4'],
  ['door_9', 'wp_sw_3'],
  ['door_10', 'wp_m_2'],
  ['door_11', 'wp_sw_6'],
  ['door_12', 'wp_sw_7'],
  ['door_13a', 'wp_se_5'],
  ['door_13b', 'wp_se_8'],
  ['door_13c', 'wp_se_14'],
  ['door_14', 'wp_se_11'],
  ['door_15', 'wp_m_13'],
  ['door_16', 'wp_se_13'],
  ['door_17', 'wp_m_1'],

  // Connecting doorways to staircases
  ['door_7', 'stair_7_0'],
  ['door_8', 'stair_8_0'],
  ['door_9', 'stair_9_0'],

  // Staircase Vertical Connections
  ['stair_7_0', 'stair_7_1'], ['stair_7_1', 'stair_7_2'], ['stair_7_2', 'stair_7_3'],
  ['stair_8_0', 'stair_8_1'], ['stair_8_1', 'stair_8_2'], ['stair_8_2', 'stair_8_3'],
  ['stair_9_0', 'stair_9_1'], ['stair_9_1', 'stair_9_2'], ['stair_9_2', 'stair_9_3'],
];

export const MAP_EDGES: MapEdge[] = rawEdges.map(([from, to]) => {
  const n1 = MAP_NODES.find(n => n.id === from);
  const n2 = MAP_NODES.find(n => n.id === to);
  if (!n1 || !n2) throw new Error(`Missing node for edge: ${from} -> ${to}`);
  return {
    from,
    to,
    distance: calculateDistance(n1, n2),
    floor: n1.floor === n2.floor ? n1.floor : Math.min(n1.floor, n2.floor) // Represents edge floor
  };
});
