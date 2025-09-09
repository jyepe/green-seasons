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

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const buttonScale = useSharedValue(1);
  const inputFocus = useSharedValue(0);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    buttonScale.value = withSpring(0.95, {}, () => {
      buttonScale.value = withSpring(1);
    });

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // For now, just navigate to main app
      router.replace('/(tabs)');
    }, 1500);
  };

  const handleSignupPress = () => {
    router.push('/auth/signup');
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(inputFocus.value, [0, 1], [1, 1.02]),
      },
    ],
  }));

  return (
    <View style={styles.container}>
      {/* Background with radial gradients */}
      <Svg
        width={width}
        height={height}
        style={styles.svgBackground}
        pointerEvents="none"
      >
        <Defs>
          {/* Top-left gradient */}
          <RadialGradient
            id="gradient1"
            cx="0"
            cy="0"
            r={Math.max(width, height) * 0.75}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#7FD8B5" stopOpacity="0.7" />
            <Stop offset="25%" stopColor="#7FD8B5" stopOpacity="0.45" />
            <Stop offset="45%" stopColor="#7FD8B5" stopOpacity="0.25" />
            <Stop offset="60%" stopColor="#7FD8B5" stopOpacity="0.1" />
            <Stop offset="75%" stopColor="#7FD8B5" stopOpacity="0" />
          </RadialGradient>
          {/* Bottom-right gradient */}
          <RadialGradient
            id="gradient2"
            cx={width}
            cy={height}
            r={Math.max(width, height) * 0.75}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#FFBE88" stopOpacity="0.7" />
            <Stop offset="25%" stopColor="#FFBE88" stopOpacity="0.45" />
            <Stop offset="45%" stopColor="#FFBE88" stopOpacity="0.25" />
            <Stop offset="60%" stopColor="#FFBE88" stopOpacity="0.1" />
            <Stop offset="75%" stopColor="#FFBE88" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="#F9F9F9" />
        <Rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="url(#gradient1)"
        />
        <Rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="url(#gradient2)"
        />
      </Svg>

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Ionicons name="leaf" size={36} color="#4CAF50" />
              </View>
              <Text style={styles.title}>
                <Text style={styles.titleGreen}>Green</Text>{' '}
                <Text style={styles.titleOrange}>Seasons</Text>
              </Text>
              <Text style={styles.subtitle}>
                Fresh produce for your restaurant
              </Text>
            </View>

            {/* Form */}
            <View style={styles.formCard}>
              <View style={styles.form}>
                <Animated.View style={inputAnimatedStyle}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputRow}>
                    <Ionicons
                      name="mail"
                      size={18}
                      color="#9E9E9E"
                      style={styles.leftIcon}
                    />
                    <TextInput
                      style={styles.inputField}
                      placeholder="Enter your email"
                      placeholderTextColor="#9E9E9E"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => {
                        inputFocus.value = withTiming(1, { duration: 200 });
                      }}
                      onBlur={() => {
                        inputFocus.value = withTiming(0, { duration: 200 });
                      }}
                    />
                  </View>
                </Animated.View>

                <Animated.View style={inputAnimatedStyle}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputRow}>
                    <Ionicons
                      name="lock-closed"
                      size={18}
                      color="#9E9E9E"
                      style={styles.leftIcon}
                    />
                    <TextInput
                      style={styles.inputField}
                      placeholder="Enter your password"
                      placeholderTextColor="#9E9E9E"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => {
                        inputFocus.value = withTiming(1, { duration: 200 });
                      }}
                      onBlur={() => {
                        inputFocus.value = withTiming(0, { duration: 200 });
                      }}
                    />
                    <TouchableOpacity
                      style={styles.eyeButtonInline}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="#9E9E9E"
                      />
                    </TouchableOpacity>
                  </View>
                </Animated.View>

                <View style={styles.forgotPasswordContainer}>
                  <TouchableOpacity style={styles.forgotPassword}>
                    <Text style={styles.forgotPasswordText}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </View>

                <Animated.View style={buttonAnimatedStyle}>
                  <TouchableOpacity
                    style={[
                      styles.loginButton,
                      {
                        opacity: isLoading ? 0.7 : 1,
                      },
                    ]}
                    onPress={handleLogin}
                    disabled={isLoading}
                  >
                    <Text style={styles.loginButtonText}>
                      {isLoading ? 'Signing In...' : 'Sign In'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                <View style={styles.dividerRow}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.divider} />
                </View>

                <View style={styles.socialRow}>
                  <TouchableOpacity
                    style={styles.socialButton}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="logo-google" size={18} color="#333" />
                    <Text style={styles.socialText}>Google</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.socialButton}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="logo-apple" size={18} color="#333" />
                    <Text style={styles.socialText}>Apple</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Don&apos;t have an account?{' '}
              </Text>
              <TouchableOpacity onPress={handleSignupPress}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9', // Light background matching SVG
  },
  svgBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
  },
  safeArea: {
    flex: 1,
    zIndex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: 'Inter_700Bold',
  },
  titleGreen: {
    color: '#4CAF50',
  },
  titleOrange: {
    color: '#FF9800',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    color: '#666',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  form: {
    marginBottom: 0,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter_600SemiBold',
    color: '#333',
  },
  inputRow: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    fontFamily: 'Inter_400Regular',
    color: '#333',
  },
  leftIcon: {
    marginRight: 10,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  passwordInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 50,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 14,
    padding: 4,
  },
  eyeButtonInline: {
    padding: 6,
    marginLeft: 6,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPassword: {
    padding: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#4CAF50',
  },
  loginButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    marginBottom: 20,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#666',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  socialText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#666',
  },
  signupLink: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#4CAF50',
  },
});
