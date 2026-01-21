import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { useSignOut, useDeleteAccount, useUserInfo } from '@/hooks/useUserInfo';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function UserProfile() {
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const signOut = useSignOut();
  const deleteAccount = useDeleteAccount();
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

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              router.replace('/auth/login');
            } catch (error) {
              if (__DEV__) {
                console.error('Failed to delete account:', error);
              }
              Alert.alert(
                'Error',
                'Failed to delete account. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      accessibilityLabel="User Profile Screen"
    >
      <ScrollView>
        <View
          style={[styles.header, { borderBottomColor: colors.border }]}
          accessibilityRole="header"
        >
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
              accessible={true}
              accessibilityLabel={`User info for ${userInfo.first_name || ''} ${userInfo.last_name || ''}`}
            >
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: colors.primary },
                ]}
                accessibilityRole="image"
                accessibilityLabel="User Avatar"
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
              <Text
                style={[styles.loadingText, { color: colors.textSecondary }]}
              >
                Loading profile...
              </Text>
            </View>
          )}

          <ThemeToggle colors={colors} />

          <TouchableOpacity
            style={[
              styles.editProfileButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => router.push('/profile/edit')}
            accessibilityLabel="Edit Profile"
            accessibilityRole="button"
          >
            <Text
              style={[styles.editProfileButtonText, { color: colors.text }]}
            >
              Edit Profile
            </Text>
          </TouchableOpacity>

          {isUserAdmin && (
            <>
              <TouchableOpacity
                style={[
                  styles.adminButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
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
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => router.push('/admin/employees')}
                accessibilityLabel="Employee Management"
                accessibilityRole="button"
              >
                <Text style={[styles.adminButtonText, { color: colors.text }]}>
                  Employee Management
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.adminButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => router.push('/admin/items')}
                accessibilityLabel="Item Management"
                accessibilityRole="button"
              >
                <Text style={[styles.adminButtonText, { color: colors.text }]}>
                  Item Management
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

          <TouchableOpacity
            style={[
              styles.deleteAccountButton,
              { borderColor: colors.error },
            ]}
            onPress={handleDeleteAccount}
            accessibilityLabel="Delete Account"
            accessibilityRole="button"
          >
            <Text style={[styles.deleteAccountButtonText, { color: colors.error }]}>
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    marginBottom: 16,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  deleteAccountButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  deleteAccountButtonText: {
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
