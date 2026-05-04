// components/checkout/CheckoutStepper.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export type StepperStep = { id: string; label: string };

type Props = {
  colors: (typeof Colors)['light'];
  step: 0 | 1 | 2;
  steps: StepperStep[];
};

export function CheckoutStepper({ colors, step, steps }: Props) {
  return (
    <View
      style={styles.container}
      accessibilityRole="header"
      accessibilityLabel={`Step ${step + 1} of ${steps.length}, ${steps[step]?.label ?? ''}`}
    >
      {steps.map((s, i) => {
        const done = i < step;
        const active = i === step;
        const filled = done || active;
        const isLast = i === steps.length - 1;
        return (
          <React.Fragment key={s.id}>
            <View style={styles.node}>
              <View
                style={[
                  styles.circle,
                  filled
                    ? { backgroundColor: colors.primary }
                    : {
                        backgroundColor: colors.inputBackground,
                        borderWidth: 1,
                        borderColor: colors.border,
                      },
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : (
                  <Text
                    style={[
                      styles.number,
                      { color: filled ? '#fff' : colors.textTertiary },
                    ]}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  { color: filled ? colors.text : colors.textTertiary },
                ]}
                numberOfLines={1}
              >
                {s.label}
              </Text>
            </View>
            {!isLast && (
              <View
                style={[
                  styles.bar,
                  {
                    backgroundColor: i < step ? colors.primary : colors.border,
                  },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 6,
  },
  node: {
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontSize: 11,
    fontWeight: '700',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
  bar: {
    flex: 1,
    height: 2,
    borderRadius: 999,
    marginTop: -16, // align bar with circle midline (label sits below)
  },
});
