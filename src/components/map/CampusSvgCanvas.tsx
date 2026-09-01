import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polygon, Polyline, Circle, G, Text as SvgText, Rect, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { CampusBuilding } from '../../data/CampusBuildings';
import { MapNode } from '../../data/MapGraph';
import { accent } from '../../theme/colors';

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);

interface CampusSvgCanvasProps {
  width: number;
  height: number;
  buildings: CampusBuilding[];
  selectedBuildingId: string | null;
  is3D: boolean;
  activeFloor: number;
  route: { path: MapNode[]; minutes: number; distance: number } | null;
  livePosition: { x: number; y: number; heading: number } | null;
  onBuildingPress: (building: CampusBuilding) => void;
}

function parsePoints(points: string): { x: number; y: number }[] {
  return points.split(' ').map(p => {
    const [x, y] = p.split(',').map(Number);
    return { x, y };
  });
}

function formatPoints(points: { x: number; y: number }[]): string {
  return points.map(p => `${p.x},${p.y}`).join(' ');
}

function getCenter(points: { x: number; y: number }[]): { x: number; y: number } {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  points.forEach(p => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
}

function adjustColor(hex: string, amount: number): string {
  if (!hex) return '#000000';
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

export const CampusSvgCanvas: React.FC<CampusSvgCanvasProps> = ({
  width,
  height,
  buildings,
  selectedBuildingId,
  is3D,
  activeFloor,
  route,
  livePosition,
  onBuildingPress,
}) => {
  const dashOffset = useSharedValue(0);

  useEffect(() => {
    if (route) {
      dashOffset.value = withRepeat(
        withTiming(-24, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      dashOffset.value = 0;
    }
  }, [route]);

  const animatedPolylineProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: dashOffset.value,
    };
  });

  const sortedBuildings = useMemo(() => {
    return [...buildings].sort((a, b) => {
      const aCenter = getCenter(parsePoints(a.polygon));
      const bCenter = getCenter(parsePoints(b.polygon));
      return aCenter.y - bCenter.y;
    });
  }, [buildings]);

  const renderBuilding = (building: CampusBuilding) => {
    const isSelected = selectedBuildingId === building.id;
    const basePts = parsePoints(building.polygon);
    const center = getCenter(basePts);
    const heightFactor = building.heightFactor || 1;
    
    // Isometric shift
    const dx = is3D ? -heightFactor * 6 : 0;
    const dy = is3D ? -heightFactor * 12 : 0;
    
    const roofPts = basePts.map(p => ({ x: p.x + dx, y: p.y + dy }));
    const baseString = formatPoints(basePts);
    const roofString = formatPoints(roofPts);

    const darkColor = adjustColor(building.color, -40);
    const lightColor = adjustColor(building.color, 20);

    return (
      <G key={building.id} onPress={() => onBuildingPress(building)}>
        {/* Shadow */}
        {is3D && (
          <Polygon
            points={formatPoints(basePts.map(p => ({ x: p.x + 8, y: p.y + 8 })))}
            fill="#000000"
            opacity={0.3}
          />
        )}

        {/* 3D Walls */}
        {is3D && heightFactor > 0 && (
          <G>
            {basePts.map((p, i) => {
              const nextIdx = (i + 1) % basePts.length;
              const nextP = basePts[nextIdx];
              // Wall quad
              const wallPts = [
                { x: p.x, y: p.y },
                { x: nextP.x, y: nextP.y },
                { x: nextP.x + dx, y: nextP.y + dy },
                { x: p.x + dx, y: p.y + dy }
              ];
              return (
                <Polygon
                  key={`wall-${i}`}
                  points={formatPoints(wallPts)}
                  fill={darkColor}
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="0.5"
                />
              );
            })}
            {/* Roof */}
            <Polygon
              points={roofString}
              fill={lightColor}
              stroke="#ffffff"
              strokeWidth="1"
            />
          </G>
        )}

        {/* Base / Flat view */}
        {!is3D && (
          <Polygon
            points={baseString}
            fill={building.color}
            opacity={0.85}
            stroke="#ffffff"
            strokeWidth="1"
          />
        )}

        {/* Selected Highlight */}
        {isSelected && (
          <Polygon
            points={is3D ? roofString : baseString}
            fill="none"
            stroke={accent.primary}
            strokeWidth="3"
          />
        )}

        {/* Label */}
        <SvgText
          x={center.x + (is3D ? dx : 0)}
          y={center.y + (is3D ? dy : 0)}
          fill="#ffffff"
          fontSize="14"
          fontWeight="bold"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {building.number}
        </SvgText>
        
        {isSelected && (
          <SvgText
            x={center.x + (is3D ? dx : 0)}
            y={center.y + (is3D ? dy : 0) + 16}
            fill="#ffffff"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {building.shortName}
          </SvgText>
        )}
      </G>
    );
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height} viewBox="0 0 800 650">
        <Defs>
          <LinearGradient id="groundGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#1E293B" stopOpacity="1" />
            <Stop offset="1" stopColor="#0F172A" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Ground */}
        <Rect x="0" y="0" width="800" height="650" fill="url(#groundGrad)" />

        {/* Walkways mock */}
        <Line x1="100" y1="300" x2="700" y2="350" stroke="#334155" strokeWidth="20" strokeLinecap="round" />
        <Line x1="400" y1="100" x2="350" y2="600" stroke="#334155" strokeWidth="20" strokeLinecap="round" />

        {/* Buildings */}
        {sortedBuildings.map(renderBuilding)}

        {/* Route Line */}
        {route && route.path.length > 0 && (
          <AnimatedPolyline
            points={route.path.map(n => `${n.x},${n.y}`).join(' ')}
            fill="none"
            stroke={accent.primary}
            strokeWidth="4"
            strokeDasharray="12,6"
            animatedProps={animatedPolylineProps}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Live Position */}
        {livePosition && (
          <G transform={`translate(${livePosition.x}, ${livePosition.y})`}>
            <Circle r="12" fill="rgba(59, 130, 246, 0.3)" />
            <Circle r="6" fill="#3B82F6" stroke="#ffffff" strokeWidth="2" />
            <Polygon
              points="-4,6 4,6 0,-8"
              fill="#ffffff"
              transform={`rotate(${livePosition.heading})`}
            />
          </G>
        )}
      </Svg>
    </View>
  );
};
