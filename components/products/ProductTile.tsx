import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

type ProductTileProps = {
  imageUrl: string | null;
  fallbackSeed: string;
  height?: number;
};

const HUE_BANDS: [number, number][] = [
  [80, 70],
  [20, 30],
  [350, 25],
  [270, 40],
];

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seedToHue(seed: string): number {
  const h = hashSeed(seed || 'item');
  const [start, width] = HUE_BANDS[h % HUE_BANDS.length];
  return (start + (h % width)) % 360;
}

export default function ProductTile({
  imageUrl,
  fallbackSeed,
  height = 132,
}: ProductTileProps) {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  const gradient = useMemo(() => {
    const hue = seedToHue(fallbackSeed);
    const isDark = colorScheme === 'dark';
    const lightTop = isDark ? 38 : 78;
    const lightBottom = isDark ? 26 : 62;
    return [
      `hsl(${hue}, 60%, ${lightTop}%)`,
      `hsl(${hue}, 60%, ${lightBottom}%)`,
    ] as const;
  }, [fallbackSeed, colorScheme]);

  if (imageUrl) {
    return (
      <View style={[styles.tile, { height }]}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
          accessible
          accessibilityRole="image"
        />
      </View>
    );
  }

  return (
    <View style={[styles.tile, { height }]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fill}
      >
        <Ionicons
          name="nutrition-outline"
          size={48}
          color={colors.surface}
          style={styles.glyph}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    opacity: 0.4,
  },
});
