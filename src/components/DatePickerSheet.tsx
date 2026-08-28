import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { canvas, text, border, accent, glass } from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

interface DatePickerSheetProps {
  holidays?: {date: string, title: string}[];
  visible: boolean;
  initialDate: string; // YYYY-MM-DD
  minDate?: string; // YYYY-MM-DD
  onClose: () => void;
  onSelect: (date: string) => void;
}

export default function DatePickerSheet({ visible, initialDate, minDate, onClose, onSelect, holidays = [] }: DatePickerSheetProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (visible && initialDate) {
      setCurrentMonth(new Date(initialDate));
    }
  }, [visible, initialDate]);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    
    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    const minDateObj = minDate ? new Date(minDate) : null;
    if (minDateObj) minDateObj.setHours(0,0,0,0);

    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isSelected = dateStr === initialDate;
      const isToday = dateStr === new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      
      const cellDateObj = new Date(dateStr);
      cellDateObj.setHours(0,0,0,0);
      const isPastMin = minDateObj ? cellDateObj < minDateObj : false;
      const isSunday = cellDateObj.getDay() === 0;
      const isHoliday = holidays.some(h => h.date && h.date.startsWith(dateStr));

      days.push(
        <TouchableOpacity
          key={i}
          disabled={isPastMin}
          onPress={() => onSelect(dateStr)}
          style={[
            styles.dayCell,
            isSunday && { backgroundColor: 'rgba(250, 204, 21, 0.1)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(250,204,21,0.5)' },
            isHoliday && { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(59,130,246,0.5)' },
            isSelected && styles.dayCellSelected,
            isPastMin && { opacity: 0.3 }
          ]}
        >
          <Text style={[styles.dayText,
            isSunday && { color: '#facc15' },
            isHoliday && { color: '#3b82f6' },
            isSelected && styles.dayTextSelected,
            isToday && !isSelected && styles.dayTextToday]}>
            {i}
          </Text>
        </TouchableOpacity>
      );
    }
    return days;
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill as any} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={20} color={text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={20} color={text.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.weekDays}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <Text key={d} style={styles.weekDayText}>{d}</Text>
            ))}
          </View>
          
          <View style={styles.grid}>
            {renderCalendar()}
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  sheet: { backgroundColor: canvas.elevated, width: '100%', maxWidth: 360, borderRadius: radius['2xl'], padding: spacing.lg, borderWidth: 1, borderColor: border.default },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  title: { fontFamily: fontFamily.bold, fontSize: fontSize.lg, color: text.primary },
  navBtn: { padding: spacing.sm, backgroundColor: glass.medium, borderRadius: radius.md },
  weekDays: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.sm },
  weekDayText: { color: text.tertiary, fontFamily: fontFamily.bold, fontSize: 12, width: 36, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 2 },
  dayCellSelected: { backgroundColor: accent.primary, borderRadius: 20 },
  dayText: { color: text.primary, fontFamily: fontFamily.medium, fontSize: fontSize.base },
  dayTextSelected: { color: '#fff', fontFamily: fontFamily.bold },
  dayTextToday: { color: accent.primary, fontFamily: fontFamily.bold },
  closeBtn: { marginTop: spacing.xl, padding: spacing.md, alignItems: 'center', backgroundColor: glass.medium, borderRadius: radius.lg },
  closeBtnText: { color: text.secondary, fontFamily: fontFamily.bold },
});
