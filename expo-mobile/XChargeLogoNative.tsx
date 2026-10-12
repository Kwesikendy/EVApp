import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

const officialMark = require('./assets/WillPower_App_Icon_V3.png');
const officialLogo = require('./assets/WillPower_Logo_Reverse_V3.png');

interface XChargeMarkProps {
  size?: number;
  style?: any;
}

export const XChargeMarkNative: React.FC<XChargeMarkProps> = ({ size = 48, style }) => (
  <View style={[styles.mark, { width: size, height: size, borderRadius: Math.round(size * 0.22) }, style]}>
    <Image source={officialMark} style={{ width: size, height: size }} resizeMode="contain" />
  </View>
);

interface XChargeLogoProps {
  width?: number;
  height?: number;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showSubtitle?: boolean;
  style?: any;
}

export const XChargeLogoNative: React.FC<XChargeLogoProps> = ({ width, height, size = 'md', style }) => {
  const dims = {
    sm: { w: 140, h: 42 },
    md: { w: 200, h: 60 },
    lg: { w: 260, h: 78 },
    hero: { w: 320, h: 96 },
  }[size];
  return (
    <View style={[{ width: width ?? dims.w, height: height ?? dims.h, justifyContent: 'center' }, style]}>
      <Image source={officialLogo} style={styles.logoImage} resizeMode="contain" />
    </View>
  );
};

const styles = StyleSheet.create({
  mark: {
    overflow: 'hidden',
    backgroundColor: '#0D1710',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});
