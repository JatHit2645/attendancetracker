export interface IndoorRoom {
  id: string;
  name: string;
  icon: string;
}

export const INDOOR_DIRECTORIES: Record<string, Record<number, IndoorRoom[]>> = {
  block_7: {
    0: [
      { id: 'cse_g1', name: 'Computer Lab 1', icon: 'desktop-outline' },
      { id: 'cse_g2', name: 'Computer Lab 2', icon: 'desktop-outline' },
      { id: 'cse_g3', name: 'Seminar Hall', icon: 'people-outline' },
    ],
    1: [
      { id: 'cse_11', name: 'HOD Office', icon: 'person-outline' },
      { id: 'cse_12', name: 'Faculty Room', icon: 'people-outline' },
      { id: 'cse_13', name: 'AI/ML Research Lab', icon: 'flask-outline' },
    ],
    2: [
      { id: 'cse_21', name: 'Software Lab', icon: 'code-slash-outline' },
      { id: 'cse_22', name: 'Project Room', icon: 'construct-outline' },
      { id: 'cse_23', name: 'Classroom CR-201', icon: 'school-outline' },
    ],
    3: [
      { id: 'cse_31', name: 'Classroom CR-301', icon: 'school-outline' },
      { id: 'cse_32', name: 'Classroom CR-302', icon: 'school-outline' },
      { id: 'cse_33', name: 'HPC Cluster Room', icon: 'hardware-chip-outline' },
    ],
  },
  block_8: {
    0: [
      { id: 'it_g1', name: 'Networking Lab', icon: 'globe-outline' },
      { id: 'it_g2', name: 'Server Room', icon: 'server-outline' },
    ],
    1: [
      { id: 'it_11', name: 'HOD Office', icon: 'person-outline' },
      { id: 'it_12', name: 'Cloud Computing Lab', icon: 'cloud-outline' },
      { id: 'it_13', name: 'Faculty Room', icon: 'people-outline' },
    ],
    2: [
      { id: 'it_21', name: 'Cybersecurity Lab', icon: 'shield-outline' },
      { id: 'it_22', name: 'Web Tech Studio', icon: 'code-outline' },
      { id: 'it_23', name: 'Classroom IT-201', icon: 'school-outline' },
    ],
    3: [
      { id: 'it_31', name: 'Classroom IT-301', icon: 'school-outline' },
      { id: 'it_32', name: 'Classroom IT-302', icon: 'school-outline' },
      { id: 'it_33', name: 'Seminar Room', icon: 'easel-outline' },
    ],
  },
  block_9: {
    0: [
      { id: 'ece_g1', name: 'Electronics Lab', icon: 'hardware-chip-outline' },
      { id: 'ece_g2', name: 'Embedded Systems Lab', icon: 'hardware-chip-outline' },
    ],
    1: [
      { id: 'ece_11', name: 'HOD Office', icon: 'person-outline' },
      { id: 'ece_12', name: 'VLSI Design Lab', icon: 'git-network-outline' },
      { id: 'ece_13', name: 'Faculty Room', icon: 'people-outline' },
    ],
    2: [
      { id: 'ece_21', name: 'DSP Lab', icon: 'pulse-outline' },
      { id: 'ece_22', name: 'Microwave Lab', icon: 'radio-outline' },
      { id: 'ece_23', name: 'Classroom EC-201', icon: 'school-outline' },
    ],
    3: [
      { id: 'ece_31', name: 'Communication Lab', icon: 'wifi-outline' },
      { id: 'ece_32', name: 'Project Room', icon: 'construct-outline' },
      { id: 'ece_33', name: 'Classroom EC-301', icon: 'school-outline' },
    ],
  },
  block_10: {
    0: [
      { id: 'mw_g1', name: 'Lecture Hall M-01', icon: 'school-outline' },
      { id: 'mw_g2', name: 'Student Activity Hub', icon: 'people-outline' },
    ],
    1: [
      { id: 'mw_11', name: 'Seminar Hall M-101', icon: 'easel-outline' },
      { id: 'mw_12', name: 'Tutorial Room M-102', icon: 'book-outline' },
    ],
    2: [
      { id: 'mw_21', name: 'Tutorial Room M-201', icon: 'book-outline' },
      { id: 'mw_22', name: 'Tutorial Room M-202', icon: 'book-outline' },
    ],
  },
  block_1: {
    0: [
      { id: 'adm_g1', name: 'Reception & Front Desk', icon: 'information-circle-outline' },
      { id: 'adm_g2', name: 'Accounts Office', icon: 'calculator-outline' },
    ],
    1: [
      { id: 'adm_11', name: 'Principal Office', icon: 'person-outline' },
      { id: 'adm_12', name: 'Registrar Office', icon: 'document-text-outline' },
      { id: 'adm_13', name: 'Student Affairs', icon: 'people-outline' },
    ],
    2: [
      { id: 'adm_21', name: 'Board Room', icon: 'business-outline' },
      { id: 'adm_22', name: 'Conference Room', icon: 'chatbubbles-outline' },
    ],
  },
  block_16: {
    0: [
      { id: 'lib_g1', name: 'Reading Hall (Ground)', icon: 'book-outline' },
      { id: 'lib_g2', name: 'Issue/Return Desk', icon: 'swap-horizontal-outline' },
      { id: 'lib_g3', name: 'Digital Reference Lab', icon: 'desktop-outline' },
    ],
    1: [
      { id: 'lib_11', name: 'Silent Reading Zone', icon: 'volume-mute-outline' },
      { id: 'lib_12', name: 'Journal Archives', icon: 'newspaper-outline' },
    ],
    2: [
      { id: 'lib_21', name: 'Research Section', icon: 'flask-outline' },
      { id: 'lib_22', name: 'Group Study Rooms', icon: 'people-outline' },
    ],
  },
  block_6: {
    0: [
      { id: 'ee_g1', name: 'Power Systems Lab', icon: 'flash-outline' },
      { id: 'ee_g2', name: 'Machines Lab', icon: 'cog-outline' },
    ],
    1: [
      { id: 'ee_11', name: 'HOD Office', icon: 'person-outline' },
      { id: 'ee_12', name: 'Control Systems Lab', icon: 'analytics-outline' },
    ],
    2: [
      { id: 'ee_21', name: 'Renewable Energy Center', icon: 'sunny-outline' },
      { id: 'ee_22', name: 'Classroom EE-201', icon: 'school-outline' },
    ],
  },
  block_3: {
    0: [
      { id: 'ch_g1', name: 'Chemical Process Lab', icon: 'flask-outline' },
      { id: 'ch_g2', name: 'Heat Transfer Lab', icon: 'thermometer-outline' },
    ],
    1: [
      { id: 'ch_11', name: 'HOD Office', icon: 'person-outline' },
      { id: 'ch_12', name: 'Reaction Engineering Lab', icon: 'beaker-outline' },
    ],
    2: [
      { id: 'ch_21', name: 'Classroom CH-201', icon: 'school-outline' },
      { id: 'ch_22', name: 'Faculty Cabins', icon: 'people-outline' },
    ],
  },
  block_4: {
    0: [
      { id: 'bt_g1', name: 'Microbiology Lab', icon: 'flask-outline' },
      { id: 'bt_g2', name: 'Genetic Engineering Lab', icon: 'medkit-outline' },
    ],
    1: [
      { id: 'bt_11', name: 'HOD Office', icon: 'person-outline' },
      { id: 'bt_12', name: 'Bioinformatics Lab', icon: 'laptop-outline' },
    ],
    2: [
      { id: 'bt_21', name: 'Research Facility', icon: 'flask-outline' },
      { id: 'bt_22', name: 'Classroom BT-201', icon: 'school-outline' },
    ],
  },
  block_5: {
    0: [
      { id: 'me_g1', name: 'Thermodynamics Lab', icon: 'thermometer-outline' },
      { id: 'me_g2', name: 'Fluid Mechanics Lab', icon: 'water-outline' },
    ],
    1: [
      { id: 'me_11', name: 'HOD Office', icon: 'person-outline' },
      { id: 'me_12', name: 'CAD/CAM Studio', icon: 'construct-outline' },
    ],
    2: [
      { id: 'me_21', name: 'Departmental Library', icon: 'library-outline' },
      { id: 'me_22', name: 'Classroom ME-201', icon: 'school-outline' },
    ],
  },
  block_2: {
    0: [
      { id: 'hs_g1', name: 'Physics Lab', icon: 'planet-outline' },
      { id: 'hs_g2', name: 'Chemistry Lab', icon: 'flask-outline' },
    ],
    1: [
      { id: 'hs_11', name: 'Mathematics Department', icon: 'calculator-outline' },
      { id: 'hs_12', name: 'Communication Skills Lab', icon: 'mic-outline' },
    ],
    2: [
      { id: 'hs_21', name: 'Classroom HS-201', icon: 'school-outline' },
      { id: 'hs_22', name: 'Faculty Cabins', icon: 'people-outline' },
    ],
  },
  block_17: {
    0: [
      { id: 'can_g1', name: 'Main Cafeteria', icon: 'restaurant-outline' },
      { id: 'can_g2', name: 'Juice Bar', icon: 'cafe-outline' },
      { id: 'can_g3', name: 'Snacks Counter', icon: 'fast-food-outline' },
      { id: 'can_g4', name: 'Outdoor Patio', icon: 'umbrella-outline' },
    ],
  },
  block_11: {
    0: [
      { id: 'ws_g1', name: 'Foundry & Smithy', icon: 'hammer-outline' },
      { id: 'ws_g2', name: 'Welding Shop', icon: 'flash-outline' },
      { id: 'ws_g3', name: 'Carpentry Section', icon: 'cut-outline' },
      { id: 'ws_g4', name: 'CNC Machine Shop', icon: 'cog-outline' },
    ],
  },
  block_12: {
    0: [
      { id: 'ce_g1', name: 'Concrete Tech Lab', icon: 'cube-outline' },
      { id: 'ce_g2', name: 'Surveying Equipment', icon: 'compass-outline' },
    ],
    1: [
      { id: 'ce_11', name: 'HOD Office', icon: 'person-outline' },
      { id: 'ce_12', name: 'Geotechnical Lab', icon: 'earth-outline' },
    ],
    2: [
      { id: 'ce_21', name: 'Structural Lab', icon: 'construct-outline' },
      { id: 'ce_22', name: 'Classroom CE-201', icon: 'school-outline' },
    ],
  },
  block_14: {
    0: [
      { id: 'rd_g1', name: 'Startup Incubator', icon: 'rocket-outline' },
      { id: 'rd_g2', name: 'Patent Cell', icon: 'document-outline' },
    ],
    1: [
      { id: 'rd_11', name: 'Central Testing Lab', icon: 'flask-outline' },
      { id: 'rd_12', name: 'Industry Collaboration', icon: 'business-outline' },
    ],
  },
};
