// components/checkout/StepConfirmed.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

type Props = {
  colors: (typeof Colors)['light'];
  orderId: string;
  arrivesLabel: string;
  windowLabel: string;
  address: {
    label: string;
    line: string;
    iconName: keyof typeof Ionicons.glyphMap;
  };
  total: number;
  email: string;
  onTrack: () => void;
  onKeepShopping: () => void;
};

function shortOrderId(orderId: string): string {
  // Render `#GS-XXXX` from the trailing characters of the UUID for visual parity.
  const tail = orderId.replace(/-/g, '').slice(-4).toUpperCase();
  return `#GS-${tail}`;
}

export function StepConfirmed({
  colors,
  orderId,
  arrivesLabel,
  windowLabel,
  address,
  total,
  email,
  onTrack,
  onKeepShopping,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View
          style={[styles.heroOuter, { backgroundColor: colors.success + '14' }]}
        >
          <View
            style={[styles.heroMid, { backgroundColor: colors.success + '26' }]}
          />
          <View
            style={[
              styles.heroInner,
              {
                backgroundColor: colors.success,
                shadowColor: colors.success,
              },
            ]}
          >
            <Ionicons name="checkmark" size={32} color="#fff" />
          </View>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Order placed</Text>
        <Text
          style={[styles.subtitle, { color: colors.textSecondary }]}
          numberOfLines={3}
        >
          We sent a confirmation to {email || 'your email'}. You&apos;ll get a
          text when your driver leaves the warehouse.
        </Text>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.cardRow}>
          <Text style={[styles.label, { color: colors.textTertiary }]}>
            ORDER
          </Text>
          <Text style={[styles.orderId, { color: colors.text }]}>
            {shortOrderId(orderId)}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.iconRow}>
          <Ionicons
            name="time-outline"
            size={18}
            color={colors.primary}
            style={styles.icon}
          />
          <View style={styles.body}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Arrives {arrivesLabel}
            </Text>
            <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
              Window {windowLabel}
            </Text>
          </View>
        </View>
        <View style={styles.spacer} />
        <View style={styles.iconRow}>
          <Ionicons
            name={address.iconName}
            size={18}
            color={colors.primary}
            style={styles.icon}
          />
          <View style={styles.body}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              {address.label}
            </Text>
            {!!address.line && (
              <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                {address.line}
              </Text>
            )}
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.cardRow}>
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
            Estimated total
          </Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>
            ${total.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.ctaRow}>
        <TouchableOpacity
          onPress={onTrack}
          activeOpacity={0.85}
          style={[
            styles.ctaSecondary,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Track order"
        >
          <Ionicons name="map-outline" size={14} color={colors.text} />
          <Text style={[styles.ctaSecondaryLabel, { color: colors.text }]}>
            Track order
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onKeepShopping}
          activeOpacity={0.85}
          style={[
            styles.ctaPrimary,
            { backgroundColor: colors.primary, shadowColor: colors.primary },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Keep shopping"
        >
          <Ionicons name="storefront-outline" size={14} color="#fff" />
          <Text style={styles.ctaPrimaryLabel}>Keep shopping</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 28,
  },
  heroOuter: {
    width: 100,
    height: 100,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMid: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 999,
  },
  heroInner: {
    width: 60,
    height: 60,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 22,
    elevation: 6,
  },
  title: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.24,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
  },
  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  orderId: {
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  icon: {
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  rowSub: {
    fontSize: 12,
    marginTop: 2,
  },
  spacer: {
    height: 8,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  ctaSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
  },
  ctaSecondaryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  ctaPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  ctaPrimaryLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
