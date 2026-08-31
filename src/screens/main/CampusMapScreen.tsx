import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Dimensions,
  Animated,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polyline, Circle } from 'react-native-svg';
import * as Location from 'expo-location';

import { canvas, text as textColors, border, glass, accent, shadow, palette } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { CAMPUS_BUILDINGS, CampusBuilding, MAP_IMAGE_WIDTH, MAP_IMAGE_HEIGHT } from '../../data/CampusBuildings';
import { PathfindingService } from '../../services/PathfindingService';
import { MapNode } from '../../data/MapGraph';
import { INDOOR_DIRECTORIES } from '../../data/IndoorDirectories';
import { LocationService } from '../../services/LocationService';

export default function CampusMapScreen() {
  const insets = useSafeAreaInsets();
  
  // Base UI State
  const [selectedBuilding, setSelectedBuilding] = useState<CampusBuilding | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [is3D, setIs3D] = useState(false);
  const [floor, setFloor] = useState<number>(0);

  // Navigation State
  const [navigatingTo, setNavigatingTo] = useState<CampusBuilding | null>(null);
  const [navigatingFrom, setNavigatingFrom] = useState<CampusBuilding | null>(null);
  const [route, setRoute] = useState<{ path: MapNode[]; minutes: number; distance: number } | null>(null);
  const [showRoutePicker, setShowRoutePicker] = useState(false);

  // Live Location & Simulation State
  const [livePosition, setLivePosition] = useState<{ x: number, y: number, heading: number } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [calibrationOffset, setCalibrationOffset] = useState({ dx: 0, dy: 0 });
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const simInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const horizontalScrollRef = useRef<ScrollView>(null);
  const verticalScrollRef = useRef<ScrollView>(null);
  
  const tiltAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(tiltAnim, {
      toValue: is3D ? 1 : 0,
      useNativeDriver: true,
      tension: 40,
      friction: 7,
    }).start();
  }, [is3D]);

  // Load saved calibration offset on mount
  useEffect(() => {
    LocationService.getCalibrationOffset().then(setCalibrationOffset);
    return () => {
      stopLiveTracking();
      stopSimulation();
    };
  }, []);

  const categories = ['All', 'Departments', 'Classrooms', 'Amenities', 'Admin'];

  const filteredBuildings = CAMPUS_BUILDINGS.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.number.includes(searchQuery) ||
      b.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.type.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Departments') return b.type.includes('Department') || b.type.includes('Engineering');
    if (selectedCategory === 'Classrooms') return b.type.includes('Lecture') || b.id.startsWith('13');
    if (selectedCategory === 'Amenities') return b.id === '16' || b.id === '17' || b.id === '15';
    if (selectedCategory === 'Admin') return b.id === '1' || b.id === '10' || b.id === '14';
    return true;
  });

  const handleSelectBuilding = (building: CampusBuilding) => {
    setSelectedBuilding(building);
    setFloor(0);
    const screenWidth = Dimensions.get('window').width;
    const targetX = Math.max(0, building.x * 1.3 - screenWidth / 2);
    const targetY = Math.max(0, building.y * 1.3 - 200);
    horizontalScrollRef.current?.scrollTo({ x: targetX, animated: true });
    verticalScrollRef.current?.scrollTo({ y: targetY, animated: true });
  };

  const handleZoom = (delta: number) => {
    setZoomScale((prev) => Math.min(2.5, Math.max(0.7, prev + delta)));
  };

  // --- GPS Tracking & Calibration ---

  const startLiveTracking = async () => {
    const hasPerm = await LocationService.requestPermissions();
    if (!hasPerm) {
      Alert.alert('Permission Denied', 'Location is required to show you on the campus map.');
      return;
    }
    stopSimulation();
    setIsLiveTracking(true);
    
    try {
      locationSub.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 1, timeInterval: 1000 },
        (loc) => {
          const rawPix = LocationService.gpsToPixel(loc.coords.latitude, loc.coords.longitude, calibrationOffset);
          const snappedPix = LocationService.snapToNearestPath(rawPix.x, rawPix.y);
          setLivePosition({
            x: snappedPix.x,
            y: snappedPix.y,
            heading: loc.coords.heading || 0
          });
        }
      );
    } catch (e) {
      console.warn("Watch position error", e);
    }
  };

  const stopLiveTracking = () => {
    if (locationSub.current) {
      locationSub.current.remove();
      locationSub.current = null;
    }
    setIsLiveTracking(false);
    setLivePosition(null);
  };

  const handleCalibrateSpot = async () => {
    if (!selectedBuilding) return;
    const hasPerm = await LocationService.requestPermissions();
    if (!hasPerm) return;

    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const offset = await LocationService.saveCalibrationOffset(selectedBuilding.id, loc.coords.latitude, loc.coords.longitude);
      setCalibrationOffset(offset);
      Alert.alert('Calibrated!', `Your phone's GPS is now perfectly locked to ${selectedBuilding.name}.`);
    } catch (e) {
      Alert.alert('Error', 'Could not get current location.');
    }
  };

  // --- Navigation & Simulation ---

  const handleStartNavigation = () => {
    setNavigatingTo(selectedBuilding);
    setShowRoutePicker(true);
    setSelectedBuilding(null);
  };

  const calculateRoute = (fromBuilding: CampusBuilding) => {
    setNavigatingFrom(fromBuilding);
    setShowRoutePicker(false);
    
    if (navigatingTo) {
      const result = PathfindingService.findShortestPath(fromBuilding.id, navigatingTo.id);
      if (result) {
        setRoute({ path: result.path, minutes: result.estimatedMinutes, distance: result.totalDistancePixels });
        const screenWidth = Dimensions.get('window').width;
        horizontalScrollRef.current?.scrollTo({ x: Math.max(0, fromBuilding.x * 1.3 - screenWidth / 2), animated: true });
      } else {
        Alert.alert("Route Error", "Could not find a path between these buildings.");
      }
    }
  };

  const clearNavigation = () => {
    setNavigatingTo(null);
    setNavigatingFrom(null);
    setRoute(null);
    stopSimulation();
  };

  const startSimulation = () => {
    if (!route || route.path.length < 2) return;
    stopLiveTracking();
    setIsSimulating(true);

    let pathIndex = 0;
    let t = 0;
    const speed = 1.0; // Base speed multiplier

    simInterval.current = setInterval(() => {
      if (pathIndex >= route.path.length - 1) {
        stopSimulation();
        Alert.alert('Arrived', `You have reached ${navigatingTo?.name}!`);
        return;
      }
      const p1 = route.path[pathIndex];
      const p2 = route.path[pathIndex + 1];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      const currentX = p1.x + (dx * t);
      const currentY = p1.y + (dy * t);
      
      const heading = (Math.atan2(dy, dx) * 180 / Math.PI) + 90;

      setLivePosition({ x: currentX, y: currentY, heading });

      if (dist === 0) {
        pathIndex++;
        return;
      }

      t += speed / dist; // Normalize speed properly
      if (t >= 1) {
        t -= 1; // Preserve remainder for smooth motion
        pathIndex++;
      }
    }, 50);
  };

  const stopSimulation = () => {
    if (simInterval.current) clearInterval(simInterval.current);
    setIsSimulating(false);
    setLivePosition(null);
  };

  const canvasWidth = MAP_IMAGE_WIDTH * 1.3 * zoomScale;
  const canvasHeight = MAP_IMAGE_HEIGHT * 1.3 * zoomScale;
  const scaleRatio = 1.3 * zoomScale;

  // 3D Transforms
  const mapRotateX = tiltAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '55deg'] });
  const mapRotateZ = tiltAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-35deg'] });
  const pinRotateX = tiltAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-55deg'] });
  const pinRotateZ = tiltAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '35deg'] });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Campus Explorer</Text>
            <Text style={styles.headerSubtitle}>Tap any building (1–17) or search</Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.toggleBtn, isLiveTracking && styles.toggleBtnActive]} 
              onPress={isLiveTracking ? stopLiveTracking : startLiveTracking}
            >
              <Ionicons name="location" size={16} color={isLiveTracking ? '#fff' : textColors.secondary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.toggleBtn, is3D && styles.toggleBtnActive]} onPress={() => setIs3D(!is3D)}>
              <Text style={[styles.toggleBtnText, is3D && { color: '#fff' }]}>3D</Text>
            </TouchableOpacity>

            <View style={styles.zoomControls}>
              <TouchableOpacity style={styles.zoomBtn} onPress={() => handleZoom(0.2)}>
                <Ionicons name="add" size={18} color={textColors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.zoomBtn} onPress={() => handleZoom(-0.2)}>
                <Ionicons name="remove" size={18} color={textColors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={textColors.tertiary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search building, block #, or department..."
            placeholderTextColor={textColors.disabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={textColors.tertiary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryPill, selectedCategory === cat && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryPillText, selectedCategory === cat && styles.categoryPillTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ─── Navigation Banner ─── */}
      {route && navigatingTo && navigatingFrom && (
        <View style={styles.navBanner}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.navIconContainer, isSimulating && { backgroundColor: palette.emerald[500] }]}>
              <Ionicons name={isSimulating ? "play" : "walk"} size={20} color="#fff" />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.navBannerTitle}>
                {navigatingFrom.shortName} <Ionicons name="arrow-forward" size={14} color={textColors.primary} /> {navigatingTo.shortName}
              </Text>
              <Text style={styles.navBannerTime}>
                {isSimulating ? 'Simulating Journey...' : `${route.minutes} min walk`} 
                <Text style={{ color: textColors.tertiary }}> • {Math.round(route.distance * 0.5)}m</Text>
              </Text>
            </View>
          </View>
          
          {!isSimulating && (
            <TouchableOpacity onPress={startSimulation} style={styles.simBtn}>
              <Text style={styles.simBtnText}>Preview</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={clearNavigation} style={styles.navCancelBtn}>
            <Ionicons name="close" size={20} color={textColors.secondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Route Start Picker ─── */}
      {showRoutePicker && navigatingTo && (
        <View style={styles.routePickerBanner}>
          <Text style={styles.routePickerTitle}>Navigate to {navigatingTo.shortName}</Text>
          <Text style={styles.routePickerSub}>Select your starting location:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {CAMPUS_BUILDINGS.filter(b => b.id !== navigatingTo.id).map(b => (
              <TouchableOpacity
                key={b.id}
                style={[styles.routePickerBtn, { borderColor: b.color }]}
                onPress={() => calculateRoute(b)}
              >
                <Text style={styles.routePickerBtnText}>{b.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.navCancelBtnAbsolute} onPress={() => setShowRoutePicker(false)}>
            <Ionicons name="close" size={20} color={textColors.secondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Interactive Map Viewport ─── */}
      <View style={styles.mapContainer}>
        <ScrollView ref={verticalScrollRef} style={styles.verticalScroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>
          <ScrollView ref={horizontalScrollRef} horizontal showsHorizontalScrollIndicator={false} bounces={false}>
            <Animated.View style={{ width: canvasWidth, height: canvasHeight, position: 'relative', transform: [{ rotateX: mapRotateX }, { rotateZ: mapRotateZ }] }}>
              {/* Crisp Original Map Image */}
              <Image source={require('../../assets/campus_map.png')} style={{ width: canvasWidth, height: canvasHeight }} resizeMode="contain" />

              {/* Route Overlay Layer */}
              {route && (
                <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
                  <Polyline
                    points={route.path.map(n => `${n.x * scaleRatio},${n.y * scaleRatio}`).join(' ')}
                    fill="none"
                    stroke={accent.primary}
                    strokeWidth={5 * zoomScale}
                    strokeDasharray="10, 10"
                  />
                </Svg>
              )}

              {/* Live Location / Sim Dot */}
              {livePosition && (
                <Animated.View style={[
                  styles.liveDotWrapper,
                  {
                    left: (livePosition.x * scaleRatio) - 20,
                    top: (livePosition.y * scaleRatio) - 20,
                    transform: [{ rotateZ: pinRotateZ }, { rotateX: pinRotateX }]
                  }
                ]}>
                  <View style={[styles.liveDotHeading, { transform: [{ rotate: `${livePosition.heading}deg` }] }]}>
                    <View style={styles.liveDotArrow} />
                  </View>
                  <View style={styles.liveDotCore} />
                  <View style={styles.liveDotPulse} />
                </Animated.View>
              )}

              {/* Interactive Touch Pin Hotspots */}
              {CAMPUS_BUILDINGS.map((b) => {
                const isSelected = selectedBuilding?.id === b.id;
                const isFiltered = filteredBuildings.some((fb) => fb.id === b.id);
                const isStart = navigatingFrom?.id === b.id;
                const isEnd = navigatingTo?.id === b.id;
                const pinX = b.x * scaleRatio;
                const pinY = b.y * scaleRatio;

                if (!isFiltered && !isSelected && !isStart && !isEnd) return null;
                const floorOffset = is3D ? (b.floors || 1) * 8 : 0;

                return (
                  <Animated.View
                    key={b.id}
                    style={[
                      styles.pinHotspot,
                      {
                        left: pinX - 18,
                        top: pinY - 18 - floorOffset,
                        backgroundColor: isSelected ? accent.primary : b.color,
                        borderColor: isSelected ? '#ffffff' : 'rgba(255,255,255,0.7)',
                        transform: [{ rotateZ: pinRotateZ }, { rotateX: pinRotateX }, { scale: isSelected || isStart || isEnd ? 1.3 : 1 }],
                        shadowOpacity: is3D ? 0.3 : 0.1,
                        shadowOffset: { width: 0, height: floorOffset * 2 },
                        zIndex: isSelected ? 100 : (b.y),
                      },
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => handleSelectBuilding(b)}
                      style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                    >
                      <Text style={styles.pinText}>{b.number}</Text>
                      {(isSelected || isStart || isEnd) && (
                        <View style={[styles.pulseRing, { borderColor: isStart ? palette.emerald[500] : accent.primary }]} />
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </Animated.View>
          </ScrollView>
        </ScrollView>
      </View>

      {/* ─── Selected Building Detail Sheet ─── */}
      {selectedBuilding && (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={[styles.buildingBadge, { backgroundColor: selectedBuilding.color }]}>
              <Text style={styles.buildingBadgeText}>{selectedBuilding.number}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.detailTitle} numberOfLines={1}>{selectedBuilding.name}</Text>
              <Text style={styles.detailType}>{selectedBuilding.type}</Text>
            </View>
            <TouchableOpacity style={styles.closeCardBtn} onPress={() => setSelectedBuilding(null)}>
              <Ionicons name="close" size={20} color={textColors.primary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.detailDesc}>{selectedBuilding.description}</Text>

          {/* Floor Switcher & Interactive Indoor Directory */}
          {selectedBuilding.floors ? (
            <View style={styles.floorSwitcher}>
              {selectedBuilding.floors > 1 && (
                <View style={styles.floorTabsRow}>
                  <Text style={styles.floorLabel}>Floor:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: 8 }}>
                    {Array.from({ length: selectedBuilding.floors }).map((_, i) => (
                      <TouchableOpacity 
                        key={i} 
                        style={[styles.floorBtn, floor === i && styles.floorBtnActive]}
                        onPress={() => setFloor(i)}
                      >
                        <Text style={[styles.floorBtnText, floor === i && styles.floorBtnTextActive]}>
                          {i === 0 ? 'G' : i}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              
              {/* Indoor Directory List */}
              {INDOOR_DIRECTORIES[selectedBuilding.id] && INDOOR_DIRECTORIES[selectedBuilding.id][floor] ? (
                <View style={styles.directoryList}>
                  {INDOOR_DIRECTORIES[selectedBuilding.id][floor].map(room => (
                    <View key={room.id} style={styles.roomRow}>
                      <View style={styles.roomIcon}>
                        <Ionicons 
                          name={room.type === 'Classroom' ? 'easel' : room.type === 'Lab' ? 'flask' : room.type === 'Office' ? 'briefcase' : 'business'} 
                          size={14} 
                          color={textColors.secondary} 
                        />
                      </View>
                      <Text style={styles.roomName}>{room.name}</Text>
                      <Text style={styles.roomType}>{room.type}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noDirectoryText}>Detailed floor plan not yet available.</Text>
              )}
            </View>
          ) : null}

          <View style={styles.detailFooter}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleStartNavigation}>
              <Ionicons name="navigate" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.calibrateBtn} onPress={handleCalibrateSpot}>
              <Ionicons name="locate" size={16} color={textColors.secondary} />
              <Text style={styles.calibrateBtnText}>Calibrate Spot</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: canvas.base },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, backgroundColor: canvas.base, borderBottomWidth: 1, borderBottomColor: border.default, zIndex: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontFamily: fontFamily.bold, fontSize: fontSize.xl, color: textColors.primary },
  headerSubtitle: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: textColors.secondary, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.md, backgroundColor: glass.medium, borderWidth: 1, borderColor: border.default, justifyContent: 'center', alignItems: 'center' },
  toggleBtnActive: { backgroundColor: accent.primary, borderColor: accent.primaryHover },
  toggleBtnText: { fontFamily: fontFamily.bold, fontSize: fontSize.sm, color: textColors.secondary },
  zoomControls: { flexDirection: 'row', gap: 4 },
  zoomBtn: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: glass.medium, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: border.default },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: glass.light, borderRadius: radius.lg, paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 8 : 4, borderWidth: 1, borderColor: border.default, marginBottom: 10 },
  searchInput: { flex: 1, fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: textColors.primary },
  categoryScroll: { flexDirection: 'row' },
  categoryPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.full, backgroundColor: glass.subtle, marginRight: 8, borderWidth: 1, borderColor: border.default },
  categoryPillActive: { backgroundColor: accent.primary, borderColor: accent.primary },
  categoryPillText: { fontFamily: fontFamily.medium, fontSize: fontSize.xs, color: textColors.secondary },
  categoryPillTextActive: { color: '#ffffff', fontFamily: fontFamily.bold },
  
  navBanner: { position: 'absolute', top: Platform.OS === 'ios' ? 140 : 160, left: 16, right: 16, backgroundColor: canvas.elevated, borderRadius: radius.lg, padding: 12, flexDirection: 'row', alignItems: 'center', zIndex: 50, ...shadow.medium, borderWidth: 1, borderColor: border.default },
  navIconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: accent.primary, justifyContent: 'center', alignItems: 'center' },
  navBannerTitle: { fontFamily: fontFamily.bold, fontSize: fontSize.sm, color: textColors.primary },
  navBannerTime: { fontFamily: fontFamily.medium, fontSize: fontSize.xs, color: accent.primary, marginTop: 2 },
  navCancelBtn: { padding: 6, backgroundColor: glass.medium, borderRadius: radius.full, marginLeft: 8 },
  simBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: palette.emerald[500], borderRadius: radius.md, marginLeft: 8 },
  simBtnText: { fontFamily: fontFamily.bold, fontSize: fontSize.xs, color: '#fff' },
  
  routePickerBanner: { position: 'absolute', top: Platform.OS === 'ios' ? 140 : 160, left: 16, right: 16, backgroundColor: canvas.elevated, borderRadius: radius.lg, padding: 16, zIndex: 50, ...shadow.strong, borderWidth: 1, borderColor: border.default },
  routePickerTitle: { fontFamily: fontFamily.bold, fontSize: fontSize.base, color: textColors.primary },
  routePickerSub: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: textColors.secondary, marginTop: 2 },
  routePickerBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1, marginRight: 8, backgroundColor: glass.subtle },
  routePickerBtnText: { fontFamily: fontFamily.medium, fontSize: fontSize.xs, color: textColors.primary },
  navCancelBtnAbsolute: { position: 'absolute', top: 12, right: 12, padding: 4 },
  
  mapContainer: { flex: 1, backgroundColor: '#ffffff' },
  verticalScroll: { flex: 1 },
  scrollContent: { alignItems: 'center', justifyContent: 'center' },
  pinHotspot: { position: 'absolute', width: 36, height: 36, borderRadius: 18, borderWidth: 2, shadowColor: '#000', shadowRadius: 4 },
  pinText: { fontFamily: fontFamily.bold, fontSize: 13, color: '#ffffff', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  pulseRing: { position: 'absolute', width: 48, height: 48, borderRadius: 24, borderWidth: 3, top: -8, left: -8, opacity: 0.6 },
  
  // Live GPS Dot
  liveDotWrapper: { position: 'absolute', width: 40, height: 40, justifyContent: 'center', alignItems: 'center', zIndex: 200 },
  liveDotCore: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#3B82F6', borderWidth: 2, borderColor: '#fff' },
  liveDotPulse: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(59,130,246,0.3)' },
  liveDotHeading: { position: 'absolute', width: 40, height: 40, alignItems: 'center', justifyContent: 'flex-start' },
  liveDotArrow: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'rgba(59,130,246,0.8)', top: 2 },
  
  detailCard: { position: 'absolute', bottom: 24, left: 16, right: 16, backgroundColor: canvas.elevated, borderRadius: radius.xl, padding: 16, borderWidth: 1, borderColor: border.default, zIndex: 30, ...shadow.strong },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  buildingBadge: { width: 36, height: 36, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  buildingBadgeText: { fontFamily: fontFamily.bold, fontSize: fontSize.base, color: '#ffffff' },
  detailTitle: { fontFamily: fontFamily.bold, fontSize: fontSize.base, color: textColors.primary },
  detailType: { fontFamily: fontFamily.medium, fontSize: fontSize.xs, color: textColors.tertiary, marginTop: 1 },
  closeCardBtn: { padding: 4 },
  detailDesc: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: textColors.secondary, lineHeight: 18, marginBottom: 12 },
  
  floorSwitcher: { marginBottom: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: border.subtle },
  floorTabsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  floorLabel: { fontFamily: fontFamily.medium, fontSize: fontSize.xs, color: textColors.tertiary },
  floorBtn: { width: 28, height: 28, borderRadius: radius.full, backgroundColor: glass.subtle, justifyContent: 'center', alignItems: 'center', marginRight: 6, borderWidth: 1, borderColor: border.default },
  floorBtnActive: { backgroundColor: accent.primary, borderColor: accent.primary },
  floorBtnText: { fontFamily: fontFamily.bold, fontSize: fontSize.xs, color: textColors.secondary },
  floorBtnTextActive: { color: '#fff' },
  
  directoryList: { backgroundColor: glass.subtle, borderRadius: radius.md, padding: 8 },
  roomRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  roomIcon: { width: 20, alignItems: 'center', marginRight: 6 },
  roomName: { flex: 1, fontFamily: fontFamily.medium, fontSize: fontSize.xs, color: textColors.primary },
  roomType: { fontFamily: fontFamily.regular, fontSize: 10, color: textColors.tertiary },
  noDirectoryText: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: textColors.disabled, fontStyle: 'italic' },
  
  detailFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: accent.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.md, gap: 6 },
  actionBtnText: { fontFamily: fontFamily.bold, fontSize: fontSize.sm, color: '#fff' },
  calibrateBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md, backgroundColor: glass.subtle, borderWidth: 1, borderColor: border.default },
  calibrateBtnText: { fontFamily: fontFamily.medium, fontSize: fontSize.xs, color: textColors.secondary },
});
