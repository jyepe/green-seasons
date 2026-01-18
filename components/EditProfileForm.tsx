import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import { useUpdateUserInfo, useUserInfo } from '@/hooks/useUserInfo';
import type { UpdateUserInfoParams } from '@/lib/supabase';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useReducer } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { initialState, profileReducer } from '@/reducers/editProfileReducer';

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

  const handleSave = async () => {
    const trimmedEmail = email.trim();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedEmail || !trimmedFirstName || !trimmedLastName) {
      Alert.alert('Error', 'Email, first name, and last name are required.');
      return;
    }

    // Email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{ title: 'Edit Profile', headerBackTitle: 'Profile' }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={email}
              onChangeText={text =>
                dispatch({ type: 'SET_EMAIL', payload: text })
              }
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              First Name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={firstName}
              onChangeText={text =>
                dispatch({ type: 'SET_FIRST_NAME', payload: text })
              }
              placeholder="First Name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Last Name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={lastName}
              onChangeText={text =>
                dispatch({ type: 'SET_LAST_NAME', payload: text })
              }
              placeholder="Last Name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Phone Number
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={phone}
              onChangeText={text =>
                dispatch({ type: 'SET_PHONE', payload: text })
              }
              placeholder="Phone Number"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={updateUserInfoMutation.isPending}
            accessibilityLabel="Save Changes"
            accessibilityRole="button"
          >
            {updateUserInfoMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
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
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  saveButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
