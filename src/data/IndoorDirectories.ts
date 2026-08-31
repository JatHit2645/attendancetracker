export interface RoomInfo {
  id: string;
  name: string;
  type: 'Classroom' | 'Lab' | 'Office' | 'Washroom' | 'Other';
}

export type FloorDirectory = {
  [floorNumber: number]: RoomInfo[];
};

export const INDOOR_DIRECTORIES: Record<string, FloorDirectory> = {
  // Building 7: Computer Engineering (4 Floors)
  '7': {
    0: [
      { id: '7-G01', name: 'HOD Office - CSE', type: 'Office' },
      { id: '7-G02', name: 'Main Server Room', type: 'Lab' },
      { id: '7-G03', name: 'Faculty Cabin 1-4', type: 'Office' },
      { id: '7-G04', name: 'Boys & Girls Washroom', type: 'Washroom' },
    ],
    1: [
      { id: '7-101', name: 'Programming Lab 1', type: 'Lab' },
      { id: '7-102', name: 'Programming Lab 2', type: 'Lab' },
      { id: '7-103', name: 'Classroom 103', type: 'Classroom' },
      { id: '7-104', name: 'Classroom 104', type: 'Classroom' },
    ],
    2: [
      { id: '7-201', name: 'AI & ML Research Lab', type: 'Lab' },
      { id: '7-202', name: 'Software Engg Lab', type: 'Lab' },
      { id: '7-203', name: 'Faculty Cabin 5-8', type: 'Office' },
      { id: '7-204', name: 'Seminar Hall B', type: 'Classroom' },
    ],
    3: [
      { id: '7-301', name: 'Cloud Computing Center', type: 'Lab' },
      { id: '7-302', name: 'Final Year Project Room', type: 'Lab' },
      { id: '7-303', name: 'Classroom 303', type: 'Classroom' },
      { id: '7-304', name: 'Open Study Area', type: 'Other' },
    ]
  },
  // Building 16: Library (3 Floors)
  '16': {
    0: [
      { id: '16-G01', name: 'Issue/Return Counter', type: 'Office' },
      { id: '16-G02', name: 'Daily News & Magazine Section', type: 'Other' },
      { id: '16-G03', name: 'New Arrivals Display', type: 'Other' },
    ],
    1: [
      { id: '16-101', name: 'Reference Books Section', type: 'Other' },
      { id: '16-102', name: 'Quiet Reading Hall (A)', type: 'Other' },
      { id: '16-103', name: 'E-Library & Computers', type: 'Lab' },
    ],
    2: [
      { id: '16-201', name: 'Journal & Thesis Archives', type: 'Other' },
      { id: '16-202', name: 'Quiet Reading Hall (B)', type: 'Other' },
      { id: '16-203', name: 'Group Discussion Rooms', type: 'Classroom' },
    ]
  },
  // Building 1: Admin Block (3 Floors)
  '1': {
    0: [
      { id: '1-G01', name: 'Reception & Inquiry', type: 'Office' },
      { id: '1-G02', name: 'Student Section', type: 'Office' },
      { id: '1-G03', name: 'Account & Fees Department', type: 'Office' },
    ],
    1: [
      { id: '1-101', name: 'Principal Office', type: 'Office' },
      { id: '1-102', name: 'Board Room', type: 'Office' },
      { id: '1-103', name: 'Registrar Cabin', type: 'Office' },
    ],
    2: [
      { id: '1-201', name: 'TPO (Placement Cell)', type: 'Office' },
      { id: '1-202', name: 'Interview Rooms 1-4', type: 'Other' },
    ]
  }
};
