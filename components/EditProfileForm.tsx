import { withAlpha } from '@/components/profile/utils';
import { Toast } from '@/components/ui/Toast';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useAppColorScheme } from '@/hooks/useTheme';
import { useUpdateUserInfo, useUserInfo } from '@/hooks/useUserInfo';
import type { UpdateUserInfoParams } from '@/lib/supabase';
import { resetPassword } from '@/lib/supabase';
import { initialState, profileReducer } from '@/reducers/editProfileReducer';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useReducer, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedInput } from '@/components/ThemedView';

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function EditProfileForm() {
  const router = useRouter();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { data: userInfo, isLoading: isUserLoading } = useUserInfo();
  const updateUserInfoMutation = useUpdateUserInfo();

  const [state, dispatch] = useReducer(profileReducer, initialState);
  const { email, firstName, lastName, phone, isInitialized } = state;
  const [errors, setErrors] = useState<{
    email?: string;
    firstName?: string;
    lastName?: string;
  }>({});

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [resetPending, setResetPending] = useState(false);

  useEffect(() => {
    if (userInfo && !isInitialized) {
      dispatch({
        type: 'INITIALIZE',
        payload: {
          email: userInfo.email || '',
          firstName: userInfo.first_name || '',
          lastName: userInfo.last_name || '',
          phone: userInfo.phone || '',
        },
      });
    }
  }, [userInfo, isInitialized]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleChangePassword = async () => {
    if (!userInfo?.email) return;
    setResetPending(true);
    try {
      await resetPassword({ email: userInfo.email });
      showToast('Reset link sent — check your inbox.', 'success');
    } catch {
      showToast("Couldn't send reset email. Try again.", 'error');
    } finally {
      setResetPending(false);
    }
  };

  const handleSave = async () => {
    const trimmedEmail = email.trim();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedPhone = phone.trim();

    // Reset errors
    const newErrors: typeof errors = {};
    if (!trimmedEmail) newErrors.email = 'Email is required';
    if (!trimmedFirstName) newErrors.firstName = 'First name is required';
    if (!trimmedLastName) newErrors.lastName = 'Last name is required';

    // Email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (trimmedEmail && !emailRegex.test(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // Only send fields that have actually changed
    const updatedFields: Partial<UpdateUserInfoParams> = {};
    const originalEmail = userInfo?.email || '';
    const originalFirstName = userInfo?.first_name || '';
    const originalLastName = userInfo?.last_name || '';
    const originalPhone = userInfo?.phone || '';

    if (trimmedEmail !== originalEmail) {
      updatedFields.email = trimmedEmail;
    }
    if (trimmedFirstName !== originalFirstName) {
      updatedFields.first_name = trimmedFirstName;
    }
    if (trimmedLastName !== originalLastName) {
      updatedFields.last_name = trimmedLastName;
    }
    // Phone can be empty string (converted to null on backend) or a value
    if (trimmedPhone !== originalPhone) {
      updatedFields.phone = trimmedPhone;
    }

    if (Object.keys(updatedFields).length === 0) {
      Alert.alert('No changes', 'There are no changes to save.');
      return;
    }

    try {
      await updateUserInfoMutation.mutateAsync(updatedFields);

      // Show different messages based on what was updated
      if (updatedFields.email) {
        Alert.alert(
          'Success',
          'Profile updated successfully. If you changed your email, please check your inbox to confirm the new address.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to update profile. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  if (isUserLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isDark = colorScheme === 'dark';
  const cardStyle = [
    styles.card,
    { backgroundColor: colors.surface },
    isDark
      ? { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }
      : styles.cardShadow,
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Edit Profile',
          headerBackTitle: 'Profile',
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSave}
              disabled={updateUserInfoMutation.isPending}
              accessibilityLabel="Save changes"
              accessibilityRole="button"
              accessibilityState={{
                disabled: updateUserInfoMutation.isPending,
                busy: updateUserInfoMutation.isPending,
              }}
              style={{ opacity: updateUserInfoMutation.isPending ? 0.5 : 1 }}
            >
              {updateUserInfoMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[styles.headerSave, { color: colors.primary }]}>
                  Save
                </Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />
      <Toast
        message={toastMessage}
        type={toastType}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* IDENTITY */}
          <View style={cardStyle}>
            <Text
              style={[styles.sectionLabel, { color: colors.textSecondary }]}
              accessibilityRole="header"
            >
              IDENTITY
            </Text>
            <Text
              style={[styles.sectionSubtitle, { color: colors.textTertiary }]}
            >
              What teammates and Green Seasons see.
            </Text>
            <ThemedInput
              label="First Name"
              value={firstName}
              onChangeText={text => {
                dispatch({ type: 'SET_FIRST_NAME', payload: text });
                if (errors.firstName)
                  setErrors({ ...errors, firstName: undefined });
              }}
              placeholder="First Name"
              accessibilityLabel="First Name"
              containerStyle={styles.inputTop}
              error={errors.firstName}
            />
            <ThemedInput
              label="Last Name"
              value={lastName}
              onChangeText={text => {
                dispatch({ type: 'SET_LAST_NAME', payload: text });
                if (errors.lastName)
                  setErrors({ ...errors, lastName: undefined });
              }}
              placeholder="Last Name"
              accessibilityLabel="Last Name"
              containerStyle={styles.inputBottom}
              error={errors.lastName}
            />
          </View>

          {/* CONTACT */}
          <View style={cardStyle}>
            <Text
              style={[styles.sectionLabel, { color: colors.textSecondary }]}
              accessibilityRole="header"
            >
              CONTACT
            </Text>
            <Text
              style={[styles.sectionSubtitle, { color: colors.textTertiary }]}
            >
              Used for order updates and receipts.
            </Text>
            <ThemedInput
              label="Email"
              value={email}
              onChangeText={text => {
                dispatch({ type: 'SET_EMAIL', payload: text });
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Email"
              containerStyle={styles.inputTop}
              error={errors.email}
            />
            <ThemedInput
              label="Phone Number"
              value={phone}
              onChangeText={text =>
                dispatch({ type: 'SET_PHONE', payload: text })
              }
              placeholder="Phone Number"
              keyboardType="phone-pad"
              accessibilityLabel="Phone Number"
              containerStyle={styles.inputBottom}
            />
          </View>

          {/* SECURITY */}
          <View style={cardStyle}>
            <Text
              style={[
                styles.sectionLabel,
                { color: colors.textSecondary },
                styles.sectionLabelNoSubtitle,
              ]}
              accessibilityRole="header"
            >
              SECURITY
            </Text>
            <Pressable
              onPress={handleChangePassword}
              disabled={resetPending || !userInfo?.email}
              style={({ pressed }) => [
                styles.passwordRow,
                {
                  borderTopColor: colors.border,
                  backgroundColor: pressed
                    ? withAlpha(colors.text, isDark ? 0.04 : 0.03)
                    : 'transparent',
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Change password, sends a reset link to your email"
            >
              <View
                style={[
                  styles.iconTile,
                  { backgroundColor: withAlpha(colors.primary, 0.12) },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>
              <View style={styles.rowBody}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>
                  Change password
                </Text>
                <Text
                  style={[styles.rowSublabel, { color: colors.textTertiary }]}
                >
                  Sends a reset link to your email
                </Text>
              </View>
              {resetPending ? (
                <ActivityIndicator size="small" color={colors.textTertiary} />
              ) : (
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textTertiary}
                />
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.s4,
    gap: Spacing.s4,
  },
  headerSave: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  card: {
    borderRadius: 14,
    padding: Spacing.s4,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginBottom: 14,
  },
  sectionLabelNoSubtitle: {
    marginBottom: 0,
  },
  inputTop: {
    marginBottom: Spacing.s3,
  },
  inputBottom: {
    marginBottom: 0,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s3,
    paddingTop: Spacing.s3,
    marginTop: Spacing.s3,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  rowSublabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
});
