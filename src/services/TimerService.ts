/**
 * Attendance Tracker — Timer Service
 * 
 * Handles background persistence of stopwatch timer state.
 * Uses AsyncStorage to preserve the start timestamp across app restarts.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const TIMER_STORAGE_KEY = '@attendance_tracker_timer';

export interface TimerState {
  subjectId: string;
  subjectName: string;
  subjectShortName: string;
  startTimeIso: string; // ISO string in UTC, but displayed/processed as IST
  color: string;
}

export const TimerService = {
  /** Starts the timer and persists it */
  async startTimer(subjectId: string, subjectName: string, subjectShortName: string, color: string): Promise<TimerState> {
    const state: TimerState = {
      subjectId,
      subjectName,
      subjectShortName,
      startTimeIso: new Date().toISOString(),
      color,
    };
    await AsyncStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
    return state;
  },

  /** Retrieves the currently running timer, if any */
  async getActiveTimer(): Promise<TimerState | null> {
    try {
      const data = await AsyncStorage.getItem(TIMER_STORAGE_KEY);
      if (data) return JSON.parse(data);
      return null;
    } catch (e) {
      return null;
    }
  },

  /** Clears the active timer (after saving or discarding) */
  async clearTimer(): Promise<void> {
    await AsyncStorage.removeItem(TIMER_STORAGE_KEY);
  },
};
