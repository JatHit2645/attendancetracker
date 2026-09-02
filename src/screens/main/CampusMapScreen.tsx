import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, StyleSheet, Dimensions, TextInput, TouchableOpacity,
  Text, ScrollView, Animated as RNAnimated,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { CampusSvgCanvas } from '../../components/map/CampusSvgCanvas';
import { BuildingDetailSheet } from '../../components/map/BuildingDetailSheet';
import { CAMPUS_BUILDINGS, CampusBuilding } from '../../data/CampusBuildings';
import { PathfindingService } from '../../services/PathfindingService';
import { LocationService } from '../../services/LocationService';
import { MapNode } from '../../data/MapGraph';
import { canvas, text as textColors, border, accent } from '../../theme/colors';

const MAP_IMAGE_WIDTH = 800;
const MAP_IMAGE_HEIGHT = 650;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const categories = [
  { key: 'All', icon: 'apps', label: 'All' },
  { key: 'academic', icon: 'school', label: 'Depts' },
  { key: 'facility', icon: 'cafe', label: 'Facility' },
  { key: 'admin', icon: 'briefcase', label: 'Admin' },
];

export default function CampusMapScreen() {
  // ─── State ─────────────────────────────────────────────────────────
  const [selectedBuilding, setSelectedBuilding] = useState<CampusBuilding | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [is3D, setIs3D] = useState(false);
  const [floor, setFloor] = useState(0);
  const [navigatingTo, setNavigatingTo] = useState<CampusBuilding | null>(null);
  const [route, setRoute] = useState<{ path: MapNode[]; minutes: number; distance: number } | null>(null);
  const [showRoutePicker, setShowRoutePicker] = useState(false);
  const [routePickerMode, setRoutePickerMode] = useState<'from' | 'to'>('from');
  const [routeFrom, setRouteFrom] = useState<CampusBuilding | null>(null);
  const [livePosition, setLivePosition] = useState<{ x: number; y: number; heading: number } | null>(null);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string } | null>(null);

  // ─── Gesture Shared Values ─────────────────────────────────────────
  const scale = useSharedValue(0.8);
  const savedScale = useSharedValue(0.8);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // ─── Refs ──────────────────────────────────────────────────────────
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Hit Testing ───────────────────────────────────────────────────
  const isPointInPolygon = (point: { x: number; y: number }, vs: { x: number; y: number }[]) => {
    let x = point.x, y = point.y;
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      let xi = vs[i].x, yi = vs[i].y;
      let xj = vs[j].x, yj = vs[j].y;
      let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const handleMapTap = (screenX: number, screenY: number) => {
    // Convert screen coordinates to SVG coordinates
    const svgX = (screenX - (SCREEN_WIDTH / 2) - translateX.value) / scale.value + (MAP_IMAGE_WIDTH / 2);
    const svgY = (screenY - (SCREEN_HEIGHT / 3) - translateY.value) / scale.value + (MAP_IMAGE_HEIGHT / 2);

    for (const b of CAMPUS_BUILDINGS) {
      let hit = false;
      if (b.shapeType === 'circle' && b.circle) {
        const dist = Math.sqrt(Math.pow(svgX - b.circle.cx, 2) + Math.pow(svgY - b.circle.cy, 2));
        hit = dist <= b.circle.r + 5; // 5px tolerance
      } else if (b.shapeType === 'polygon' && b.polygon) {
        const pts = b.polygon.split(' ').map(p => {
          const [x, y] = p.split(',').map(Number);
          return { x, y };
        });
        hit = isPointInPolygon({ x: svgX, y: svgY }, pts);
      }

      if (hit) {
        handleSelectBuilding(b);
        return;
      }
    }

    // Tapped empty space — close sheet
    if (selectedBuilding) {
      setSelectedBuilding(null);
      setTooltip(null);
    }
  };

  // ─── Gestures ──────────────────────────────────────────────────────
  const tapGesture = Gesture.Tap()
    .maxDistance(15)
    .runOnJS(true)
    .onEnd((e) => {
      handleMapTap(e.x, e.y);
    });

  const panGesture = Gesture.Pan()
    .minDistance(10)
    .maxPointers(1)
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(0.3, Math.min(savedScale.value * e.scale, 4));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const composedGesture = Gesture.Race(
    tapGesture,
    Gesture.Simultaneous(panGesture, pinchGesture)
  );

  const animatedMapStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value }
    ] as const
  }));

  // ─── Camera ────────────────────────────────────────────────────────
  const centerOnBuilding = (building: CampusBuilding) => {
    const targetScale = 1.5;
    scale.value = withSpring(targetScale);
    savedScale.value = targetScale;

    const bx = building.x ?? (MAP_IMAGE_WIDTH / 2);
    const by = building.y ?? (MAP_IMAGE_HEIGHT / 2);

    const tx = SCREEN_WIDTH / 2 - bx * targetScale;
    const ty = SCREEN_HEIGHT / 3 - by * targetScale;

    translateX.value = withSpring(tx);
    translateY.value = withSpring(ty);
    savedTranslateX.value = tx;
    savedTranslateY.value = ty;
  };

  // ─── Building Selection ────────────────────────────────────────────
  const handleSelectBuilding = (building: CampusBuilding) => {
    setFloor(0); // Reset floor when selecting new building
    setSelectedBuilding(building);
    centerOnBuilding(building);

    // Show tooltip briefly
    setTooltip({ x: building.x, y: building.y, name: building.name });
    if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
    tooltipTimeout.current = setTimeout(() => setTooltip(null), 3000);
  };

  // ─── Location Tracking ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopLiveTracking();
    };
  }, []);

  const startLiveTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Don't crash, just alert
        return;
      }
      setIsLiveTracking(true);
      locationSub.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 2 },
        async (pos) => {
          try {
            const offset = await LocationService.getCalibrationOffset();
            const pix = LocationService.gpsToPixel(pos.coords.latitude, pos.coords.longitude, offset);
            const snapped = LocationService.snapToNearestPath(pix.x, pix.y);
            setLivePosition({
              x: snapped.x,
              y: snapped.y,
              heading: pos.coords.heading || 0,
            });
          } catch (e) {
            // Silently handle GPS conversion errors
          }
        }
      );
    } catch (err) {
      setIsLiveTracking(false);
    }
  };

  const stopLiveTracking = () => {
    setIsLiveTracking(false);
    locationSub.current?.remove();
    locationSub.current = null;
    setLivePosition(null);
  };

  // ─── Calibration ───────────────────────────────────────────────────
  const handleCalibrateSpot = async () => {
    try {
      if (selectedBuilding) {
        const pos = await Location.getCurrentPositionAsync({});
        await LocationService.saveCalibrationOffset(selectedBuilding.id, pos.coords.latitude, pos.coords.longitude);
      }
    } catch (e) {
      // Silently handle
    }
  };

  // ─── Navigation ────────────────────────────────────────────────────
  const handleStartNavigation = (building: CampusBuilding) => {
    setNavigatingTo(building);
    setRouteFrom(null);
    setRoutePickerMode('from');
    setShowRoutePicker(true);
    setSelectedBuilding(null);
    setTooltip(null);
  };

  const handlePickBuilding = (building: CampusBuilding) => {
    if (routePickerMode === 'from') {
      setRouteFrom(building);
      setRoutePickerMode('to');
    } else {
      // Calculate route
      const fromId = routeFrom?.entranceNode || routeFrom?.id || '';
      const toId = building.entranceNode || building.id;
      const result = PathfindingService.findShortestPath(fromId, toId);
      if (result && result.path.length > 0) {
        setRoute({
          path: result.path,
          minutes: result.estimatedMinutes,
          distance: result.totalDistancePixels * 0.5, // pixel to meters
        });
      }
      setShowRoutePicker(false);
      setNavigatingTo(building);
    }
  };

  const clearNavigation = () => {
    setRoute(null);
    setNavigatingTo(null);
    setRouteFrom(null);
    setShowRoutePicker(false);
  };

  // ─── Filtered buildings ────────────────────────────────────────────
  const filteredBuildings = useMemo(() => {
    return CAMPUS_BUILDINGS.filter((b) => {
      const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            b.shortName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // ─── Route picker buildings (searchable) ───────────────────────────
  const pickerBuildings = useMemo(() => {
    return CAMPUS_BUILDINGS.filter(b => {
      if (routePickerMode === 'from') return true;
      return b.id !== routeFrom?.id;
    });
  }, [routePickerMode, routeFrom]);

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Header Controls */}
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search buildings..."
          placeholderTextColor={textColors.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.categoryChip, selectedCategory === cat.key && styles.categoryChipSelected]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              <Ionicons
                name={cat.icon as any}
                size={14}
                color={selectedCategory === cat.key ? '#fff' : textColors.secondary}
              />
              <Text style={[styles.categoryText, selectedCategory === cat.key && styles.categoryTextSelected]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.controlButton} onPress={() => setIs3D(!is3D)}>
            <Text style={styles.controlText}>{is3D ? '2D' : '3D'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, isLiveTracking && styles.controlButtonActive]}
            onPress={() => { if (isLiveTracking) stopLiveTracking(); else startLiveTracking(); }}
          >
            <Ionicons
              name={isLiveTracking ? 'location' : 'location-outline'}
              size={20}
              color={isLiveTracking ? '#fff' : textColors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Navigation Banner */}
      {route && navigatingTo && (
        <View style={styles.banner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Navigating to {navigatingTo.name}</Text>
            <Text style={styles.bannerSubtitle}>
              🚶 {route.minutes} min · {Math.round(route.distance)}m
            </Text>
          </View>
          <TouchableOpacity onPress={clearNavigation} style={styles.bannerClose}>
            <Ionicons name="close-circle" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Route Picker Modal */}
      {showRoutePicker && (
        <View style={styles.routePickerOverlay}>
          <View style={styles.routePicker}>
            <Text style={styles.pickerTitle}>
              {routePickerMode === 'from' ? '📍 Select Start Location' : `🎯 Navigate to where?`}
            </Text>
            {routeFrom && routePickerMode === 'to' && (
              <Text style={styles.pickerFromLabel}>From: {routeFrom.name}</Text>
            )}

            {/* Use My Location Option */}
            {routePickerMode === 'from' && livePosition && (
              <TouchableOpacity
                style={[styles.pickerOption, { backgroundColor: 'rgba(59,130,246,0.15)' }]}
                onPress={() => {
                  // Create a virtual "current location" building
                  setRouteFrom({
                    id: 'current_location',
                    name: 'My Location',
                    entranceNode: 'current_location',
                  } as any);
                  setRoutePickerMode('to');
                }}
              >
                <Ionicons name="navigate" size={18} color="#3B82F6" />
                <Text style={[styles.pickerOptionText, { color: '#3B82F6', fontWeight: 'bold' }]}>
                  Use My Location
                </Text>
              </TouchableOpacity>
            )}

            <ScrollView style={{ maxHeight: 300 }}>
              {pickerBuildings.map((b) => (
                <TouchableOpacity key={b.id} style={styles.pickerOption} onPress={() => handlePickBuilding(b)}>
                  <View style={[styles.pickerDot, { backgroundColor: b.color }]} />
                  <Text style={styles.pickerOptionText}>{b.name}</Text>
                  <Text style={styles.pickerShortName}>{b.shortName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity onPress={() => { setShowRoutePicker(false); clearNavigation(); }} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Map Canvas */}
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.mapViewport, animatedMapStyle]}>
          <CampusSvgCanvas
            width={MAP_IMAGE_WIDTH}
            height={MAP_IMAGE_HEIGHT}
            buildings={filteredBuildings}
            selectedBuildingId={selectedBuilding?.id || null}
            is3D={is3D}
            activeFloor={floor}
            route={route}
            livePosition={livePosition}
            onBuildingPress={handleSelectBuilding}
          />
        </Animated.View>
      </GestureDetector>

      {/* Building Detail Sheet */}
      {selectedBuilding && (
        <BuildingDetailSheet
          building={selectedBuilding}
          floor={floor}
          onFloorChange={setFloor}
          onClose={() => { setSelectedBuilding(null); setTooltip(null); }}
          onNavigate={() => handleStartNavigation(selectedBuilding)}
          onCalibrate={handleCalibrateSpot}
        />
      )}

      {/* Map Legend */}
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#475569' }]} />
          <Text style={styles.legendLabel}>Academic</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#EAB308' }]} />
          <Text style={styles.legendLabel}>Admin</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#059669' }]} />
          <Text style={styles.legendLabel}>Facility</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#334155' }]} />
          <Text style={styles.legendLabel}>Roads</Text>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  searchInput: {
    backgroundColor: canvas.overlay,
    color: textColors.primary,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderColor: border.default,
    borderWidth: 1,
    fontSize: 14,
  },
  categoryScroll: {
    gap: 6,
    marginBottom: 8,
    alignItems: 'center',
    paddingRight: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: canvas.overlay,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
    borderColor: border.default,
    borderWidth: 1,
  },
  categoryChipSelected: {
    backgroundColor: accent.primary,
    borderColor: accent.primary,
  },
  categoryText: {
    color: textColors.secondary,
    fontSize: 12,
  },
  categoryTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  controlButton: {
    backgroundColor: canvas.overlay,
    padding: 10,
    borderRadius: 20,
    borderColor: border.default,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  controlButtonActive: {
    backgroundColor: accent.primary,
    borderColor: accent.primary,
  },
  controlText: {
    color: textColors.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  mapViewport: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ─── Navigation Banner ──────────────────────────────────────────
  banner: {
    position: 'absolute',
    top: 160,
    left: 16,
    right: 16,
    backgroundColor: accent.primary,
    padding: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 11,
  },
  bannerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  bannerClose: {
    padding: 4,
  },
  // ─── Route Picker ───────────────────────────────────────────────
  routePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  routePicker: {
    width: SCREEN_WIDTH - 40,
    backgroundColor: canvas.elevated,
    padding: 20,
    borderRadius: 20,
    borderColor: border.default,
    borderWidth: 1,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  pickerTitle: {
    color: textColors.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  pickerFromLabel: {
    color: accent.primary,
    fontSize: 13,
    marginBottom: 12,
    fontWeight: '600',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: border.default,
    gap: 10,
  },
  pickerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pickerOptionText: {
    color: textColors.primary,
    fontSize: 15,
    flex: 1,
  },
  pickerShortName: {
    color: textColors.tertiary,
    fontSize: 12,
  },
  cancelBtn: {
    marginTop: 14,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  cancelText: {
    color: accent.primary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  // ─── Map Legend ─────────────────────────────────────────────────
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    backgroundColor: 'rgba(12, 17, 28, 0.9)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: border.default,
    zIndex: 5,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendLabel: {
    color: textColors.secondary,
    fontSize: 10,
  },
});
