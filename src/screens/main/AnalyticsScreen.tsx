/**
 * Attendance Tracker — Analytics & History Screen (Phase 4)
 * 
 * Displays historical attendance logs, a monthly calendar view, and trend graphs.
 * Features:
 * - Dynamic Selector Dropdown for time periods (Months & Semesters).
 * - Real JS Date calendar calculations ensuring weekday alignments in proper Week-Rows.
 * - Dynamic color gradient heatmap showing attendance health.
 * - Dynamic content recalculations (risk cards, progress tracks, compliance markers).
 * - Export functions for CSV and PDF on mobile.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import {
  canvas,
  glass,
  border,
  text as textColors,
  accent,
  shadow,
  attendance as attendanceColors,
  gauge as gaugeColors,
} from '../../theme/colors';
import { fontFamily, fontSize, textStyle } from '../../theme/typography';
import { spacing, radius, layout } from '../../theme/spacing';
import { DatabaseService } from '../../services/DatabaseService';
import { Database } from '../../lib/database.types';
import { supabase } from '../../lib/supabase';
import HolidayManagerSheet from '../../components/HolidayManagerSheet';

type SubjectRow = Database['public']['Tables']['subjects']['Row'];
type RecordRow = Database['public']['Tables']['attendance_records']['Row'];

const calculatePercentage = (attended: number, conducted: number) => {
  if (conducted === 0) return 0;
  return Math.round((attended / conducted) * 100);
};

// Dynamic Time Periods config
interface TimePeriod {
  id: string;
  label: string;
  type: 'month' | 'semester';
  year: number;
  monthIndex?: number; // 0-11
  startMonthIndex?: number;
  endMonthIndex?: number;
}

interface CalendarDay {
  day: number | null;
  dateStr: string | null;
  ratio: number;
}

// ── Helper to build month matrix ──
const getCalendarMatrix = (year: number, monthIndex: number, allRecords: RecordRow[], holidays: any[]): CalendarDay[] => {
  const matrix: CalendarDay[] = [];
  const firstDay = new Date(year, monthIndex, 1);
  const startDayOfWeek = firstDay.getDay(); // 0=Sun, 1=Mon, etc.
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();

  // 1. Padding days for start of month
  for (let i = 0; i < startDayOfWeek; i++) {
    matrix.push({ day: null, dateStr: null, ratio: -2 });
  }

  // 2. Calendar active days
  for (let d = 1; d <= totalDays; d++) {
    const currentDate = new Date(year, monthIndex, d);
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0; // Only Sunday is weekend by default

    const dateStr = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    const dayRecords = allRecords.filter(r => r.date === dateStr);

    let ratio = -1; // Holiday/Weekend (Off)
    const isHoliday = holidays.some(h => h.date && h.date.startsWith(dateStr));
    
    if (isHoliday) {
      ratio = -3; // Holiday
    } else if (dayRecords.length > 0) {
      const presentCount = dayRecords.filter(r => r.status === 'present').length;
      ratio = presentCount / dayRecords.length;
    } else if (!isWeekend) {
      ratio = -1;
    }

    matrix.push({ day: d, dateStr, ratio });
  }

  // 3. Padding days for end of month to complete the 7-day grid
  const remainingDays = matrix.length % 7;
  if (remainingDays > 0) {
    const padEnd = 7 - remainingDays;
    for (let i = 0; i < padEnd; i++) {
      matrix.push({ day: null, dateStr: null, ratio: -2 });
    }
  }

  return matrix;
};

// Helper to chunk calendar days into rows of 7
const chunkArray = (arr: any[], size: number) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

export default function AnalyticsScreen() {
  const [periods, setPeriods] = useState<TimePeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [activeSemesterId, setActiveSemesterId] = useState<string | null>(null);
  const [holidaySheetVisible, setHolidaySheetVisible] = useState(false);

  const loadData = async () => {
    try {
      const activeSem = await DatabaseService.fetchActiveSemester();
      if (!activeSem) return;
      setActiveSemesterId(activeSem.id);

      const [fetchedSubjects, fetchedRecords] = await Promise.all([
        DatabaseService.fetchSubjects(activeSem.id),
        DatabaseService.fetchAttendanceRecords(activeSem.id)
      ]);
      const { data: holidaysData } = await (supabase as any).from('holidays').select('*').eq('semester_id', activeSem.id);
      
      setSubjects(fetchedSubjects);
      setRecords(fetchedRecords);
      setHolidays(holidaysData || []);
      
      // Generate periods based on active semester
      const semStart = new Date(activeSem.start_date);
      const semEnd = activeSem.end_date ? new Date(activeSem.end_date) : new Date();
      
      const newPeriods: TimePeriod[] = [];
      const startYear = semStart.getFullYear();
      const endYear = semEnd.getFullYear();
      
      // Add the entire semester option first
      newPeriods.push({
        id: `sem_${activeSem.id}`,
        label: `${activeSem.name} (Full)`,
        type: 'semester',
        year: startYear, // Approximate
        startMonthIndex: semStart.getMonth(),
        endMonthIndex: (endYear > startYear ? 11 : semEnd.getMonth()), // simplistic if spans multiple years
      });
      
      // Add individual months (reverse order so recent is first)
      let curr = new Date(semEnd);
      while (curr >= semStart) {
        newPeriods.push({
          id: `m_${curr.getFullYear()}_${curr.getMonth()}`,
          label: curr.toLocaleString('default', { month: 'long', year: 'numeric' }),
          type: 'month',
          year: curr.getFullYear(),
          monthIndex: curr.getMonth(),
        });
        curr.setMonth(curr.getMonth() - 1);
      }
      
      setPeriods(newPeriods);
      if (!selectedPeriod) {
        setSelectedPeriod(newPeriods[0]);
      }
      
    } catch (error) {
      console.warn('Failed to load analytics data', error);
    }
  };

  useEffect(() => {
    loadData();

    // Realtime changes listener for automatic updates
    const recordsChannel = supabase
      .channel('public:attendance_records_analytics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, payload => {
        loadData();
      })
      .subscribe();

    const holidaysChannel = supabase
      .channel('public:holidays_analytics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'holidays' }, payload => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(recordsChannel);
      supabase.removeChannel(holidaysChannel);
    };
  }, []);

  // Computes active months to display heatmap grids for
  const activeMonths = useMemo(() => {
    if (!selectedPeriod) return [];
    if (selectedPeriod.type === 'month') {
      return [{ year: selectedPeriod.year, monthIndex: selectedPeriod.monthIndex! }];
    }
    const months = [];
    for (let i = selectedPeriod.startMonthIndex!; i <= selectedPeriod.endMonthIndex!; i++) {
      months.push({ year: selectedPeriod.year, monthIndex: i });
    }
    return months;
  }, [selectedPeriod]);

  // Recalculates metrics based on active period selection
  const periodSubjects = useMemo(() => {
    return subjects.map(subject => {
      // Basic filtering for prototype
      const subRecords = records.filter(r => r.subject_id === subject.id);
      const conducted = subRecords.length;
      const attended = subRecords.filter(r => r.status === 'present').length;
      const percentage = calculatePercentage(attended, conducted);
      return {
        ...subject,
        threshold: subject.target_threshold,
        totalConducted: conducted,
        totalAttended: attended,
        percentage,
      };
    });
  }, [subjects, records, selectedPeriod]);

  // Calculates color codes based on attendance ratio
  const getHeatmapColor = (ratio: number) => {
    if (ratio === -3) return accent.primary; // Holiday (Blue)
    if (ratio === -2) return 'transparent'; // Padding
    if (ratio === -1) return glass.medium; // Off / Weekend
    if (ratio === 1) return attendanceColors.present.base; // 100% (Green)
    if (ratio === 0.75) return '#84cc16'; // 75% (Lime)
    if (ratio === 0.5) return '#eab308'; // 50% (Yellow)
    if (ratio === 0.25) return '#f97316'; // 25% (Orange)
    if (ratio === 0) return gaugeColors.critical; // 0% (Red)
    return glass.subtle;
  };

  // CSV Report Exporter
  const handleExportCSV = async () => {
    if (!selectedPeriod) return;
    
    let csvContent = 'Subject,Short Name,Attended,Conducted,Percentage,Threshold,Period\n';
    periodSubjects.forEach(s => {
      csvContent += `"${s.name}","${s.short_name}",${s.totalAttended},${s.totalConducted},${s.percentage}%,${s.threshold}%,"${selectedPeriod.label}"\n`;
    });

    if (Platform.OS === 'web') {
      try {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Attendance_Report_${selectedPeriod.id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        alert('CSV compilation failed: ' + e);
      }
    } else {
      try {
        const fileUri = (FileSystem as any).documentDirectory + `Attendance_Report_${selectedPeriod.id}.csv`;
        await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Export Attendance Report',
          });
        } else {
          alert('Sharing is not available on this device');
        }
      } catch (error) {
        alert('Failed to export CSV: ' + error);
      }
    }
  };

  // PDF Official Document Generator
  const handleExportPDF = async () => {
    if (!selectedPeriod) return;
    
    if (Platform.OS === 'web') {
      window.print();
    } else {
      try {
        let htmlContent = `
          <html>
            <head>
              <style>
                body { font-family: Helvetica, Arial, sans-serif; padding: 20px; }
                h1 { color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .safe { color: green; }
                .warning { color: orange; }
                .danger { color: red; }
              </style>
            </head>
            <body>
              <h1>Attendance Report</h1>
              <p>Period: ${selectedPeriod.label}</p>
              <table>
                <tr>
                  <th>Subject</th>
                  <th>Conducted</th>
                  <th>Attended</th>
                  <th>Percentage</th>
                  <th>Target</th>
                </tr>
        `;
        
        periodSubjects.forEach(s => {
          let colorClass = 'danger';
          if (s.percentage >= s.threshold) colorClass = 'safe';
          else if (s.percentage >= s.threshold - 10) colorClass = 'warning';
          
          htmlContent += `
            <tr>
              <td>${s.name} (${s.short_name})</td>
              <td>${s.totalConducted}</td>
              <td>${s.totalAttended}</td>
              <td class="${colorClass}">${s.percentage}%</td>
              <td>${s.threshold}%</td>
            </tr>
          `;
        });
        
        htmlContent += `
              </table>
            </body>
          </html>
        `;
        
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Export Attendance PDF',
          });
        } else {
          alert('Sharing is not available on this device');
        }
      } catch (error) {
        alert('Failed to export PDF: ' + error);
      }
    }
  };

  // Switch time period and reset calendar selections
  const handlePeriodSelect = (period: TimePeriod) => {
    setSelectedPeriod(period);
    setSelectedDay(null);
    setDropdownVisible(false);
  };

  return (
    <View style={styles.screen}>
      {/* Printable CSS style sheet override */}
      {Platform.OS === 'web' && (
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { background: white !important; color: black !important; }
            .screen, scrollContent { padding: 0 !important; margin: 0 !important; }
            button, TouchableOpacity, .exportActionRow, .dropdownTrigger, .periodSelector, [role="button"] { display: none !important; }
            .heatmapCard, .matrixContainer { background: transparent !important; border: 1px solid #ddd !important; box-shadow: none !important; }
            .dayNumberText { color: #333 !important; }
            .legendText { color: #666 !important; }
            h1, h2, h3 { color: black !important; }
          }
        `}} />
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title Row */}
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Smart insights and calendar tracking</Text>
        </View>

        {/* Dynamic Selector Dropdown Row & Exports */}
        <View style={styles.selectorRow}>
          <TouchableOpacity 
            style={styles.dropdownTrigger}
            activeOpacity={0.8}
            onPress={() => setDropdownVisible(true)}
          >
            <Ionicons name="calendar-outline" size={16} color={accent.primary} />
            <Text style={styles.dropdownValue}>{selectedPeriod?.label || 'Loading...'}</Text>
            <Ionicons name="chevron-down" size={14} color={textColors.tertiary} />
          </TouchableOpacity>

          <View style={styles.exportActionRow}>
            <TouchableOpacity style={styles.actionPill} onPress={() => setHolidaySheetVisible(true)}>
              <Ionicons name="calendar-clear-outline" size={16} color={textColors.secondary} />
              <Text style={styles.actionPillText}>Holiday</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionPill} onPress={handleExportPDF}>
              <Ionicons name="print-outline" size={16} color={textColors.secondary} />
              <Text style={styles.actionPillText}>PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionPill} onPress={handleExportCSV}>
              <Ionicons name="download-outline" size={16} color={textColors.secondary} />
              <Text style={styles.actionPillText}>CSV</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar Heatmap Grids (Single Month or All Semester Months) */}
        {activeMonths.map(({ year, monthIndex }, idx) => {
          const calendarData = getCalendarMatrix(year, monthIndex, records, holidays);
          const monthName = new Date(year, monthIndex).toLocaleString('default', { month: 'long', year: 'numeric' });
          const rows = chunkArray(calendarData, 7);

          return (
            <View key={idx} style={styles.monthSection}>
              <Text style={styles.monthSectionTitle}>{monthName}</Text>
              <View style={styles.heatmapCard}>
                
                {/* Weekday Row Header */}
                <View style={styles.weekdayRow}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, dIdx) => (
                    <Text key={dIdx} style={styles.weekdayLabel}>{day}</Text>
                  ))}
                </View>

                {/* Grid rows */}
                <View style={styles.heatmapGrid}>
                  {rows.map((week, weekIdx) => (
                    <View key={weekIdx} style={styles.weekRow}>
                      {week.map((day, dayIdx) => {
                        const cellColor = getHeatmapColor(day.ratio);
                        const hasDay = day.day !== null;
                        const isSelected = selectedDay && selectedDay.day === day.day && selectedDay.dateStr === day.dateStr;

                        return (
                          <TouchableOpacity
                            key={dayIdx}
                            activeOpacity={hasDay ? 0.7 : 1.0}
                            disabled={!hasDay}
                            onPress={() => setSelectedDay(day)}
                            style={[
                              styles.heatCell,
                              { backgroundColor: cellColor },
                              !hasDay && { borderColor: 'transparent', backgroundColor: 'transparent' },
                              isSelected && { borderWidth: 2, borderColor: '#fff' }
                            ]}
                          >
                            {hasDay && (
                              <Text style={[
                                styles.dayNumberText,
                                day.ratio === -1 && { color: textColors.tertiary }
                              ]}>
                                {day.day}
                              </Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>

                {/* Legend */}
                <View style={styles.heatmapLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: attendanceColors.present.base }]} />
                    <Text style={styles.legendText}>100%</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <LinearGradient
                      colors={['#84cc16', '#eab308', '#f97316']}
                      start={{x:0, y:0}} end={{x:1, y:0}}
                      style={[styles.legendDot, { width: 32 }]}
                    />
                    <Text style={styles.legendText}>Partial</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: gaugeColors.critical }]} />
                    <Text style={styles.legendText}>0%</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: glass.medium }]} />
                    <Text style={styles.legendText}>Off</Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}

        {/* Selected Day Details Panel */}
        {selectedDay && selectedDay.day !== null && (
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>
                {new Date(selectedDay.dateStr + 'T00:00:00').toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              <TouchableOpacity onPress={() => setSelectedDay(null)}>
                <Ionicons name="close" size={18} color={textColors.secondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.detailRow}>
              <Ionicons 
                name={selectedDay.ratio === -1 ? 'sunny-outline' : selectedDay.ratio === 1 ? 'checkmark-circle-outline' : 'warning-outline'} 
                size={20} 
                color={getHeatmapColor(selectedDay.ratio) === 'transparent' ? textColors.primary : getHeatmapColor(selectedDay.ratio)} 
              />
              <Text style={styles.detailStatusText}>
                {selectedDay.ratio === -1 
                  ? 'Official Holiday / Sunday' 
                  : `Attendance Ratio: ${Math.round(selectedDay.ratio * 100)}%`}
              </Text>
            </View>
            {selectedDay.ratio !== -1 && (
              <View style={styles.detailStats}>
                <Text style={styles.detailSubtext}>Logged Lectures:</Text>
                <Text style={styles.detailLectureLog}>
                  {records
                    .filter(r => r.date === selectedDay.dateStr)
                    .map(r => {
                      const subject = subjects.find(s => s.id === r.subject_id);
                      const icon = r.status === 'present' ? '✅' : '❌';
                      return `• ${subject?.name || 'Unknown'}: ${icon} ${r.status.toUpperCase()} (${r.duration_minutes || 0} min)`;
                    }).join('\n') || 'No records found for this day.'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Subject Risk Matrix with Compliance Lines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subject Risk Matrix</Text>
          <View style={styles.matrixContainer}>
            {periodSubjects.map(subject => {
              let barColor: string = gaugeColors.critical;
              if (subject.percentage >= 85) barColor = gaugeColors.safe;
              else if (subject.percentage >= 75) barColor = gaugeColors.warning;

              return (
                <View key={subject.id} style={styles.matrixItem}>
                  <View style={styles.matrixHeader}>
                    <Text style={styles.matrixSubjectName} numberOfLines={1}>{subject.name}</Text>
                    <Text style={[styles.matrixPercentage, { color: barColor }]}>{subject.percentage}%</Text>
                  </View>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${subject.percentage}%`, backgroundColor: barColor }]} />
                      
                      {/* 75% Compliance line */}
                      <View style={[styles.markerLine, { left: '75%' }]}>
                        <Text style={styles.markerLabel}>75% Warning</Text>
                      </View>
                      
                      {/* 85% Compliance line */}
                      <View style={[styles.markerLine, { left: '85%' }]}>
                        <Text style={styles.markerLabel}>85% Safe</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
        
        {/* Recent History Log */}
        <View style={[styles.section, { marginTop: spacing['2xl'] }]}>
          <Text style={styles.sectionTitle}>Recent Log</Text>
          <View style={styles.historyList}>
            {records.slice(0, 10).map((r, idx) => {
              const subject = subjects.find(s => s.id === r.subject_id);
              const isPresent = r.status === 'present';
              return (
                <View key={idx} style={styles.historyItem}>
                  <View style={[styles.historyIcon, { backgroundColor: isPresent ? attendanceColors.present.surface : attendanceColors.absent.surface }]}>
                    <Ionicons name={isPresent ? "checkmark" : "close"} size={16} color={isPresent ? attendanceColors.present.base : attendanceColors.absent.base} />
                  </View>
                  <View style={styles.historyContent}>
                    <Text style={styles.historySubject}>{subject?.name || 'Unknown Subject'}</Text>
                    <Text style={styles.historyDate}>{new Date(r.date + 'T00:00:00').toLocaleDateString()}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: isPresent ? attendanceColors.present.surface : attendanceColors.absent.surface }]}>
                    <Text style={[styles.statusText, { color: isPresent ? attendanceColors.present.base : attendanceColors.absent.base }]}>
                      {r.status}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Dynamic Period Selector Modal Dropdown */}
        <Modal
          visible={dropdownVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDropdownVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setDropdownVisible(false)}
          >
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownTitle}>Select Time Period</Text>
              {periods.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.dropdownItem, selectedPeriod?.id === p.id && styles.dropdownItemActive]}
                  onPress={() => handlePeriodSelect(p)}
                >
                  <Text style={[styles.dropdownItemText, selectedPeriod?.id === p.id && styles.dropdownItemTextActive]}>
                    {p.label}
                  </Text>
                  {selectedPeriod?.id === p.id && (
                    <Ionicons name="checkmark" size={16} color={accent.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Bottom padding for tab spacing */}
        <View style={{ height: layout.bottomNavHeight + spacing['2xl'] }} />
      </ScrollView>

      <HolidayManagerSheet
        visible={holidaySheetVisible}
        semesterId={activeSemesterId}
        onClose={() => setHolidaySheetVisible(false)}
        onRefresh={loadData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: canvas.base,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'web' ? spacing['3xl'] : spacing.xl,
    paddingHorizontal: layout.screenPaddingH,
  },

  // ── Header
  header: {
    marginBottom: spacing.md,
  },
  title: {
    ...textStyle.pageTitle,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: textColors.secondary,
  },

  // ── Selector Dropdown Row
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  dropdownTrigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: glass.medium,
    borderWidth: 1,
    borderColor: border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  dropdownValue: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: textColors.primary,
  },
  exportActionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: glass.light,
    borderWidth: 1,
    borderColor: border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  actionPillText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
    color: textColors.secondary,
  },

  // ── Semester Month Section Display
  monthSection: {
    marginBottom: spacing.xl,
  },
  monthSectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: textColors.primary,
    marginBottom: spacing.sm,
    textTransform: 'capitalize',
  },

  // ── Heatmap Card and Grid Layouts
  heatmapCard: {
    backgroundColor: glass.subtle,
    borderWidth: 1,
    borderColor: border.default,
    borderRadius: radius.lg,
    padding: spacing.xl,
    ...shadow.low,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  weekdayLabel: {
    width: 32,
    textAlign: 'center',
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: textColors.tertiary,
  },
  heatmapGrid: {
    gap: 8,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Maintains gaps between cells
  },
  heatCell: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    color: '#fff',
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: border.default,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
    color: textColors.secondary,
  },

  // ── Selected Day Details Card
  detailCard: {
    backgroundColor: glass.medium,
    borderWidth: 1,
    borderColor: border.default,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing['2xl'],
    gap: spacing.md,
    ...shadow.medium,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: textColors.primary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailStatusText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: textColors.primary,
  },
  detailStats: {
    gap: spacing.xs,
  },
  detailSubtext: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: textColors.secondary,
  },
  detailLectureLog: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: textColors.tertiary,
    lineHeight: 20,
  },

  // ── Subject Risk Compliance Bar Layouts
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: textColors.primary,
    marginBottom: spacing.md,
  },
  matrixContainer: {
    gap: spacing.lg,
    backgroundColor: glass.light,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: border.default,
  },
  matrixItem: {
    gap: spacing.sm,
  },
  matrixHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matrixSubjectName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: textColors.primary,
    flex: 1,
  },
  matrixPercentage: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
  },
  progressContainer: {
    paddingTop: 16,
    paddingBottom: 4,
  },
  progressTrack: {
    height: 8,
    backgroundColor: glass.medium,
    borderRadius: 4,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  markerLine: {
    position: 'absolute',
    top: -16,
    bottom: -4,
    width: 2,
    backgroundColor: border.medium,
    alignItems: 'center',
    zIndex: 10,
  },
  markerLabel: {
    position: 'absolute',
    top: -14,
    fontFamily: fontFamily.bold,
    fontSize: 7,
    color: textColors.tertiary,
    backgroundColor: canvas.base,
    paddingHorizontal: 2,
    minWidth: 60,
    textAlign: 'center',
  },

  // ── History Log Styles
  historyList: {
    gap: spacing.sm,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: glass.light,
    borderWidth: 1,
    borderColor: border.default,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  historyContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  historySubject: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: textColors.primary,
    marginBottom: 2,
  },
  historyDate: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: textColors.tertiary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  statusText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    textTransform: 'uppercase',
  },

  // ── Modal Selector Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  dropdownContainer: {
    backgroundColor: canvas.elevated,
    borderWidth: 1,
    borderColor: border.default,
    borderRadius: radius.xl,
    width: '100%',
    maxWidth: 340,
    padding: spacing.lg,
    ...shadow.high,
  },
  dropdownTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: textColors.primary,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: border.default,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  dropdownItemActive: {
    backgroundColor: glass.light,
  },
  dropdownItemText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: textColors.secondary,
  },
  dropdownItemTextActive: {
    fontFamily: fontFamily.bold,
    color: accent.primary,
  },
});
