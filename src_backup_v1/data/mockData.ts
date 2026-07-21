/**
 * Attendance Tracker — Mock Data Layer
 * 
 * Realistic academic attendance data for development & testing.
 * This will be replaced by real Supabase queries once backend is connected.
 * 
 * Every value here follows the PRD's "Single Source of Truth" principle:
 * Percentages are calculated dynamically from raw attended/conducted counts,
 * never hardcoded.
 */

// ─── Types ─────────────────────────────────────────────────────────

export interface Subject {
  id: string;
  name: string;
  shortName: string;
  /** Total lectures conducted */
  totalConducted: number;
  /** Total lectures attended */
  totalAttended: number;
  /** Total lectures cancelled by faculty */
  totalCancelled: number;
  /** Target attendance threshold (percentage) */
  threshold: number;
  /** Subject color accent for visual distinction */
  color: string;
  /** Whether this subject is active or archived */
  isActive: boolean;
}

export interface AttendanceRecord {
  id: string;
  subjectId: string;
  date: string; // ISO date string
  status: 'present' | 'absent' | 'cancelled' | 'missed';
  /** How this record was created */
  source: 'manual' | 'timer' | 'timetable';
  createdAt: string;
}

export interface TodayScheduleItem {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectShortName: string;
  startTime: string; // e.g., "09:00"
  endTime: string;   // e.g., "10:00"
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  attendanceStatus?: 'present' | 'absent' | 'cancelled' | 'missed';
  color: string;
}

export interface DashboardStats {
  totalSubjects: number;
  totalConducted: number;
  totalAttended: number;
  totalMissed: number;
  totalCancelled: number;
  overallPercentage: number;
  defaultThreshold: number;
}

// ─── Subject Colors (Curated, non-generic) ─────────────────────────
const subjectColors = {
  indigo: '#6366F1',
  emerald: '#10B981',
  rose: '#F43F5E',
  amber: '#F59E0B',
  cyan: '#22D3EE',
  violet: '#8B5CF6',
  orange: '#F97316',
  teal: '#14B8A6',
};

// ─── Mock Subjects ─────────────────────────────────────────────────
export const mockSubjects: Subject[] = [
  {
    id: 'sub-001',
    name: 'Data Structures & Algorithms',
    shortName: 'DSA',
    totalConducted: 42,
    totalAttended: 38,
    totalCancelled: 2,
    threshold: 75,
    color: subjectColors.indigo,
    isActive: true,
  },
  {
    id: 'sub-002',
    name: 'Operating Systems',
    shortName: 'OS',
    totalConducted: 38,
    totalAttended: 30,
    totalCancelled: 1,
    threshold: 75,
    color: subjectColors.emerald,
    isActive: true,
  },
  {
    id: 'sub-003',
    name: 'Database Management Systems',
    shortName: 'DBMS',
    totalConducted: 35,
    totalAttended: 33,
    totalCancelled: 3,
    threshold: 75,
    color: subjectColors.cyan,
    isActive: true,
  },
  {
    id: 'sub-004',
    name: 'Computer Networks',
    shortName: 'CN',
    totalConducted: 40,
    totalAttended: 28,
    totalCancelled: 0,
    threshold: 75,
    color: subjectColors.rose,
    isActive: true,
  },
  {
    id: 'sub-005',
    name: 'Mathematics III',
    shortName: 'M3',
    totalConducted: 36,
    totalAttended: 34,
    totalCancelled: 1,
    threshold: 75,
    color: subjectColors.amber,
    isActive: true,
  },
  {
    id: 'sub-006',
    name: 'Physics Laboratory',
    shortName: 'PHY LAB',
    totalConducted: 12,
    totalAttended: 11,
    totalCancelled: 0,
    threshold: 85,
    color: subjectColors.violet,
    isActive: true,
  },
];

