// components/checkout/StepPayment.tsx
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SectionLabel } from './SectionLabel';

type PaymentMethodId = 'card' | 'ach' | 'invoice';

type SavedCard = {
  id: string;
  brand: 'Visa' | 'Mastercard';
  last4: string;
  exp: string;
  primary: boolean;
};

const CARDS: SavedCard[] = [
  { id: 'c1', brand: 'Visa', last4: '4242', exp: '08/27', primary: true },
  {
    id: 'c2',
    brand: 'Mastercard',
    last4: '8841',
    exp: '02/26',
    primary: false,
  },
];

const PAY_METHODS: {
  id: PaymentMethodId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: 'card', label: 'Card', icon: 'card-outline' },
  { id: 'ach', label: 'ACH bank', icon: 'business-outline' },
  { id: 'invoice', label: 'Net-30 invoice', icon: 'receipt-outline' },
];

const BRAND_BACKGROUND: Record<SavedCard['brand'], string> = {
  Visa: '#1A1F71',
  Mastercard: '#000000',
};

type Props = {
  colors: (typeof Colors)['light'];
  paymentMethod: 'card' | 'ach' | 'invoice' | 'cash';
  onSelectMethod: (method: PaymentMethodId) => void;
  selectedCardId: string;
  onSelectCard: (cardId: string) => void;
  email: string;
  onShowToast: (message: string) => void;
};

export function StepPayment({
  colors,
  paymentMethod,
  onSelectMethod,
  selectedCardId,
  onSelectCard,
  email,
  onShowToast,
}: Props) {
  return (
    <View>
      <SectionLabel colors={colors}>Pay with</SectionLabel>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {PAY_METHODS.map(p => {
          const active = p.id === paymentMethod;
          return (
            <TouchableOpacity
              key={p.id}
              activeOpacity={0.85}
              onPress={() => onSelectMethod(p.id)}
              style={[
                styles.chip,
                active
                  ? {
                      backgroundColor: colors.primary,
                      shadowColor: colors.primary,
                    }
                  : {
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                    },
              ]}
              accessibilityRole="radio"
              accessibilityLabel={p.label}
              accessibilityState={{ selected: active }}
            >
              <Ionicons
                name={p.icon}
                size={14}
                color={active ? '#fff' : colors.text}
              />
              <Text
                style={[
                  styles.chipLabel,
                  { color: active ? '#fff' : colors.text },
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {paymentMethod === 'card' && (
        <>
          <SectionLabel
            colors={colors}
            action="Add card"
            onAction={() => onShowToast('Coming soon')}
          >
            Saved cards
          </SectionLabel>
          <View style={styles.padded}>
            {CARDS.map((c, idx) => {
              const selected = c.id === selectedCardId;
              return (
                <TouchableOpacity
                  key={c.id}
                  activeOpacity={0.85}
                  onPress={() => onSelectCard(c.id)}
                  style={[
                    styles.cardRow,
                    idx > 0 && styles.cardRowSpacing,
                    {
                      backgroundColor: colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                      borderWidth: selected ? 2 : 1,
                      shadowColor: selected ? colors.primary : 'transparent',
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityLabel={`${c.brand} ending in ${c.last4}`}
                  accessibilityState={{ selected }}
                >
                  <View
                    style={[
                      styles.brandTile,
                      { backgroundColor: BRAND_BACKGROUND[c.brand] },
                    ]}
                  >
                    <Text style={styles.brandText}>
                      {c.brand.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.cardCenter}>
                    <View style={styles.cardCenterRow}>
                      <Text style={[styles.cardLast4, { color: colors.text }]}>
                        •••• {c.last4}
                      </Text>
                      {c.primary && (
                        <View
                          style={[
                            styles.defaultPill,
                            { backgroundColor: colors.primary + '1F' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.defaultPillText,
                              { color: colors.primary },
                            ]}
                          >
                            Default
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[styles.cardExp, { color: colors.textSecondary }]}
                    >
                      Expires {c.exp}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.tick,
                      selected
                        ? { backgroundColor: colors.primary }
                        : {
                            borderWidth: 1.5,
                            borderColor: colors.border,
                          },
                    ]}
                  >
                    {selected && (
                      <Ionicons name="checkmark" size={13} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {paymentMethod === 'ach' && (
        <View style={[styles.padded, styles.stubWrap]}>
          <View
            style={[
              styles.stubCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[styles.stubTile, { backgroundColor: colors.info + '1F' }]}
            >
              <Ionicons name="business-outline" size={18} color={colors.info} />
            </View>
            <View style={styles.stubBody}>
              <Text style={[styles.stubTitle, { color: colors.text }]}>
                Chase Business ••5821
              </Text>
              <Text
                style={[styles.stubSubtitle, { color: colors.textSecondary }]}
              >
                Settles in 2–3 business days
              </Text>
            </View>
            <Ionicons
              name="checkmark-circle"
              size={22}
              color={colors.success}
            />
          </View>
        </View>
      )}

      {paymentMethod === 'invoice' && (
        <View style={[styles.padded, styles.stubWrap]}>
          <View
            style={[
              styles.stubCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.stubTile,
                { backgroundColor: colors.accentWarm + '1F' },
              ]}
            >
              <Ionicons
                name="receipt-outline"
                size={18}
                color={colors.accentWarm}
              />
            </View>
            <View style={styles.stubBody}>
              <Text style={[styles.stubTitle, { color: colors.text }]}>
                Net-30 invoicing
              </Text>
              <Text
                style={[styles.invoiceBody, { color: colors.textSecondary }]}
              >
                We&apos;ll email an invoice to{' '}
                <Text style={[styles.invoiceEmail, { color: colors.text }]}>
                  {email || 'your billing email'}
                </Text>{' '}
                after delivery. Payment due within 30 days.
              </Text>
            </View>
          </View>
        </View>
      )}

      <SectionLabel colors={colors}>Billing</SectionLabel>
      <View style={styles.padded}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onShowToast('Coming soon')}
          style={[
            styles.billingCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Billing entity"
        >
          <Ionicons
            name="business-outline"
            size={16}
            color={colors.textSecondary}
          />
          <View style={styles.billingBody}>
            <Text style={[styles.billingTitle, { color: colors.text }]}>
              Olivetta LLC
            </Text>
            <Text
              style={[styles.billingSubtitle, { color: colors.textSecondary }]}
            >
              EIN ••3412 · Tax-exempt resale
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textTertiary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  padded: {
    paddingHorizontal: 20,
  },
  chipsRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  cardRowSpacing: {
    marginTop: 10,
  },
  brandTile: {
    width: 44,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardCenter: {
    flex: 1,
  },
  cardCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardLast4: {
    fontSize: 13,
    fontWeight: '600',
  },
  defaultPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  defaultPillText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardExp: {
    fontSize: 11,
    marginTop: 2,
  },
  tick: {
    width: 20,
    height: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stubWrap: {
    marginTop: 4,
  },
  stubCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  stubTile: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stubBody: {
    flex: 1,
  },
  stubTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  stubSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  invoiceBody: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  invoiceEmail: {
    fontWeight: '600',
  },
  billingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  billingBody: {
    flex: 1,
  },
  billingTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  billingSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
});
