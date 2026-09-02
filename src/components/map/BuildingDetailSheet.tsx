import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, PanResponder, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CampusBuilding } from '../../data/CampusBuildings';
import { canvas, text as textColors, border, glass, accent } from '../../theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.55;

// ─── Real Indoor Directory Data ────────────────────────────────────
const INDOOR_DIRECTORIES: Record<string, Record<number, { id: string; name: string; icon: string }[]>> = {
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

interface BuildingDetailSheetProps {
  building: CampusBuilding | null;
  floor: number;
  onFloorChange: (floor: number) => void;
  onClose: () => void;
  onNavigate: () => void;
  onCalibrate: () => void;
}

export const BuildingDetailSheet: React.FC<BuildingDetailSheetProps> = ({
  building,
  floor,
  onFloorChange,
  onClose,
  onNavigate,
  onCalibrate,
}) => {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80 || gestureState.vy > 0.5) {
          // Dismiss
          Animated.timing(translateY, {
            toValue: SHEET_HEIGHT,
            duration: 250,
            useNativeDriver: true,
          }).start(() => onClose());
        } else {
          // Snap back
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (building) {
      translateY.setValue(SHEET_HEIGHT);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [building]);

  if (!building) return null;

  const floorsArray = Array.from({ length: building.floors || 1 }, (_, i) => i);
  const directories = INDOOR_DIRECTORIES[building.id]?.[floor] || [];

  return (
    <Animated.View
      style={[styles.sheet, { transform: [{ translateY }] }]}
      {...panResponder.panHandlers}
    >
      {/* Drag Handle */}
      <View style={styles.handleBar}>
        <View style={styles.handle} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: building.color }]}>
          <Text style={styles.badgeText}>{building.number}</Text>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{building.name}</Text>
          <Text style={styles.type} numberOfLines={1}>{building.type} • {building.shortName}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={textColors.secondary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.description} numberOfLines={2}>{building.description}</Text>

      {/* Floor Switcher */}
      {floorsArray.length > 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FLOORS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {floorsArray.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.floorButton, f === floor && styles.floorButtonActive]}
                onPress={() => onFloorChange(f)}
              >
                <Text style={[styles.floorText, f === floor && styles.floorTextActive]}>
                  {f === 0 ? 'G' : f}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Indoor Directory */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          DIRECTORY {floorsArray.length > 1 ? `— Floor ${floor === 0 ? 'G' : floor}` : ''}
        </Text>
        <ScrollView style={styles.directoryList} nestedScrollEnabled>
          {directories.length > 0 ? directories.map(room => (
            <View key={room.id} style={styles.roomItem}>
              <Ionicons name={room.icon as any} size={18} color={textColors.secondary} style={{ marginRight: 10 }} />
              <Text style={styles.roomName}>{room.name}</Text>
            </View>
          )) : (
            <Text style={styles.emptyText}>No directory data for this floor.</Text>
          )}
        </ScrollView>
      </View>

      {/* Actions */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.calibrateButton} onPress={onCalibrate}>
          <Ionicons name="locate-outline" size={18} color={textColors.primary} />
          <Text style={styles.calibrateText}>Calibrate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navigateButton} onPress={onNavigate}>
          <Ionicons name="navigate-outline" size={18} color="#fff" />
          <Text style={styles.navigateText}>Directions</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: 'rgba(12, 17, 28, 0.97)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderColor: border.default,
    zIndex: 100,
  },
  handleBar: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: textColors.primary,
    fontWeight: 'bold',
    fontSize: 18,
  },
  type: {
    color: textColors.secondary,
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
  },
  description: {
    color: textColors.secondary,
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 18,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: textColors.secondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 1,
  },
  floorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: glass.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: border.default,
  },
  floorButtonActive: {
    backgroundColor: accent.primary,
    borderColor: accent.primary,
  },
  floorText: {
    color: textColors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  floorTextActive: {
    color: '#ffffff',
  },
  directoryList: {
    maxHeight: 120,
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: border.default,
  },
  roomName: {
    color: textColors.primary,
    fontSize: 14,
    flex: 1,
  },
  emptyText: {
    color: textColors.secondary,
    fontSize: 13,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 'auto',
    gap: 10,
  },
  calibrateButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: glass.medium,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: border.default,
  },
  calibrateText: {
    color: textColors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  navigateButton: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: accent.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  navigateText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});
