import React from 'react';
import { Text, TextProps, View, StyleSheet, ColorValue } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientTextProps extends TextProps {
  colors: readonly [ColorValue, ColorValue, ...ColorValue[]];
}

export default function GradientText({
  colors,
  style,
  ...props
}: GradientTextProps) {
  return (
    <View style={{ position: 'relative' }}>
      {/* Invisible text to define dimensions */}
      <Text style={[style, { opacity: 0 }]} {...props} />

      {/* Absolute MaskedView overlay */}
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={<Text style={style} {...props} />}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </MaskedView>
    </View>
  );
}
