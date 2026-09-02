import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import { CampusBuilding } from '../../data/CampusBuildings';
import { canvas, text as textColors, border, glass, accent, shadow, palette } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

interface BuildingDetailSheetProps {
  building: CampusBuilding | null;
  floor: number;
  onFloorChange: (floor: number) => void;
  onClose: () => void;
  onNavigate: () => void;
  onCalibrate: () => void;
}

// Mock INDOOR_DIRECTORIES for now
const INDOOR_DIRECTORIES: Record<string, Record<number, { id: string; name: string }[]>> = {
  // Add fallback empty data
};

export const BuildingDetailSheet: React.FC<BuildingDetailSheetProps> = ({
  building,
  floor,
  onFloorChange,
  onClose,
  onNavigate,
  onCalibrate,
}) => {
  const snapPoints = useMemo(() => ['25%', '60%'], []);
  const bottomSheetRef = React.useRef<BottomSheet>(null);

  if (!building) return null;

  const floorsArray = Array.from({ length: building.floors || 1 }, (_, i) => i);
  const directories = (INDOOR_DIRECTORIES[building.id] && INDOOR_DIRECTORIES[building.id][floor]) || [];

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundComponent={({ style }) => (
        <View style={[style, styles.blurBackground, { backgroundColor: 'rgba(26, 26, 46, 0.95)' }]} />
      )}
      handleIndicatorStyle={{ backgroundColor: border.default }}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: building.color }]}>
            <Text style={styles.badgeText}>{building.number}</Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{building.name}</Text>
            <Text style={styles.type}>{building.type} • {building.shortName}</Text>
          </View>
        </View>

        <Text style={styles.description}>{building.description}</Text>

        {/* Floors */}
        {floorsArray.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Floors</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {floorsArray.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.floorButton,
                    f === floor && styles.floorButtonActive,
                  ]}
                  onPress={() => onFloorChange(f)}
                >
                  <Text style={[
                    styles.floorText,
                    f === floor && styles.floorTextActive,
                  ]}>
                    {f === 0 ? 'G' : f}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Directory */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Directory (Floor {floor === 0 ? 'G' : floor})</Text>
          <ScrollView style={styles.directoryList}>
            {directories.length > 0 ? directories.map(room => (
              <View key={room.id} style={styles.roomItem}>
                <Text style={styles.roomName}>{room.name}</Text>
              </View>
            )) : (
              <Text style={styles.emptyText}>No directory data available for this floor.</Text>
            )}
          </ScrollView>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.calibrateButton} onPress={onCalibrate}>
            <Text style={styles.calibrateText}>Calibrate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navigateButton} onPress={onNavigate}>
            <Text style={styles.navigateText}>Directions</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  blurBackground: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: canvas.base,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  badgeText: {
    color: '#ffffff',
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: textColors.primary,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
  },
  type: {
    color: textColors.secondary,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  description: {
    color: textColors.primary,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: textColors.secondary,
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  floorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: glass.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: border.default,
  },
  floorButtonActive: {
    backgroundColor: accent.primary,
    borderColor: accent.primary,
  },
  floorText: {
    color: textColors.primary,
    fontFamily: fontFamily.semiBold,
  },
  floorTextActive: {
    color: '#ffffff',
  },
  directoryList: {
    maxHeight: 150,
  },
  roomItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: border.default,
  },
  roomName: {
    color: textColors.primary,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
  },
  emptyText: {
    color: textColors.secondary,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 'auto',
    paddingTop: spacing.md,
  },
  calibrateButton: {
    flex: 1,
    backgroundColor: glass.medium,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginRight: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: border.default,
  },
  calibrateText: {
    color: textColors.primary,
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
  },
  navigateButton: {
    flex: 2,
    backgroundColor: accent.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  navigateText: {
    color: '#ffffff',
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
  },
});
