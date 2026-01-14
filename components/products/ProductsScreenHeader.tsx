import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

export default function ProductsScreenHeader() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View
      style={[styles.header, { backgroundColor: colors.surface }]}
      accessible={true}
      accessibilityRole="header"
      accessibilityLabel="Products Screen Header"
      accessibilityHint="This is the header for the products screen"
    >
      <Text style={[styles.title, { color: colors.text }]}>Fresh Produce</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Order the freshest ingredients for your restaurant
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
});
