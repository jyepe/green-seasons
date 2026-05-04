// components/checkout/StepReview.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import type { CartItem } from '@/lib/supabase';
import { SectionLabel } from './SectionLabel';

type AddressSummary = {
  label: string;
  line: string;
  iconName: keyof typeof Ionicons.glyphMap;
};

type SlotSummary = {
  day: string;
  window: string;
};

type Totals = {
  subtotal: number;
  delivery: number;
  tax: number;
  discount: number;
  total: number;
};

type Props = {
  colors: (typeof Colors)['light'];
  items: CartItem[];
  address: AddressSummary;
  slot: SlotSummary;
  totals: Totals;
  agreed: boolean;
  onToggleAgree: () => void;
};

export function StepReview({
  colors,
  items,
  address,
  slot,
  totals,
  agreed,
  onToggleAgree,
}: Props) {
  return (
    <View>
      <SectionLabel colors={colors}>Order</SectionLabel>
      <View style={styles.padded}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {items.length === 0 && (
            <View style={styles.emptyRow}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Your cart is empty.
              </Text>
            </View>
          )}
          {items.map((it, i) => (
            <View
              key={it.item_row_id}
              style={[
                styles.itemRow,
                i < items.length - 1 && {
                  borderBottomColor: colors.border,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                },
              ]}
            >
              <View
                style={[
                  styles.itemSwatch,
                  { backgroundColor: colors.primary + '26' },
                ]}
              >
                <Ionicons
                  name="leaf-outline"
                  size={16}
                  color={colors.primary}
                />
              </View>
              <View style={styles.itemBody}>
                <Text
                  style={[styles.itemName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {it.item_name}
                </Text>
                <Text
                  style={[styles.itemMeta, { color: colors.textSecondary }]}
                >
                  {it.quantity} × ${it.item_price.toFixed(2)}
                </Text>
              </View>
              <Text style={[styles.itemTotal, { color: colors.text }]}>
                ${it.line_subtotal.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <SectionLabel colors={colors}>Delivery</SectionLabel>
      <View style={styles.padded}>
        <View
          style={[
            styles.card,
            styles.cardPadded,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.iconRow}>
            <Ionicons
              name={address.iconName}
              size={18}
              color={colors.primary}
              style={styles.rowIcon}
            />
            <View style={styles.rowBody}>
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
          <View style={styles.iconRow}>
            <Ionicons
              name="time-outline"
              size={18}
              color={colors.primary}
              style={styles.rowIcon}
            />
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>
                {slot.day} · {slot.window}
              </Text>
              <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                Driver will text on arrival
              </Text>
            </View>
          </View>
        </View>
      </View>

      <SectionLabel colors={colors}>Payment</SectionLabel>
      <View style={styles.padded}>
        <View
          style={[
            styles.card,
            styles.cardPadded,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.iconRow}>
            <Ionicons
              name="cash-outline"
              size={18}
              color={colors.textSecondary}
              style={styles.rowIcon}
            />
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>
                Cash on delivery
              </Text>
              <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                Pay driver on arrival
              </Text>
            </View>
          </View>
        </View>
      </View>

      <SectionLabel colors={colors}>Totals</SectionLabel>
      <View style={styles.padded}>
        <View
          style={[
            styles.card,
            styles.cardPadded,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <TotalsLine
            colors={colors}
            label="Subtotal"
            value={`$${totals.subtotal.toFixed(2)}`}
          />
          <TotalsLine
            colors={colors}
            label="Delivery"
            value={
              totals.delivery === 0 ? 'Free' : `$${totals.delivery.toFixed(2)}`
            }
            sub={totals.delivery === 0 ? 'over $150' : undefined}
            valueColor={totals.delivery === 0 ? colors.success : undefined}
          />
          <TotalsLine
            colors={colors}
            label="Tax (est.)"
            value={`$${totals.tax.toFixed(2)}`}
          />
          {totals.discount > 0 && (
            <TotalsLine
              colors={colors}
              label="Discount"
              value={`−$${totals.discount.toFixed(2)}`}
              valueColor={colors.success}
            />
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>
              Estimated total
            </Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>
              ${totals.total.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.agreementWrap}>
        <TouchableOpacity
          onPress={onToggleAgree}
          activeOpacity={0.85}
          style={[
            styles.agreement,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          accessibilityRole="checkbox"
          accessibilityLabel="I understand the final price disclaimer"
          accessibilityState={{ checked: agreed }}
        >
          <View
            style={[
              styles.checkbox,
              agreed
                ? { backgroundColor: colors.primary }
                : {
                    borderWidth: 1.5,
                    borderColor: colors.border,
                  },
            ]}
          >
            {agreed && <Ionicons name="checkmark" size={13} color="#fff" />}
          </View>
          <Text style={[styles.agreementText, { color: colors.textSecondary }]}>
            I understand this total does not reflect the final price. The final
            price will be determined when item prices are set on the scheduled
            delivery day.
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TotalsLine({
  colors,
  label,
  value,
  sub,
  valueColor,
}: {
  colors: (typeof Colors)['light'];
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.totalsLine}>
      <Text
        style={[styles.totalsLabel, { color: colors.textSecondary }]}
        numberOfLines={1}
      >
        {label}
        {sub && <Text style={{ color: colors.textTertiary }}> · {sub}</Text>}
      </Text>
      <Text style={[styles.totalsValue, { color: valueColor ?? colors.text }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  padded: {
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardPadded: {
    padding: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  itemSwatch: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.065,
  },
  itemMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyRow: {
    paddingHorizontal: 14,
    paddingVertical: 18,
  },
  emptyText: {
    fontSize: 13,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  rowIcon: {
    marginTop: 2,
  },
  rowBody: {
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
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
  totalsLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalsLabel: {
    fontSize: 12,
  },
  totalsValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.22,
  },
  agreementWrap: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  agreement: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  agreementText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
});