// ─── Today's Schedule ──────────────────────────────────────────────
export const mockTodaySchedule: TodayScheduleItem[] = [
  {
    id: 'sch-001',
    subjectId: 'sub-001',
    subjectName: 'Data Structures & Algorithms',
    subjectShortName: 'DSA',
    startTime: '09:00',
    endTime: '10:00',
    status: 'completed',
    attendanceStatus: 'present',
    color: subjectColors.indigo,
  },
  {
    id: 'sch-002',
    subjectId: 'sub-002',
    subjectName: 'Operating Systems',
    subjectShortName: 'OS',
    startTime: '10:15',
    endTime: '11:15',
    status: 'completed',
    attendanceStatus: 'present',
    color: subjectColors.emerald,
  },
  {
    id: 'sch-003',
    subjectId: 'sub-004',
    subjectName: 'Computer Networks',
    subjectShortName: 'CN',
    startTime: '11:30',
    endTime: '12:30',
    status: 'ongoing',
    color: subjectColors.rose,
  },
  {
    id: 'sch-004',
    subjectId: 'sub-003',
    subjectName: 'Database Management Systems',
    subjectShortName: 'DBMS',
    startTime: '14:00',
    endTime: '15:00',
    status: 'upcoming',
    color: subjectColors.cyan,
  },
  {
    id: 'sch-005',
    subjectId: 'sub-005',
    subjectName: 'Mathematics III',
    subjectShortName: 'M3',
    startTime: '15:15',
    endTime: '16:15',
    status: 'upcoming',
    color: subjectColors.amber,
  },
];

// ─── Utility Functions (PRD: Dynamic Calculations) ──────────────────

/** Calculate attendance percentage from raw counts — never stored */
export function calculatePercentage(attended: number, conducted: number): number {
  if (conducted === 0) return 100;
  return Math.round((attended / conducted) * 1000) / 10; // One decimal place
}

/** Determine status based on percentage vs threshold */
export function getAttendanceStatus(
  percentage: number,
  threshold: number
): 'safe' | 'warning' | 'danger' | 'critical' {
  if (percentage >= threshold + 10) return 'safe';
  if (percentage >= threshold) return 'warning';
  if (percentage >= threshold - 10) return 'danger';
  return 'critical';
}

/** Calculate how many more lectures needed to reach threshold */
export function lecturesNeededForTarget(
  attended: number,
  conducted: number,
  threshold: number
): number {
  // Formula: (attended + x) / (conducted + x) >= threshold/100
  // x >= (threshold * conducted - 100 * attended) / (100 - threshold)
  const numerator = (threshold * conducted) / 100 - attended;
  const denominator = 1 - threshold / 100;
  if (denominator <= 0) return Infinity;
  const needed = Math.ceil(numerator / denominator);
  return Math.max(0, needed);
}

/** Calculate how many lectures can be missed while staying above threshold */
export function lecturesCanMiss(
  attended: number,
  conducted: number,
  threshold: number
): number {
  // (attended) / (conducted + x) >= threshold/100
  // x <= (100 * attended / threshold) - conducted
  const maxTotal = (100 * attended) / threshold;
  const canMiss = Math.floor(maxTotal - conducted);
  return Math.max(0, canMiss);
}

/** Get overall dashboard stats from all subjects */
export function getDashboardStats(subjects: Subject[]): DashboardStats {
  const activeSubjects = subjects.filter((s) => s.isActive);
  const totalConducted = activeSubjects.reduce((sum, s) => sum + s.totalConducted, 0);
  const totalAttended = activeSubjects.reduce((sum, s) => sum + s.totalAttended, 0);
  const totalMissed = totalConducted - totalAttended;
  const totalCancelled = activeSubjects.reduce((sum, s) => sum + s.totalCancelled, 0);

  return {
    totalSubjects: activeSubjects.length,
    totalConducted,
    totalAttended,
    totalMissed,
    totalCancelled,
    overallPercentage: calculatePercentage(totalAttended, totalConducted),
    defaultThreshold: 75,
  };
}
