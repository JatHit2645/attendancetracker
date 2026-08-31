import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { MAP_NODES, MAP_EDGES } from '../data/MapGraph';

const LOCATION_OFFSET_KEY = 'CAMPUS_GPS_OFFSET';

const ANCHOR_1_GPS = { lat: 22.264672, lng: 70.710817 };
const ANCHOR_1_PIX = { x: 186, y: 302 };
const ANCHOR_2_GPS = { lat: 22.264910, lng: 70.712183 };
const ANCHOR_2_PIX = { x: 592, y: 485 };

// Conversion factors for approx flat-earth meters at 22.26 degrees Lat
const METERS_PER_LAT = 111139;
const METERS_PER_LNG = 102854;

const gpsToMeters = (lat: number, lng: number) => ({
  x: (lng - ANCHOR_1_GPS.lng) * METERS_PER_LNG,
  y: -(lat - ANCHOR_1_GPS.lat) * METERS_PER_LAT // Negative because map Y increases downwards (South), but Lat increases upwards (North)
});

const a2_m = gpsToMeters(ANCHOR_2_GPS.lat, ANCHOR_2_GPS.lng); // relative to anchor 1
const dX_pix = ANCHOR_2_PIX.x - ANCHOR_1_PIX.x;
const dY_pix = ANCHOR_2_PIX.y - ANCHOR_1_PIX.y;

// Scale: pixels per meter
const dist_m = Math.sqrt(a2_m.x * a2_m.x + a2_m.y * a2_m.y);
const dist_pix = Math.sqrt(dX_pix * dX_pix + dY_pix * dY_pix);
const SCALE = dist_pix / dist_m;

// Rotation offset
const angle_m = Math.atan2(a2_m.y, a2_m.x);
const angle_pix = Math.atan2(dY_pix, dX_pix);
const ROTATION = angle_pix - angle_m;

export const LocationService = {
  async requestPermissions() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (e) {
      console.warn("GPS Permission Error:", e);
      return false;
    }
  },

  gpsToPixel(lat: number, lng: number, offset = { dx: 0, dy: 0 }) {
    const m = gpsToMeters(lat, lng);
    
    // Rotate and scale
    const cosR = Math.cos(ROTATION);
    const sinR = Math.sin(ROTATION);
    
    const rawX = ANCHOR_1_PIX.x + (m.x * cosR - m.y * sinR) * SCALE;
    const rawY = ANCHOR_1_PIX.y + (m.x * sinR + m.y * cosR) * SCALE;

    return {
      x: rawX + offset.dx,
      y: rawY + offset.dy
    };
  },

  snapToNearestPath(x: number, y: number) {
    let closestX = x;
    let closestY = y;
    let minDistance = Infinity;

    for (const edge of MAP_EDGES) {
      const n1 = MAP_NODES.find(n => n.id === edge.from);
      const n2 = MAP_NODES.find(n => n.id === edge.to);
      if (!n1 || !n2) continue;

      const l2 = Math.pow(n1.x - n2.x, 2) + Math.pow(n1.y - n2.y, 2);
      if (l2 === 0) continue;

      let t = ((x - n1.x) * (n2.x - n1.x) + (y - n1.y) * (n2.y - n1.y)) / l2;
      t = Math.max(0, Math.min(1, t));

      const projX = n1.x + t * (n2.x - n1.x);
      const projY = n1.y + t * (n2.y - n1.y);

      const dist = Math.sqrt(Math.pow(x - projX, 2) + Math.pow(y - projY, 2));

      if (dist < minDistance) {
        minDistance = dist;
        closestX = projX;
        closestY = projY;
      }
    }

    if (minDistance < 50) {
      return { x: closestX, y: closestY };
    }
    return { x, y };
  },

  async saveCalibrationOffset(buildingId: string, currentLat: number, currentLng: number) {
    const targetBuilding = MAP_NODES.find(n => n.id === buildingId);
    if (!targetBuilding) return { dx: 0, dy: 0 };

    const uncalibratedPix = this.gpsToPixel(currentLat, currentLng, { dx: 0, dy: 0 });
    const dx = targetBuilding.x - uncalibratedPix.x;
    const dy = targetBuilding.y - uncalibratedPix.y;
    const offset = { dx, dy };
    
    try {
      await AsyncStorage.setItem(LOCATION_OFFSET_KEY, JSON.stringify(offset));
    } catch (e) {
      console.warn("Save Calibration Error:", e);
    }
    return offset;
  },

  async getCalibrationOffset() {
    try {
      const stored = await AsyncStorage.getItem(LOCATION_OFFSET_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return { dx: 0, dy: 0 };
  }
};
