export interface CampusBuilding {
  id: string;
  name: string;
  shortName: string;
  color: string;
  points: string;
  type?: 'building' | 'garden' | 'amenity';
}

// Normalized dimensions based on actual blueprint aspect ratio (1024x573)
export const MAP_WIDTH = 800;
export const MAP_HEIGHT = 650;

export const CAMPUS_BUILDINGS: CampusBuilding[] = [
  {
    "id": "17",
    "name": "Canteen",
    "shortName": "CAN",
    "color": "#D1D5DB",
    "points": "65.4,99.5 50.8,115.1 50.8,134.6 43.9,140.5 50.8,146.3 54.7,160.0 73.2,164.9 81.1,161.9 88.9,166.8 105.5,154.1 94.7,147.3 89.8,116.1 75.2,115.1 74.2,103.4",
    "type": "amenity"
  },
  {
    "id": "7",
    "name": "Computer Engineering",
    "shortName": "CSE",
    "color": "#94A3B8",
    "points": "155.3,212.7 176.8,210.7 187.5,187.3 246.1,176.6 247.1,227.3 212.9,249.7 221.7,278.0 161.1,279.0 152.3,212.7",
    "type": "building"
  },
  {
    "id": "6",
    "name": "Electrical Engineering",
    "shortName": "EE",
    "color": "#D8B4E2",
    "points": "264.6,275.1 265.6,254.6 290.0,255.6 290.0,229.3 313.5,228.3 314.5,204.9 360.4,205.8 359.4,276.1",
    "type": "building"
  },
  {
    "id": "2",
    "name": "Applied Humanities & Sc.",
    "shortName": "AHS",
    "color": "#F472B6",
    "points": "423.8,276.1 421.9,271.2 463.9,229.3 466.8,229.3 468.8,257.5 452.1,260.5 451.2,276.1",
    "type": "building"
  },
  {
    "id": "1",
    "name": "Admin Block",
    "shortName": "ADMIN",
    "color": "#FDE047",
    "points": "480.5,225.4 485.4,194.1 481.4,179.5 557.6,178.5 532.2,201.0 531.2,180.5 552.7,179.5 531.2,179.5 530.3,205.8 528.3,179.5 514.6,179.5 512.7,199.0 503.9,187.3 528.3,208.8 506.8,229.3",
    "type": "building"
  },
  {
    "id": "3",
    "name": "Chemical Engineering",
    "shortName": "CHEM",
    "color": "#FDBA74",
    "points": "373.0,255.6 392.6,254.6 395.5,259.5 395.5,276.1 373.0,277.1",
    "type": "building"
  },
  {
    "id": "10",
    "name": "M-Wing",
    "shortName": "MW",
    "color": "#FCA5A5",
    "points": "102.5,219.5 138.7,221.5 136.7,321.0 101.6,320.0 100.6,279.0 105.5,273.2 100.6,261.5",
    "type": "building"
  },
  {
    "id": "8",
    "name": "Information Technology",
    "shortName": "IT",
    "color": "#7DD3FC",
    "points": "264.6,305.4 272.5,301.5 281.2,288.8 301.8,289.7 302.7,295.6 309.6,297.5 309.6,325.8 302.7,327.8 303.7,333.6 274.4,334.6 270.5,327.8",
    "type": "building"
  },
  {
    "id": "9",
    "name": "Electronics & Comm.",
    "shortName": "ECE",
    "color": "#FBCFE8",
    "points": "155.3,330.7 217.8,329.7 243.2,338.5 243.2,352.2 226.6,352.2 218.8,343.4 201.2,361.0 226.6,371.7 228.5,385.3 198.2,387.3 197.3,360.0 191.4,361.0 188.5,335.6 156.2,351.2",
    "type": "building"
  },
  {
    "id": "4",
    "name": "Bio Technology",
    "shortName": "BIO",
    "color": "#86EFAC",
    "points": "250.0,442.9 304.7,388.3 335.0,418.5 317.4,437.1 322.3,445.8 303.7,465.3 274.4,439.0 260.7,452.7",
    "type": "building"
  },
  {
    "id": "15",
    "name": "Central Garden",
    "shortName": "GARDEN",
    "color": "#4ADE80",
    "points": "502.9,294.6 502.0,353.2 400.4,456.6 387.7,443.9 404.3,424.4 370.1,390.2 345.7,403.9 320.3,380.5 406.2,293.6",
    "type": "garden"
  },
  {
    "id": "5",
    "name": "Mechanical Engineering",
    "shortName": "MECH",
    "color": "#D1D5DB",
    "points": "300.8,468.3 328.1,453.6 349.6,469.2 356.4,466.3 349.6,472.2 331.1,454.6 312.5,479.0",
    "type": "building"
  },
  {
    "id": "13",
    "name": "Class Rooms",
    "shortName": "CLASS",
    "color": "#D9F99D",
    "points": "419.9,451.7 430.7,462.4 444.3,463.4 441.4,467.3 437.5,469.2 420.9,485.8 401.4,466.3 405.3,461.4",
    "type": "building"
  },
  {
    "id": "16",
    "name": "Library",
    "shortName": "LIB",
    "color": "#059669",
    "points": "571.3,422.4 594.7,431.2 606.4,423.4 614.3,433.2 600.6,449.7 620.1,454.6 620.1,469.2 634.8,483.9 620.1,500.5 620.1,515.1 603.5,517.1 588.9,531.7 572.3,517.1 558.6,517.1 555.7,500.5 541.0,485.8 555.7,470.2 556.6,454.6 576.2,449.7 561.5,433.2",
    "type": "building"
  },
  {
    "id": "11",
    "name": "Mechanical Workshop",
    "shortName": "WORK",
    "color": "#9CA3AF",
    "points": "238.3,480.0 258.8,500.5 283.2,468.3 281.2,478.0 267.6,488.8 240.2,478.0 258.8,464.4 277.3,476.1 271.5,484.9",
    "type": "building"
  },
  {
    "id": "12",
    "name": "Civil Engineering",
    "shortName": "CIVIL",
    "color": "#FDBA74",
    "points": "208.0,510.2 216.8,506.3 238.3,480.0 243.2,489.7 256.8,499.5 229.5,526.8 258.8,500.5 229.5,529.7",
    "type": "building"
  },
  {
    "id": "14",
    "name": "Research & Consultancy",
    "shortName": "R&C",
    "color": "#FDA4AF",
    "points": "429.7,493.6 447.3,513.1 460.0,503.4 461.9,497.5 478.5,485.8 460.0,464.4",
    "type": "building"
  }
];

export const WALKWAYS = [
  "138,270 264,270",
  "264,200 264,350",
  "360,240 420,240",
  "320,380 400,380",
  "400,380 570,450",
  "300,440 240,480",
];
