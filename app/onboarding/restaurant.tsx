import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createRestaurant, type CreateRestaurantParams } from '@/lib/supabase';
import { useInvalidateUserInfo } from '@/hooks/useUserInfo';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width, height } = Dimensions.get('window');

export default function RestaurantOnboardingScreen() {
  const [formData, setFormData] = useState<CreateRestaurantParams>({
    name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postal_code: '',
    country: 'US',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const invalidateUserInfo = useInvalidateUserInfo();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const buttonScale = useSharedValue(1);
  const inputFocus = useSharedValue(0);

  const validateField = (field: string, value: string): string => {
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

    Object.keys(formData).forEach(field => {
      if (field === 'address_line2' || field === 'country') return; // Optional fields

      const error = validateField(
        field,
        formData[field as keyof CreateRestaurantParams] || ''
      );
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCreateRestaurant = async () => {
    if (!validateForm()) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    buttonScale.value = withSpring(0.95, {}, () => {
      buttonScale.value = withSpring(1);
    });

    try {
      await createRestaurant(formData);

      // Invalidate user info cache to trigger refetch
      invalidateUserInfo();

      Alert.alert(
        'Success!',
        'Your restaurant has been created successfully.',
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to create restaurant. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const animatedInputStyle = useAnimatedStyle(() => {
    const opacity = interpolate(inputFocus.value, [0, 1], [0.7, 1]);
    return {
      opacity,
    };
  });

  const isFormValid = (): boolean => {
    return (
      formData.name.trim().length >= 2 &&
      formData.address_line1.trim().length >= 5 &&
      formData.city.trim().length >= 2 &&
      formData.postal_code.trim().length >= 5
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Svg
        style={StyleSheet.absoluteFillObject}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        <Defs>
          <RadialGradient
            id="backgroundGradient"
            cx="50%"
            cy="0%"
            r="100%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.1} />
            <Stop offset="100%" stopColor={colors.background} stopOpacity={1} />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#backgroundGradient)" />
      </Svg>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons name="restaurant" size={32} color="white" />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              Create Your Restaurant
            </Text>
            <Text style={[styles.subtitle, { color: colors.text }]}>
              Set up your restaurant profile to start ordering fresh produce
            </Text>
          </View>

          <Animated.View style={[styles.formContainer, animatedInputStyle]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Restaurant Name *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: errors.name ? colors.error : colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Enter your restaurant name"
                placeholderTextColor={colors.text + '80'}
                value={formData.name}
                onChangeText={value => handleInputChange('name', value)}
                onFocus={() => {
                  inputFocus.value = withTiming(1, { duration: 200 });
                }}
                onBlur={() => {
                  inputFocus.value = withTiming(0, { duration: 200 });
                }}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {errors.name && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.name}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Address Line 1 *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: errors.address_line1
                      ? colors.error
                      : colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Street address"
                placeholderTextColor={colors.text + '80'}
                value={formData.address_line1}
                onChangeText={value =>
                  handleInputChange('address_line1', value)
                }
                onFocus={() => {
                  inputFocus.value = withTiming(1, { duration: 200 });
                }}
                onBlur={() => {
                  inputFocus.value = withTiming(0, { duration: 200 });
                }}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {errors.address_line1 && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.address_line1}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Address Line 2
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Apartment, suite, unit, etc. (optional)"
                placeholderTextColor={colors.text + '80'}
                value={formData.address_line2}
                onChangeText={value =>
                  handleInputChange('address_line2', value)
                }
                onFocus={() => {
                  inputFocus.value = withTiming(1, { duration: 200 });
                }}
                onBlur={() => {
                  inputFocus.value = withTiming(0, { duration: 200 });
                }}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: colors.text }]}>
                  City *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      borderColor: errors.city ? colors.error : colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="City"
                  placeholderTextColor={colors.text + '80'}
                  value={formData.city}
                  onChangeText={value => handleInputChange('city', value)}
                  onFocus={() => {
                    inputFocus.value = withTiming(1, { duration: 200 });
                  }}
                  onBlur={() => {
                    inputFocus.value = withTiming(0, { duration: 200 });
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                {errors.city && (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {errors.city}
                  </Text>
                )}
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Postal Code *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      borderColor: errors.postal_code
                        ? colors.error
                        : colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="12345"
                  placeholderTextColor={colors.text + '80'}
                  value={formData.postal_code}
                  onChangeText={value =>
                    handleInputChange('postal_code', value)
                  }
                  onFocus={() => {
                    inputFocus.value = withTiming(1, { duration: 200 });
                  }}
                  onBlur={() => {
                    inputFocus.value = withTiming(0, { duration: 200 });
                  }}
                  keyboardType="numeric"
                  maxLength={10}
                />
                {errors.postal_code && (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {errors.postal_code}
                  </Text>
                )}
              </View>
            </View>

            <Animated.View style={animatedButtonStyle}>
              <TouchableOpacity
                style={[
                  styles.createButton,
                  {
                    backgroundColor: isFormValid()
                      ? colors.primary
                      : colors.border,
                  },
                ]}
                onPress={handleCreateRestaurant}
                disabled={!isFormValid() || isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <Text style={styles.buttonText}>Creating Restaurant...</Text>
                ) : (
                  <Text style={styles.buttonText}>Create Restaurant</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
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
    opacity: 0.8,
    paddingHorizontal: 20,
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  createButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
});
