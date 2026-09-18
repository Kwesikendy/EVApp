import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Circle, Ellipse, Path, Text as SvgText, G, Defs, ClipPath } from 'react-native-svg';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'icon';
  style?: any;
}

/**
 * Authentic MTN MoMo Native Vector Logo (Ghana)
 */
export const MtnMomoLogoNative: React.FC<LogoProps> = ({ size = 'md', style }) => {
  const dims = {
    icon: { w: 34, h: 34 },
    sm: { w: 46, h: 30 },
    md: { w: 68, h: 44 },
    lg: { w: 94, h: 60 },
  }[size];

  return (
    <View style={[styles.momoCard, { width: dims.w, height: dims.h }, style]}>
      <Svg viewBox="0 0 500 340" width="100%" height="100%">
        {/* Yellow Background Panels */}
        <Rect x="15" y="15" width="220" height="230" rx="20" fill="#FFC400" />
        <Rect x="250" y="15" width="235" height="230" rx="20" fill="#FFC400" />

        {/* Left Side: MTN Dark Cyan/Blue Oval */}
        <Ellipse cx="125" cy="130" rx="92" ry="54" fill="#004F71" />
        <SvgText
          x="125"
          y="148"
          fontWeight="bold"
          fontSize="52"
          fill="#FFC400"
          textAnchor="middle"
        >
          MTN
        </SvgText>
        {/* Red accent dot under T */}
        <Rect x="122" y="153" width="12" height="7" fill="#E2001A" />

        {/* Right Side: Phone & Flying Cash */}
        <G transform="translate(260, 20)">
          <Rect x="75" y="60" width="85" height="150" rx="16" fill="#000000" />
          <Rect x="80" y="65" width="75" height="140" rx="12" fill="#FFFFFF" />
          <Rect x="105" y="73" width="25" height="4" rx="2" fill="#000000" />

          {/* Keypad dots */}
          <G fill="#000000">
            <Rect x="90" y="145" width="14" height="10" rx="2" />
            <Rect x="110" y="145" width="14" height="10" rx="2" />
            <Rect x="130" y="145" width="14" height="10" rx="2" />

            <Rect x="90" y="160" width="14" height="10" rx="2" />
            <Rect x="110" y="160" width="14" height="10" rx="2" />
            <Rect x="130" y="160" width="14" height="10" rx="2" />

            <Rect x="90" y="175" width="14" height="10" rx="2" />
            <Rect x="110" y="175" width="14" height="10" rx="2" />
            <Rect x="130" y="175" width="14" height="10" rx="2" />
          </G>

          {/* Money note flying */}
          <Path d="M 40 30 L 115 5 L 145 90 L 68 115 Z" fill="#008BB4" />
          <Path d="M 48 35 L 110 14 L 138 84 L 72 105 Z" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <SvgText x="92" y="65" fontWeight="bold" fontSize="24" fill="#FFFFFF" textAnchor="middle">
            GH₵
          </SvgText>
          <Path d="M 115 5 L 145 90 L 120 70 Z" fill="#E2001A" />
        </G>

        {/* Wordmark */}
        <SvgText x="250" y="310" fontWeight="bold" fontSize="46" fill="#004F71" textAnchor="middle">
          MTN MoMo
        </SvgText>
      </Svg>
    </View>
  );
};

/**
 * Authentic Telecel Ghana Native Vector Logo
 */
export const TelecelLogoNative: React.FC<LogoProps> = ({ size = 'md', style }) => {
  const dims = {
    icon: { w: 34, h: 34 },
    sm: { w: 46, h: 30 },
    md: { w: 68, h: 44 },
    lg: { w: 94, h: 60 },
  }[size];

  return (
    <View style={[styles.telecelCard, { width: dims.w, height: dims.h }, style]}>
      <Svg viewBox="0 0 400 400" width="100%" height="100%">
        <Rect width="400" height="400" rx="40" fill="#E2001A" />
        {/* Center white circle */}
        <Circle cx="200" cy="165" r="72" fill="#FFFFFF" />
        {/* Red lowercase 't' inside */}
        <Path
          d="M 186 122 C 186 116 190 112 196 112 L 202 112 C 208 112 212 116 212 122 L 212 135 L 226 135 C 230 135 233 138 233 142 L 233 150 C 233 154 230 157 226 157 L 212 157 L 212 182 C 212 190 216 194 223 194 C 227 194 230 193 233 191 C 236 189 240 191 240 195 L 240 205 C 240 208 238 211 234 213 C 228 216 220 217 212 217 C 195 217 186 206 186 189 L 186 157 L 174 157 C 170 157 167 154 167 150 L 167 142 C 167 138 170 135 174 135 L 186 135 Z"
          fill="#E2001A"
        />
        {/* telecel wordmark */}
        <SvgText
          x="200"
          y="300"
          fontWeight="bold"
          fontSize="64"
          fill="#FFFFFF"
          textAnchor="middle"
        >
          telecel
        </SvgText>
      </Svg>
    </View>
  );
};

/**
 * Authentic Mastercard Native Vector Logo
 */
export const MastercardLogoNative: React.FC<LogoProps> = ({ size = 'md', style }) => {
  const dims = {
    icon: { w: 34, h: 34 },
    sm: { w: 46, h: 30 },
    md: { w: 68, h: 44 },
    lg: { w: 94, h: 60 },
  }[size];

  return (
    <View style={[styles.mastercardCard, { width: dims.w, height: dims.h }, style]}>
      <Svg viewBox="0 0 500 320" width="100%" height="100%">
        <Defs>
          <ClipPath id="mc-clip-left">
            <Circle cx="190" cy="130" r="95" />
          </ClipPath>
        </Defs>
        {/* Left Circle Red */}
        <Circle cx="190" cy="130" r="95" fill="#EB001B" />
        {/* Right Circle Yellow */}
        <Circle cx="310" cy="130" r="95" fill="#F79E1B" />
        {/* Intersection Orange */}
        <Circle cx="310" cy="130" r="95" clipPath="url(#mc-clip-left)" fill="#FF5F00" />
        {/* mastercard text */}
        <SvgText
          x="250"
          y="278"
          fontWeight="600"
          fontSize="46"
          fill="#FFFFFF"
          textAnchor="middle"
        >
          mastercard
        </SvgText>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  momoCard: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFC400',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  telecelCard: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E2001A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  mastercardCard: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#0b1324',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
});
