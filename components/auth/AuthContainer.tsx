import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
  Image,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthBackground from './AuthBackground';

interface AuthFooterProps {
  text?: string;
  linkText: string;
  onLinkPress: () => void;
}

export function AuthFooter({ text, linkText, onLinkPress }: AuthFooterProps) {
  return (
    <View style={styles.footer}>
      {text && <Text style={styles.footerText}>{text}</Text>}
      <TouchableOpacity onPress={onLinkPress} accessibilityRole="button">
        <Text style={styles.footerLink}>{linkText}</Text>
      </TouchableOpacity>
    </View>
  );
}

interface AuthHeaderProps {
  firstWord: string;
  secondWord: string;
  subtitle: string;
}

export function AuthHeader({
  firstWord,
  secondWord,
  subtitle,
}: AuthHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/adaptive-icon.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title} accessibilityRole="header">
        <Text style={styles.titleGreen}>{firstWord}</Text>{' '}
        <Text style={styles.titleOrange}>{secondWord}</Text>
      </Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

interface AuthContainerProps {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export default function AuthContainer({
  children,
  contentContainerStyle,
}: AuthContainerProps) {
  return (
    <View style={styles.container}>
      <AuthBackground style={styles.svgBackground} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              contentContainerStyle,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
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
  logoImage: {
    width: 60,
    height: 60,
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
    paddingHorizontal: 20,
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
  footerLink: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#4CAF50',
  },
});
