import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useCart } from '@/hooks/useCart';

export default function AdminLayout() {
  const colorScheme = useColorScheme();
  const { data: cartItems } = useCart();
  const hasItems = cartItems && cartItems.length > 0;
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        sceneStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
        },
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Products',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="leaf.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color }) => (
            <View>
              <IconSymbol size={28} name="cart.fill" color={color} />
              {hasItems && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: colors.error,
                      borderColor: colors.background,
                    },
                  ]}
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          href: null, // Hide from tab bar, accessible via navigation
        }}
      />
      <Tabs.Screen
        name="items"
        options={{
          href: null, // Hide from tab bar, accessible via navigation
        }}
      />
      <Tabs.Screen
        name="employees"
        options={{
          href: null, // Hide from tab bar, accessible via navigation
        }}
      />
      <Tabs.Screen
        name="restaurants"
        options={{
          href: null, // Hide from tab bar, accessible via navigation
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="revenue-by-day"
        options={{
          href: null, // Hide from tab bar, accessible via navigation
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
});
