import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSignOut, useUserInfo } from '@/hooks/useUserInfo';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const signOut = useSignOut();
  const { data: userInfo } = useUserInfo();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth/login');
    } catch {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
      </View>

      <View style={styles.content}>
        {userInfo && (
          <View style={[styles.userInfoContainer, { backgroundColor: colors.surface }]}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {userInfo.first_name?.[0] || userInfo.email?.[0] || '?'}
              </Text>
            </View>
            <Text style={[styles.userName, { color: colors.text }]}>
              {userInfo.first_name} {userInfo.last_name}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {userInfo.email}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.error }]}
          onPress={handleSignOut}
        >
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // We might want to use colors.border but we are outside component for now, or just inline. 
    // Actually, accessing colors inside component is better. But keeping simple for style sheet.
    // Let's use View style override for border color in component if strictly needed.
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  userInfoContainer: {
    width: '100%',
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Inter_700Bold',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter_600SemiBold',
  },
  userEmail: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  logoutButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
