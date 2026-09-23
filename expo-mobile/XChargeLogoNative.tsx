import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

const officialLogo = require('./assets/chargelink-logo.jpeg');

interface XChargeMarkProps {
  size?: number;
  style?: any;
}

/**
 * ChargeLink GH official mark
 * Uses the official client logo (chargelink-logo.jpeg)
 */
export const XChargeMarkNative: React.FC<XChargeMarkProps> = ({ size = 48, style }) => {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.22),
          overflow: 'hidden',
          backgroundColor: '#000000',
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}
    >
      <Image
        source={officialLogo}
        style={{
          width: size * 1.8,
          height: size * 1.8,
          transform: [{ translateY: -size * 0.05 }],
        }}
        resizeMode="contain"
      />
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
 * Full ChargeLink GH brand logo
 * Uses the official client logo asset (chargelink-logo.jpeg)
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
    <View
      style={[
        {
          width: w,
          height: h,
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}
    >
      <Image
        source={officialLogo}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
    </View>
  );
};
