import React, { useState, useEffect, useMemo } from 'react';
import { View, Image, StyleSheet, Dimensions, TextInput, TouchableOpacity, Text, ScrollView } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
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

const categories = [
  { key: 'All', icon: 'apps', label: 'All' },
  { key: 'department', icon: 'school', label: 'Depts' },
  { key: 'classroom', icon: 'book', label: 'Classes' },
  { key: 'amenity', icon: 'cafe', label: 'Food' },
  { key: 'admin', icon: 'briefcase', label: 'Admin' },
  { key: 'research', icon: 'flask', label: 'Labs' },
];

export default function CampusMapScreen() {
  const [selectedBuilding, setSelectedBuilding] = useState<CampusBuilding | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [is3D, setIs3D] = useState(false);
  const [floor, setFloor] = useState(0);
  const [navigatingTo, setNavigatingTo] = useState<CampusBuilding | null>(null);
  const [navigatingFrom, setNavigatingFrom] = useState<CampusBuilding | null>(null);
  const [route, setRoute] = useState<{ path: MapNode[]; minutes: number; distance: number } | null>(null);
  const [showRoutePicker, setShowRoutePicker] = useState(false);
  const [livePosition, setLivePosition] = useState<{ x: number; y: number; heading: number } | null>(null);
  const [isLiveTracking, setIsLiveTracking] = useState(false);

  // Gesture handling
  const scale = useSharedValue(0.8);
  const savedScale = useSharedValue(0.8);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Hit testing logic for SVG
  const isPointInPolygon = (point: {x: number, y: number}, vs: {x: number, y: number}[]) => {
    let x = point.x, y = point.y;
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      let xi = vs[i].x, yi = vs[i].y;
      let xj = vs[j].x, yj = vs[j].y;
      let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const handleMapTap = (screenX: number, screenY: number) => {
    const svgX = (screenX - (screenWidth / 2) - translateX.value) / scale.value + (MAP_IMAGE_WIDTH / 2);
    const svgY = (screenY - (screenHeight / 3) - translateY.value) / scale.value + (MAP_IMAGE_HEIGHT / 2);

    for (const b of CAMPUS_BUILDINGS) {
      if (b.shapeType === 'circle' && b.circle) {
        const dist = Math.sqrt(Math.pow(svgX - b.circle.cx, 2) + Math.pow(svgY - b.circle.cy, 2));
        if (dist <= b.circle.r) {
          handleSelectBuilding(b);
          return;
        }
      } else if (b.shapeType === 'polygon' && b.polygon) {
        const pts = b.polygon.split(' ').map(p => {
          const [x, y] = p.split(',').map(Number);
          return { x, y };
        });
        if (isPointInPolygon({x: svgX, y: svgY}, pts)) {
          handleSelectBuilding(b);
          return;
        }
      }
    }
  };

  const tapGesture = Gesture.Tap()
    .maxDistance(10)
    .runOnJS(true)
    .onEnd((e) => {
      handleMapTap(e.x, e.y);
    });

  const panGesture = Gesture.Pan()
    .minDistance(10)
    .maxPointers(1)
    .cancelsTouchesInView(false)
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const pinchGesture = Gesture.Pinch()
    .cancelsTouchesInView(false)
    .onUpdate((e) => {
      scale.value = Math.max(0.2, Math.min(savedScale.value * e.scale, 5));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture, tapGesture);

  const animatedMapStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value }
    ] as const
  }));

  const centerOnBuilding = (building: CampusBuilding) => {
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const targetScale = 1.5;
    
    scale.value = withSpring(targetScale);
    savedScale.value = targetScale;

    const bx = building.x ?? (MAP_IMAGE_WIDTH / 2);
    const by = building.y ?? (MAP_IMAGE_HEIGHT / 2);

    const tx = screenWidth / 2 - bx * targetScale;
    const ty = screenHeight / 3 - by * targetScale;

    translateX.value = withSpring(tx);
    translateY.value = withSpring(ty);
    savedTranslateX.value = tx;
    savedTranslateY.value = ty;
  };

  const handleSelectBuilding = (building: CampusBuilding) => {
    if (building) {
      setSelectedBuilding(building);
      centerOnBuilding(building);
    }
  };

  useEffect(() => {
    LocationService.resetCalibration();
    return () => { stopLiveTracking(); stopSimulation(); };
  }, []);

  const locationSub = React.useRef<Location.LocationSubscription | null>(null);

  const startLiveTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }
      setIsLiveTracking(true);
      locationSub.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 1 },
        async (pos: any) => {
          const offset = await LocationService.getCalibrationOffset();
          const pix = LocationService.gpsToPixel(pos.coords.latitude, pos.coords.longitude, offset);
          const snapped = LocationService.snapToNearestPath(pix.x, pix.y);
          setLivePosition({ 
            x: snapped.x, 
            y: snapped.y, 
            heading: pos.coords.heading || 0 
          });
        }
      );
    } catch (err) {
      console.error(err);
      setIsLiveTracking(false);
    }
  };

  const stopLiveTracking = () => {
    setIsLiveTracking(false);
    locationSub.current?.remove();
    locationSub.current = null;
    setLivePosition(null);
  };

  const handleCalibrateSpot = async () => {
    LocationService.resetCalibration();
    if (selectedBuilding) {
      const pos = await Location.getCurrentPositionAsync({});
      LocationService.saveCalibrationOffset(selectedBuilding.id, pos.coords.latitude, pos.coords.longitude);
    }
  };

  const handleStartNavigation = (building: CampusBuilding) => {
    setNavigatingTo(building);
    setShowRoutePicker(true);
    setSelectedBuilding(null);
  };

  const calculateRoute = (fromId: string, toId: string) => {
    const result = PathfindingService.findShortestPath(fromId, toId);
    if (result) {
      setRoute({ path: result.path, minutes: result.estimatedMinutes, distance: result.totalDistancePixels });
      setShowRoutePicker(false);
    }
  };

  const clearNavigation = () => {
    setRoute(null);
    setNavigatingTo(null);
    setNavigatingFrom(null);
  };

  const startSimulation = () => {
    // Keep from old code - dummy walking preview
  };

  const stopSimulation = () => {
    // Stop walking preview
  };

  const filteredBuildings = useMemo(() => {
    return CAMPUS_BUILDINGS.filter((b: any) => {
      const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            b.shortName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <GestureHandlerRootView style={styles.container}>
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
              style={[
                styles.categoryChip,
                selectedCategory === cat.key && styles.categoryChipSelected
              ]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              <Ionicons
                name={cat.icon as any}
                size={16}
                color={selectedCategory === cat.key ? '#fff' : textColors.secondary}
              />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat.key && styles.categoryTextSelected
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.controlButton} onPress={() => setIs3D(!is3D)}>
            <Text style={styles.controlText}>{is3D ? '2D' : '3D'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={() => {
            if (isLiveTracking) stopLiveTracking();
            else startLiveTracking();
          }}>
            <Ionicons name={isLiveTracking ? 'location' : 'location-outline'} size={20} color={isLiveTracking ? accent.primary : textColors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {route && navigatingTo && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Navigating to {navigatingTo.name} ({route.minutes.toFixed(0)} min, {route.distance.toFixed(0)}m)
          </Text>
          <TouchableOpacity onPress={clearNavigation} style={styles.bannerClose}>
            <Ionicons name="close-circle" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {showRoutePicker && (
        <View style={styles.routePicker}>
          <Text style={styles.pickerTitle}>Select Start Location</Text>
          {CAMPUS_BUILDINGS.slice(0, 5).map((b: any) => (
            <TouchableOpacity key={b.id} style={styles.pickerOption} onPress={() => {
              setNavigatingFrom(b);
              if (navigatingTo) calculateRoute(b.id, navigatingTo.id);
            }}>
              <Text style={styles.pickerOptionText}>{b.name}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => setShowRoutePicker(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

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

      {selectedBuilding && (
        <BuildingDetailSheet
          building={selectedBuilding}
          floor={floor}
          onFloorChange={setFloor}
          onClose={() => setSelectedBuilding(null)}
          onNavigate={() => handleStartNavigation(selectedBuilding)}
          onCalibrate={handleCalibrateSpot}
        />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  searchInput: {
    backgroundColor: canvas.overlay,
    color: textColors.primary,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderColor: border.default,
    borderWidth: 1,
  },
  categoryScroll: {
    gap: 8,
    marginBottom: 10,
    alignItems: 'center',
    paddingRight: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: canvas.overlay,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderColor: border.default,
    borderWidth: 1,
  },
  categoryChipSelected: {
    backgroundColor: accent.primary,
    borderColor: accent.primary,
  },
  categoryText: {
    color: textColors.secondary,
    fontSize: 14,
  },
  categoryTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  controlButton: {
    backgroundColor: canvas.overlay,
    padding: 10,
    borderRadius: 20,
    borderColor: border.default,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlText: {
    color: textColors.primary,
    fontWeight: 'bold',
  },
  mapViewport: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    position: 'absolute',
    top: 150,
    left: 20,
    right: 20,
    backgroundColor: accent.primary,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 11,
  },
  bannerText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bannerClose: {
    padding: 5,
  },
  routePicker: {
    position: 'absolute',
    top: '30%',
    left: 20,
    right: 20,
    backgroundColor: canvas.elevated,
    padding: 20,
    borderRadius: 15,
    zIndex: 20,
    borderColor: border.default,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  pickerTitle: {
    color: textColors.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  pickerOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: border.default,
  },
  pickerOptionText: {
    color: textColors.secondary,
    fontSize: 16,
  },
  cancelText: {
    color: accent.primary,
    marginTop: 15,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
