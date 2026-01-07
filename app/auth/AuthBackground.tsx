import React from 'react';
import { Dimensions, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

type AuthBackgroundProps = {
  style?: StyleProp<ViewStyle>;
};

export default function AuthBackground({ style }: AuthBackgroundProps) {
  return (
    <Svg
      width={width}
      height={height}
      style={[styles.svgBackground, style]}
      pointerEvents="none"
    >
      <Defs>
        {/* Top-left gradient */}
        <RadialGradient
          id="gradient1"
          cx="0"
          cy="0"
          r={Math.max(width, height) * 0.55}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor="#7FD8B5" stopOpacity="0.7" />
          <Stop offset="25%" stopColor="#7FD8B5" stopOpacity="0.45" />
          <Stop offset="45%" stopColor="#7FD8B5" stopOpacity="0.25" />
          <Stop offset="60%" stopColor="#7FD8B5" stopOpacity="0.1" />
          <Stop offset="75%" stopColor="#7FD8B5" stopOpacity="0" />
        </RadialGradient>
        {/* Bottom-right gradient */}
        <RadialGradient
          id="gradient2"
          cx={width}
          cy={height}
          r={Math.max(width, height) * 0.55}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor="#FFBE88" stopOpacity="0.7" />
          <Stop offset="25%" stopColor="#FFBE88" stopOpacity="0.45" />
          <Stop offset="45%" stopColor="#FFBE88" stopOpacity="0.25" />
          <Stop offset="60%" stopColor="#FFBE88" stopOpacity="0.1" />
          <Stop offset="75%" stopColor="#FFBE88" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width={width} height={height} fill="#F9F9F9" />
      <Rect x="0" y="0" width={width} height={height} fill="url(#gradient1)" />
      <Rect x="0" y="0" width={width} height={height} fill="url(#gradient2)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  svgBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
  },
});

