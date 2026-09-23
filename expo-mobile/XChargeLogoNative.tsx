import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  G,
  Path,
  Rect,
  Text as SvgText,
  TSpan,
} from 'react-native-svg';

interface XChargeMarkProps {
  size?: number;
  style?: any;
}

/**
 * ChargeLink GH official "C + plug + leaf" glyph mark
 * Derived from the client's official logo (xcharge_logo.jpeg)
 */
export const XChargeMarkNative: React.FC<XChargeMarkProps> = ({ size = 48, style }) => {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg viewBox="0 0 120 120" width="100%" height="100%">
        <Defs>
          <LinearGradient id="clLeafMarkN" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#4ade80" />
            <Stop offset="100%" stopColor="#16a34a" />
          </LinearGradient>
          <LinearGradient id="clCMarkN" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#22c55e" />
            <Stop offset="100%" stopColor="#15803d" />
          </LinearGradient>
        </Defs>

        {/* Dark rounded background */}
        <Rect width="120" height="120" rx="24" fill="#0f2318" />

        {/* C-shaped arc */}
        <Path
          d="M 68 18 A 42 42 0 1 0 68 102 L 68 86 A 26 26 0 1 1 68 34 Z"
          fill="url(#clCMarkN)"
        />

        {/* EV plug body */}
        <Rect x="60" y="50" width="28" height="18" rx="5" fill="url(#clLeafMarkN)" />
        <Rect x="88" y="55" width="10" height="3" rx="1.5" fill="url(#clLeafMarkN)" />
        <Rect x="88" y="62" width="10" height="3" rx="1.5" fill="url(#clLeafMarkN)" />
        {/* Lightning bolt */}
        <Path d="M72 54 L69 61 L73 61 L70 68 L77 60 L73 60 Z" fill="#ffffff" />

        {/* Leaf swoosh */}
        <Path
          d="M 40 82 Q 58 70 82 76 Q 64 86 46 90 Z"
          fill="url(#clLeafMarkN)"
          opacity="0.9"
        />
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
 * Full ChargeLink GH vector logo
 * Brand colors: ChargeLink Green (#22c55e / #4ade80) on dark (#0f2318)
 * Tagline: "Powering a Cleaner Tomorrow"
 */
export const XChargeLogoNative: React.FC<XChargeLogoProps> = ({
  width,
  height,
  size = 'md',
  showSubtitle = true,
  style,
}) => {
  const dims = {
    sm: { w: 160, h: 48 },
    md: { w: 220, h: 66 },
    lg: { w: 280, h: 84 },
    hero: { w: 340, h: 102 },
  }[size];

  const w = width ?? dims.w;
  const h = height ?? dims.h;

  return (
    <View style={[{ width: w, height: h }, style]}>
      <Svg viewBox="0 0 460 120" width="100%" height="100%">
        <Defs>
          <LinearGradient id="clLeafFull" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#4ade80" />
            <Stop offset="100%" stopColor="#16a34a" />
          </LinearGradient>
          <LinearGradient id="clCFull" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#22c55e" />
            <Stop offset="100%" stopColor="#15803d" />
          </LinearGradient>
        </Defs>

        {/* C-shaped arc */}
        <Path
          d="M 80 16 A 44 44 0 1 0 80 104 L 80 88 A 28 28 0 1 1 80 32 Z"
          fill="url(#clCFull)"
        />

        {/* EV plug body */}
        <Rect x="72" y="50" width="28" height="18" rx="5" fill="url(#clLeafFull)" />
        <Rect x="100" y="55" width="10" height="3" rx="1.5" fill="url(#clLeafFull)" />
        <Rect x="100" y="60" width="10" height="3" rx="1.5" fill="url(#clLeafFull)" />
        {/* Lightning bolt on plug */}
        <Path d="M83 54 L80 60 L84 60 L81 67 L87 59 L83 59 Z" fill="#ffffff" />

        {/* Leaf swoosh */}
        <Path
          d="M 52 80 Q 68 68 92 74 Q 76 84 58 88 Z"
          fill="url(#clLeafFull)"
          opacity="0.9"
        />

        {/* Brand Text: ChargeLink GH */}
        <SvgText x="128" y="63" fontWeight="800" fontSize="34" letterSpacing="1">
          <TSpan fill="#22c55e">Charge</TSpan>
          <TSpan fill="#ffffff">Link</TSpan>
          <TSpan fill="#4ade80"> GH</TSpan>
        </SvgText>

        {showSubtitle && (
          <SvgText
            x="130"
            y="83"
            fontSize="11"
            fontWeight="500"
            fill="#4b7c5a"
            letterSpacing="3"
          >
            POWERING A CLEANER TOMORROW
          </SvgText>
        )}
      </Svg>
    </View>
  );
};
