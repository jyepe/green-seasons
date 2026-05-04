// components/checkout/CheckoutFooter.tsx
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useTheme';

type Props = {
  colors: (typeof Colors)['light'];
  step: 0 | 1 | 2;
  total: number;
  ctaLabel: string;
  ctaDisabled: boolean;
  placing: boolean;
  onPress: () => void;
};

export function CheckoutFooter({
  colors,
  step,
  total,
  ctaLabel,
  ctaDisabled,
  placing,
  onPress,
}: Props) {
  const scheme = useAppColorScheme();
  const tint = scheme === 'dark' ? 'dark' : 'light';
  const showTotal = step !== 2;
  const buttonBackground = ctaDisabled ? colors.textSecondary : colors.primary;

  return (
    <BlurView
      intensity={18}
      tint={tint}
      style={[styles.container, { borderTopColor: colors.border }]}
    >
      <View
        style={[
          styles.surface,
          {
            backgroundColor:
              scheme === 'dark'
                ? 'rgba(11,15,18,0.92)'
                : 'rgba(255,255,255,0.94)',
          },
        ]}
      >
        {showTotal && (
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
              Estimated total
            </Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>
              ${total.toFixed(2)}
            </Text>
          </View>
        )}
        <TouchableOpacity
          onPress={onPress}
          disabled={ctaDisabled || placing}
          activeOpacity={0.9}
          style={[
            styles.button,
            {
              backgroundColor: buttonBackground,
              opacity: ctaDisabled ? 0.7 : 1,
              shadowColor: ctaDisabled ? 'transparent' : colors.primary,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
          accessibilityState={{ disabled: ctaDisabled, busy: placing }}
        >
          {placing ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.buttonLabel}>Placing order…</Text>
            </>
          ) : (
            <>
              <Text style={styles.buttonLabel}>{ctaLabel}</Text>
              <Ionicons
                name={step === 2 ? 'lock-closed' : 'arrow-forward'}
                size={16}
                color="#fff"
              />
            </>
          )}
        </TouchableOpacity>
        {step === 2 && (
          <View style={styles.footnoteRow}>
            <Ionicons
              name="lock-closed"
              size={10}
              color={colors.textTertiary}
            />
            <Text style={[styles.footnote, { color: colors.textTertiary }]}>
              Secure checkout · Encrypted end-to-end
            </Text>
          </View>
        )}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
  },
  surface: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 32,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.18,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 6,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.075,
  },
  footnoteRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  footnote: {
    fontSize: 10,
    fontWeight: '400',
  },
});
