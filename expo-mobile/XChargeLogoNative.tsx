import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  G,
  Path,
  Text as SvgText,
  TSpan,
} from 'react-native-svg';

interface XChargeMarkProps {
  size?: number;
  style?: any;
}

/**
 * Authentic Aerodynamic X blade glyph from public/xcharge-logo.svg
 */
export const XChargeMarkNative: React.FC<XChargeMarkProps> = ({ size = 48, style }) => {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg viewBox="24 21 52 48" width="100%" height="100%">
        <Defs>
          <LinearGradient id="cyanBladeMark" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#00d2ff" />
            <Stop offset="60%" stopColor="#00f0ff" />
            <Stop offset="100%" stopColor="#55f5ff" />
          </LinearGradient>
          <LinearGradient id="whiteBladeMark" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#ffffff" />
            <Stop offset="100%" stopColor="#cbd5e1" />
          </LinearGradient>
        </Defs>

        <G>
          {/* Top-Left White Wing */}
          <Path
            d="M 32 24 L 46 24 C 49 24 51 27 49 30 L 44 38 C 42 41 38 41 36 38 L 30 29 C 29 27 30 24 32 24 Z"
            fill="url(#whiteBladeMark)"
          />
          {/* Bottom-Right White Wing */}
          <Path
            d="M 52 48 L 57 44 C 59 42 63 43 65 46 L 70 54 C 71 56 70 59 67 59 L 58 59 C 55 59 53 56 55 53 Z"
            fill="url(#whiteBladeMark)"
          />
          {/* Cyan Main Diagonal Blade */}
          <Path
            d="M 28 64 L 42 46 C 44 43 47 41 50 39 L 68 25 C 71 23 74 25 73 28 L 68 34 C 66 36 63 38 60 41 L 44 60 C 42 63 38 65 34 66 L 27 67 C 25 67 25 65 28 64 Z"
            fill="url(#cyanBladeMark)"
          />
        </G>
      </Svg>
    </View>
  );
};

interface XChargeLogoProps {
  width?: number;
  height?: number;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showSubtitle?: boolean;
  style?: any;
}

/**
 * Full authentic XCHARGE native vector logo from public/xcharge-logo.svg
 */
export const XChargeLogoNative: React.FC<XChargeLogoProps> = ({
  width,
  height,
  size = 'md',
  showSubtitle = true,
  style,
}) => {
  const dims = {
    sm: { w: 140, h: 42 },
    md: { w: 200, h: 60 },
    lg: { w: 260, h: 78 },
    hero: { w: 320, h: 96 },
  }[size];

  const w = width ?? dims.w;
  const h = height ?? dims.h;

  return (
    <View style={[{ width: w, height: h }, style]}>
      <Svg viewBox="0 0 400 120" width="100%" height="100%">
        <Defs>
          <LinearGradient id="cyanBladeFull" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#00d2ff" />
            <Stop offset="60%" stopColor="#00f0ff" />
            <Stop offset="100%" stopColor="#55f5ff" />
          </LinearGradient>
          <LinearGradient id="whiteBladeFull" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#ffffff" />
            <Stop offset="100%" stopColor="#cbd5e1" />
          </LinearGradient>
        </Defs>

        {/* Aerodynamic X Mark */}
        <G transform="translate(10, 10) scale(0.9)">
          {/* Top-Left White Wing */}
          <Path
            d="M 32 24 L 46 24 C 49 24 51 27 49 30 L 44 38 C 42 41 38 41 36 38 L 30 29 C 29 27 30 24 32 24 Z"
            fill="url(#whiteBladeFull)"
          />
          {/* Bottom-Right White Wing */}
          <Path
            d="M 52 48 L 57 44 C 59 42 63 43 65 46 L 70 54 C 71 56 70 59 67 59 L 58 59 C 55 59 53 56 55 53 Z"
            fill="url(#whiteBladeFull)"
          />
          {/* Cyan Main Diagonal Blade */}
          <Path
            d="M 28 64 L 42 46 C 44 43 47 41 50 39 L 68 25 C 71 23 74 25 73 28 L 68 34 C 66 36 63 38 60 41 L 44 60 C 42 63 38 65 34 66 L 27 67 C 25 67 25 65 28 64 Z"
            fill="url(#cyanBladeFull)"
          />
        </G>

        {/* Typography */}
        <SvgText
          x="110"
          y="65"
          fontWeight="800"
          fontSize="38"
          letterSpacing="4"
        >
          <TSpan fill="#00f0ff">X</TSpan>
          <TSpan fill="#ffffff">CHARGE</TSpan>
        </SvgText>

        {showSubtitle && (
          <SvgText
            x="112"
            y="85"
            fontSize="11"
            fontWeight="600"
            fill="#64748b"
            letterSpacing="6"
          >
            ENERGY NETWORK
          </SvgText>
        )}
      </Svg>
    </View>
  );
};
