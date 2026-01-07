import { Tabs, useSegments } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function EmployeeLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const segments = useSegments();

  // Hide tab bar when on the orders screen
  const isOrdersScreen = segments[segments.length - 1] === 'orders';
  const baseTabBarStyle = Platform.select({
    ios: {
      position: 'absolute' as const,
    },
    default: {},
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        sceneStyle: {
          backgroundColor: colors.background,
        },
        tabBarStyle: isOrdersScreen ? { display: 'none' } : baseTabBarStyle,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="truck-load"
        options={{
          title: 'Truck Load',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="truck.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="person.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          // Keep All Orders as a navigable screen, but not a tab in the bar
          href: null,
        }}
      />
    </Tabs>
  );
}
