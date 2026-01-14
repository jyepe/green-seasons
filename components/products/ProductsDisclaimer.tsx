import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

export default function ProductsDisclaimer() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        styles.disclaimerContainer,
        { backgroundColor: colors.surface, borderColor: colors.textTertiary },
      ]}
    >
      <Ionicons
        name="information-circle-outline"
        size={16}
        color={colors.textSecondary}
      />
      <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
        Due to the prices of produce changing everyday, prices shown are the
        last finalized prices and are subject to change.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
