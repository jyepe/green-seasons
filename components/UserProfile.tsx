// components/UserProfile.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import {
  ProfileHeader,
  ProfileRow,
  ProfileSection,
  ProfileToggleRow,
} from '@/components/profile';
import { Toast } from '@/components/ui/Toast';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme, useTheme } from '@/hooks/useTheme';
import { useFavoriteItems } from '@/hooks/useFavorite';
import { useOrders } from '@/hooks/useOrders';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useDeleteAccount, useSignOut, useUserInfo } from '@/hooks/useUserInfo';

const FAVORITES_PREVIEW_LIMIT = 2;

function computeInitials(
  firstName?: string,
  lastName?: string,
  email?: string
): string {
  const parts = [firstName, lastName].filter(Boolean) as string[];
  if (parts.length > 0) {
    return parts
      .map(p => p[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2);
  }
  return (email?.[0] ?? '?').toUpperCase();
}

function titleCaseRole(role?: string): string | undefined {
  if (!role) return undefined;
  return role
    .split('_')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(' ');
}

function buildFavoritesSublabel(
  items: { name?: string }[] | undefined
): string | undefined {
  if (!items || items.length === 0) return 'Tap to start saving items';
  const named = items.filter(i => !!i.name) as { name: string }[];
  if (named.length === 0) return undefined;
  const head = named.slice(0, FAVORITES_PREVIEW_LIMIT).map(i => i.name);
  const remainder = items.length - head.length;
  return remainder > 0 ? `${head.join(', ')} +${remainder}` : head.join(', ');
}

export default function UserProfile() {
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { isDark, setThemeMode } = useTheme();

  const signOut = useSignOut();
  const deleteAccount = useDeleteAccount();
  const { data: userInfo, refetch: refetchUserInfo } = useUserInfo();
  const { data: restaurant, refetch: refetchRestaurant } = useRestaurant(
    userInfo?.owned_restaurant_id
  );
  const { data: orders, refetch: refetchOrders } = useOrders(userInfo?.id);
  const { data: favoriteItems, refetch: refetchFavorites } = useFavoriteItems();

  const [notifDelivery, setNotifDelivery] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });

  const showComingSoon = useCallback(() => {
    setToast({ visible: true, message: 'Coming soon' });
  }, []);
  const hideToast = useCallback(() => {
    setToast(t => ({ ...t, visible: false }));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchUserInfo(),
        refetchRestaurant(),
        refetchOrders(),
        refetchFavorites(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchUserInfo, refetchRestaurant, refetchOrders, refetchFavorites]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      router.replace('/auth/login');
    } catch {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  }, [signOut, router]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              router.replace('/auth/login');
            } catch (error) {
              if (__DEV__) {
                // eslint-disable-next-line no-console
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
  }, [deleteAccount, router]);

  const fullName = useMemo(() => {
    if (!userInfo) return '';
    const parts = [userInfo.first_name, userInfo.last_name].filter(
      Boolean
    ) as string[];
    return parts.length > 0 ? parts.join(' ') : (userInfo.email ?? 'User');
  }, [userInfo]);

  const initials = useMemo(
    () =>
      computeInitials(
        userInfo?.first_name,
        userInfo?.last_name,
        userInfo?.email
      ),
    [userInfo?.first_name, userInfo?.last_name, userInfo?.email]
  );

  const favoritesSublabel = buildFavoritesSublabel(favoriteItems);
  const favoritesValue =
    favoriteItems !== undefined ? `${favoriteItems.length} items` : '—';
  const ordersValue = orders !== undefined ? `${orders.length} total` : '—';
  const appVersion = Constants.expoConfig?.version ?? '?';

  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={[styles.container, { backgroundColor: colors.background }]}
      accessibilityLabel="User Profile Screen"
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <ProfileHeader
          name={fullName}
          role={titleCaseRole(userInfo?.role)}
          restaurantName={restaurant?.name}
          initials={initials}
          onSettingsPress={() => router.push('/profile/edit')}
          isLoading={!userInfo}
        />

        {/* Account */}
        <ProfileSection title="Account">
          <ProfileRow
            icon="person-outline"
            label="Personal info"
            sublabel={userInfo?.email}
            onPress={() => router.push('/profile/edit')}
          />
          <ProfileRow
            icon="business-outline"
            iconColor={colors.accentWarm}
            label="Business details"
            sublabel="EIN, license, tax exempt"
            onPress={showComingSoon}
          />
        </ProfileSection>

        {/* Orders & Lists */}
        <ProfileSection title="Orders & Lists">
          <ProfileRow
            icon="receipt-outline"
            label="Order history"
            value={ordersValue}
            onPress={() => router.push('/orders')}
          />
          <ProfileRow
            icon="heart-outline"
            iconColor="#DC2626"
            label="My favorites"
            sublabel={favoritesSublabel}
            value={favoritesValue}
            onPress={() => router.push('/favorites')}
          />
        </ProfileSection>

        {/* Preferences */}
        <ProfileSection title="Preferences">
          <ProfileToggleRow
            icon="notifications-outline"
            label="Delivery updates"
            sublabel="Push when order status changes"
            value={notifDelivery}
            onValueChange={setNotifDelivery}
          />
          <ProfileToggleRow
            icon="moon-outline"
            iconColor={colors.info}
            label="Dark mode"
            value={isDark}
            onValueChange={next => {
              void setThemeMode(next ? 'dark' : 'light');
            }}
          />
        </ProfileSection>

        {/* Support */}
        <ProfileSection title="Support">
          <ProfileRow
            icon="help-circle-outline"
            label="Help center"
            onPress={showComingSoon}
          />
          <ProfileRow
            icon="shield-checkmark-outline"
            iconColor={colors.textSecondary}
            label="Terms & privacy"
            onPress={showComingSoon}
          />
        </ProfileSection>

        {/* Sign out */}
        <ProfileSection>
          <ProfileRow
            icon="log-out-outline"
            iconColor={colors.error}
            label="Sign out"
            danger
            trailing="none"
            onPress={handleSignOut}
          />
        </ProfileSection>

        {/* Delete account */}
        <ProfileSection>
          <ProfileRow
            icon="trash-outline"
            iconColor={colors.error}
            label="Delete account"
            danger
            trailing="none"
            onPress={handleDeleteAccount}
          />
        </ProfileSection>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerBrand, { color: colors.textSecondary }]}>
            Green Seasons
          </Text>
          <Text style={[styles.footerVersion, { color: colors.textTertiary }]}>
            v {appVersion} · Hialeah, FL
          </Text>
        </View>
      </ScrollView>

      <Toast
        message={toast.message}
        visible={toast.visible}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 110,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  footerBrand: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  footerVersion: {
    fontSize: 11,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
});
