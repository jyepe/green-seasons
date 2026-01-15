import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useReducer, useRef } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { createRestaurant, type CreateRestaurantParams } from '@/lib/supabase';
import { useInvalidateUserInfo } from '@/hooks/useUserInfo';
import { useAdmin } from '@/hooks/useAdmin';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';
import AuthContainer from '@/components/auth/AuthContainer';
import AuthCard from '@/components/auth/AuthCard';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import GradientText from '@/components/ui/GradientText';
import { validateMiamiDadeAddress } from '@/lib/utils/validateMiamiDadeAddress';
import {
  initialState,
  restaurantOnboardingReducer,
} from '@/reducers/restaurantOnboardingReducer';

export default function RestaurantOnboardingScreen() {
  const [state, dispatch] = useReducer(
    restaurantOnboardingReducer,
    initialState
  );
  const { formData, errors, isLoading, addressValidationError } = state;

  const router = useRouter();
  const invalidateUserInfo = useInvalidateUserInfo();
  const { data: isUserAdmin } = useAdmin();
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];

  // Refs for keyboard navigation
  const nameRef = useRef<TextInput>(null);
  const addressLine1Ref = useRef<TextInput>(null);
  const addressLine2Ref = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);
  const postalCodeRef = useRef<TextInput>(null);

  const validateField = (field: keyof CreateRestaurantParams, value: string): string => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Restaurant name is required';
        if (value.trim().length < 2)
          return 'Restaurant name must be at least 2 characters';
        return '';

      case 'address_line1':
        if (!value.trim()) return 'Address is required';
        if (value.trim().length < 5) return 'Please enter a complete address';
        return '';

      case 'city':
        if (!value.trim()) return 'City is required';
        if (value.trim().length < 2)
          return 'City must be at least 2 characters';
        return '';

      case 'postal_code':
        if (!value.trim()) return 'Postal code is required';
        const cleanPostal = value.replace(/\D/g, '');
        if (cleanPostal.length < 5) {
          return 'Postal code must be at least 5 digits';
        }
        return '';

      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(formData).forEach(key => {
      const field = key as keyof CreateRestaurantParams;
      if (field === 'address_line2' || field === 'country') return; // Optional fields

      const error = validateField(field, formData[field] || '');
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    dispatch({ type: 'SET_ERRORS', errors: newErrors });
    return isValid;
  };

  const handleInputChange = (field: keyof CreateRestaurantParams, value: string) => {
    dispatch({
      type: 'SET_FIELD',
      field: field,
      value,
    });

    // Clear error when user starts typing
    if (errors[field]) {
      dispatch({ type: 'CLEAR_ERROR', field });
    }
  };

  const handleFieldBlur = (field: keyof CreateRestaurantParams) => {
    const value = formData[field] || '';
    const error = validateField(field, value);
    if (error) {
      dispatch({ type: 'SET_ERROR', field, error });
    }
  };

  const handleNextField = (currentField: string) => {
    switch (currentField) {
      case 'name':
        addressLine1Ref.current?.focus();
        break;
      case 'address_line1':
        addressLine2Ref.current?.focus();
        break;
      case 'address_line2':
        cityRef.current?.focus();
        break;
      case 'city':
        postalCodeRef.current?.focus();
        break;
      case 'postal_code':
        // Last field - submit the form
        handleCreateRestaurant();
        break;
    }
  };

  const handleCreateRestaurant = async () => {
    if (!validateForm()) {
      return;
    }

    dispatch({ type: 'START_SUBMISSION' });

    try {
      // Validate address is within Miami-Dade County
      const validationResult = await validateMiamiDadeAddress(
        formData.address_line1,
        formData.city,
        formData.postal_code
      );

      if (!validationResult.isValid || !validationResult.isMiamiDade) {
        dispatch({
          type: 'SET_SUBMISSION_ERROR',
          error:
            validationResult.errorMessage ||
            'Address validation failed. Please try again.',
        });
        return;
      }

      await createRestaurant(formData);

      // Invalidate user info cache to trigger refetch
      invalidateUserInfo();

      dispatch({ type: 'RESET_SUBMISSION' }); // Reset loading state after success

      Alert.alert(
        'Success!',
        'Your restaurant has been created successfully.',
        [
          {
            text: 'Continue',
            onPress: () => {
              if (isUserAdmin) {
                router.replace('/admin/(tabs)');
              } else {
                router.replace('/(tabs)');
              }
            },
          },
        ]
      );
    } catch (error: unknown) {
      let errorMessage = 'Failed to create restaurant. Please try again.';

      // Check if error has a message property (Supabase error format)
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      dispatch({ type: 'RESET_SUBMISSION' }); // Stop loading
      Alert.alert('Error', errorMessage);
    }
  };

  const isFormValid = (): boolean => {
    return (
      formData.name.trim().length >= 2 &&
      formData.address_line1.trim().length >= 5 &&
      formData.city.trim().length >= 2 &&
      formData.postal_code.trim().length >= 5
    );
  };

  return (
    <AuthContainer contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View
          style={[styles.iconContainer, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="restaurant" size={32} color={colors.surface} />
        </View>
        <GradientText
          colors={['#7FD8B5', '#FFBE88']}
          style={[styles.title, { color: colors.text }]}
        >
          Create Your Restaurant
        </GradientText>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Set up your restaurant profile to start ordering fresh produce
        </Text>
      </View>

      <AuthCard>
        <View style={styles.form}>
          <AuthInput
            ref={nameRef}
            label="Restaurant Name *"
            placeholder="Enter your restaurant name"
            value={formData.name}
            onChangeText={value => handleInputChange('name', value)}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => handleNextField('name')}
            onBlur={() => handleFieldBlur('name')}
            error={errors.name}
            containerStyle={styles.inputSpacing}
          />

          <AuthInput
            ref={addressLine1Ref}
            label="Address Line 1 *"
            placeholder="Street address"
            value={formData.address_line1}
            onChangeText={value => handleInputChange('address_line1', value)}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => handleNextField('address_line1')}
            onBlur={() => handleFieldBlur('address_line1')}
            error={errors.address_line1}
            containerStyle={styles.inputSpacing}
          />

          <AuthInput
            ref={addressLine2Ref}
            label="Address Line 2"
            placeholder="Apartment, suite, unit, etc. (optional)"
            value={formData.address_line2}
            onChangeText={value => handleInputChange('address_line2', value)}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => handleNextField('address_line2')}
            containerStyle={styles.inputSpacing}
          />

          <View style={styles.row}>
            <AuthInput
              ref={cityRef}
              label="City *"
              placeholder="City"
              value={formData.city}
              onChangeText={value => handleInputChange('city', value)}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => handleNextField('city')}
              onBlur={() => handleFieldBlur('city')}
              error={errors.city}
              containerStyle={styles.halfWidth}
            />

            <AuthInput
              ref={postalCodeRef}
              label="Postal Code *"
              placeholder="12345"
              value={formData.postal_code}
              onChangeText={value => handleInputChange('postal_code', value)}
              keyboardType="numeric"
              maxLength={10}
              returnKeyType="done"
              onSubmitEditing={() => handleNextField('postal_code')}
              onBlur={() => handleFieldBlur('postal_code')}
              error={errors.postal_code}
              containerStyle={styles.halfWidth}
            />
          </View>

          {addressValidationError && (
            <View
              style={[
                styles.disclaimerContainer,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.warning,
                },
              ]}
            >
              <Ionicons name="warning" size={20} color={colors.warning} />
              <Text style={[styles.disclaimerText, { color: colors.text }]}>
                {addressValidationError}
              </Text>
            </View>
          )}

          <AuthButton
            title="Create Restaurant"
            onPress={handleCreateRestaurant}
            isLoading={isLoading}
            disabled={!isFormValid()}
            style={styles.createButton}
          />

          {isUserAdmin && (
            <AuthButton
              title="Cancel"
              onPress={() => router.back()}
              variant="destructive"
              style={styles.cancelButton}
            />
          )}
        </View>
      </AuthCard>
    </AuthContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  form: {
    marginBottom: 0,
  },
  inputSpacing: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  halfWidth: {
    width: '48%',
    marginBottom: 0,
  },
  createButton: {
    marginTop: 12,
  },
  cancelButton: {
    marginTop: 16,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
