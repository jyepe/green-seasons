import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSignOut, useUserInfo } from '@/hooks/useUserInfo';
import { useAdmin } from '@/hooks/useAdmin';
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
  const { data: isUserAdmin } = useAdmin();

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
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Profile
        </Text>
      </View>

      <View style={styles.content}>
        {userInfo ? (
          <View
            style={[
              styles.userInfoContainer,
              { backgroundColor: colors.surface },
            ]}
          >
            <View
              style={[
                styles.avatarPlaceholder,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={styles.avatarText}>
                {(
                  userInfo.first_name?.[0] ||
                  userInfo.email?.[0] ||
                  '?'
                ).toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.userName, { color: colors.text }]}>
              {(() => {
                const parts: string[] = [];
                if (userInfo.first_name) parts.push(userInfo.first_name);
                if (userInfo.last_name) parts.push(userInfo.last_name);
                if (parts.length > 0) {
                  return parts.join(' ');
                }
                return userInfo.email || 'User';
              })()}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {userInfo.email}
            </Text>
          </View>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading profile...
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.editProfileButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => router.push('/profile/edit')}
          accessibilityLabel="Edit Profile"
          accessibilityRole="button"
        >
          <Text style={[styles.editProfileButtonText, { color: colors.text }]}>
            Edit Profile
          </Text>
        </TouchableOpacity>

        {isUserAdmin && (
          <>
            <TouchableOpacity
              style={[
                styles.adminButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => router.push('/onboarding/restaurant')}
              accessibilityLabel="Create Restaurant"
              accessibilityRole="button"
            >
              <Text style={[styles.adminButtonText, { color: colors.text }]}>
                Create Restaurant
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.adminButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              disabled={true}
              accessibilityState={{ disabled: true }}
              accessibilityLabel="Create Employee (coming soon)"
              accessibilityRole="button"
            >
              <Text style={[styles.adminButtonText, { color: colors.text }]}>
                Create Employee (coming soon)
              </Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.error }]}
          onPress={handleSignOut}
          accessibilityLabel="Log Out"
          accessibilityRole="button"
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
  editProfileButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  editProfileButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  adminButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  adminButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
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
  loadingContainer: {
    width: '100%',
    alignItems: 'center',
    padding: 24,
    marginBottom: 32,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
});
