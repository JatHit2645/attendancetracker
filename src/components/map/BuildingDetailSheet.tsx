import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, PanResponder, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CampusBuilding } from '../../data/CampusBuildings';
import { INDOOR_DIRECTORIES } from '../../data/IndoorDirectories';
import { canvas, text as textColors, border, glass, accent } from '../../theme/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const insets = useSafeAreaInsets();
  const sheetHeight = Math.min(SCREEN_HEIGHT * 0.62, 480) + insets.bottom;
  const translateY = useRef(new Animated.Value(sheetHeight)).current;

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
            toValue: sheetHeight,
            duration: 220,
            useNativeDriver: true,
          }).start(() => onClose());
        } else {
          // Snap back
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 70,
            friction: 12,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (building) {
      translateY.setValue(sheetHeight);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 12,
      }).start();
    }
  }, [building]);

  if (!building) return null;

  const floorsArray = Array.from({ length: building.floors || 1 }, (_, i) => i);
  const directories = INDOOR_DIRECTORIES[building.id]?.[floor] || [];

  return (
    <Animated.View
      style={[
        styles.sheet,
        {
          height: sheetHeight,
          paddingBottom: Math.max(34, insets.bottom + 18),
          transform: [{ translateY }],
        },
      ]}
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
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
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
      <View style={[styles.section, { flex: 1 }]}>
        <Text style={styles.sectionTitle}>
          DIRECTORY {floorsArray.length > 1 ? `— Floor ${floor === 0 ? 'G' : floor}` : ''}
        </Text>
        <ScrollView style={styles.directoryList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
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

      {/* Actions (Floating safely above system taskbar) */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.calibrateButton} onPress={onCalibrate} activeOpacity={0.8}>
          <Ionicons name="locate-outline" size={18} color={textColors.primary} />
          <Text style={styles.calibrateText}>Calibrate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navigateButton} onPress={onNavigate} activeOpacity={0.8}>
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
    backgroundColor: '#0C111C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 24,
    zIndex: 100,
  },
  handleBar: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
    fontSize: 17,
  },
  type: {
    color: textColors.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  description: {
    color: textColors.secondary,
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    color: textColors.secondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 1,
  },
  floorButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    fontSize: 14,
  },
  floorTextActive: {
    color: '#ffffff',
  },
  directoryList: {
    maxHeight: 110,
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  roomName: {
    color: textColors.primary,
    fontSize: 13,
    flex: 1,
  },
  emptyText: {
    color: textColors.secondary,
    fontSize: 13,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 12,
  },
  calibrateButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
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
