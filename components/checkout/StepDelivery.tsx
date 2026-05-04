// components/checkout/StepDelivery.tsx
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import type { Restaurant } from '@/lib/supabase';
import type { DeliverySlot } from './slots';
import { SectionLabel } from './SectionLabel';

type Props = {
  colors: (typeof Colors)['light'];
  isAdmin: boolean;
  restaurant: Restaurant | null;
  allRestaurants: Restaurant[];
  selectedRestaurantId: string | null;
  dropdownVisible: boolean;
  onToggleDropdown: () => void;
  onSelectRestaurant: (rest: Restaurant) => void;
  slots: DeliverySlot[];
  selectedSlotId: string | null;
  onSelectSlot: (slot: DeliverySlot) => void;
  onPickOtherDate: () => void;
  customDate: Date | null;
  onSelectCustomDate: () => void;
  notes: string;
  onChangeNotes: (text: string) => void;
};

function formatAddressLine(rest: Restaurant | null): string {
  if (!rest) return '';
  return [
    rest.address_line1,
    rest.address_line2,
    [rest.city, rest.postal_code].filter(Boolean).join(', '),
    rest.country,
  ]
    .filter(part => part && part.trim().length > 0)
    .join(', ');
}

const CUSTOM_DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

export function StepDelivery({
  colors,
  isAdmin,
  restaurant,
  allRestaurants,
  selectedRestaurantId,
  dropdownVisible,
  onToggleDropdown,
  onSelectRestaurant,
  slots,
  selectedSlotId,
  onSelectSlot,
  onPickOtherDate,
  customDate,
  onSelectCustomDate,
  notes,
  onChangeNotes,
}: Props) {
  const addressLine = formatAddressLine(restaurant);
  const customSelected = !selectedSlotId && !!customDate;

  return (
    <View>
      <SectionLabel colors={colors}>Deliver to</SectionLabel>
      <View style={styles.padded}>
        <TouchableOpacity
          activeOpacity={isAdmin ? 0.85 : 1}
          onPress={isAdmin ? onToggleDropdown : undefined}
          disabled={!isAdmin}
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          accessibilityRole={isAdmin ? 'button' : undefined}
          accessibilityLabel={
            restaurant ? `Deliver to ${restaurant.name}` : 'Select a restaurant'
          }
          accessibilityState={
            isAdmin ? { expanded: dropdownVisible } : undefined
          }
        >
          <View
            style={[
              styles.iconTile,
              { backgroundColor: colors.inputBackground },
            ]}
          >
            <Ionicons
              name="storefront-outline"
              size={18}
              color={colors.textSecondary}
            />
          </View>
          <View style={styles.cardBody}>
            <View style={styles.cardTitleRow}>
              <Text
                style={[styles.cardTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {restaurant?.name ?? 'Select a restaurant'}
              </Text>
              <View
                style={[
                  styles.pill,
                  { backgroundColor: colors.inputBackground },
                ]}
              >
                <Text
                  style={[styles.pillText, { color: colors.textSecondary }]}
                >
                  Restaurant
                </Text>
              </View>
            </View>
            {!!addressLine && (
              <Text
                style={[styles.cardSubtitle, { color: colors.textSecondary }]}
                numberOfLines={2}
              >
                {addressLine}
              </Text>
            )}
          </View>
          {isAdmin && (
            <Ionicons
              name={dropdownVisible ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textSecondary}
            />
          )}
        </TouchableOpacity>

        {isAdmin && dropdownVisible && (
          <View
            style={[
              styles.dropdown,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
              {allRestaurants.map(rest => {
                const selected = rest.id === selectedRestaurantId;
                return (
                  <TouchableOpacity
                    key={rest.id}
                    style={[
                      styles.dropdownItem,
                      { borderBottomColor: colors.border },
                      selected && {
                        backgroundColor: colors.primary + '14',
                      },
                    ]}
                    onPress={() => onSelectRestaurant(rest)}
                    accessibilityRole="radio"
                    accessibilityLabel={rest.name}
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[
                        styles.dropdownText,
                        { color: selected ? colors.primary : colors.text },
                        selected && { fontWeight: '600' },
                      ]}
                      numberOfLines={1}
                    >
                      {rest.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      <SectionLabel colors={colors}>Delivery window</SectionLabel>
      <View style={[styles.padded, styles.slotGrid]}>
        {slots.map(s => {
          const active = !customSelected && s.id === selectedSlotId;
          return (
            <TouchableOpacity
              key={s.id}
              activeOpacity={0.85}
              onPress={() => onSelectSlot(s)}
              style={[
                styles.slot,
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
              accessibilityLabel={`${s.day} ${s.window}`}
              accessibilityState={{ selected: active }}
            >
              <Text
                style={[
                  styles.slotDay,
                  {
                    color: active
                      ? 'rgba(255,255,255,0.85)'
                      : colors.textSecondary,
                  },
                ]}
              >
                {s.day}
              </Text>
              <Text
                style={[
                  styles.slotWindow,
                  { color: active ? '#fff' : colors.text },
                ]}
              >
                {s.window}
              </Text>
              {s.note && (
                <Text
                  style={[
                    styles.slotNote,
                    {
                      color: active
                        ? 'rgba(255,255,255,0.85)'
                        : colors.textTertiary,
                    },
                  ]}
                >
                  {s.note}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
        {customSelected && customDate && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onSelectCustomDate}
            style={[
              styles.slot,
              {
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
              },
            ]}
            accessibilityRole="radio"
            accessibilityLabel={`Custom date ${CUSTOM_DATE_FORMAT.format(customDate)}`}
            accessibilityState={{ selected: true }}
          >
            <Text style={[styles.slotDay, { color: 'rgba(255,255,255,0.85)' }]}>
              Custom
            </Text>
            <Text style={[styles.slotWindow, { color: '#fff' }]}>
              {CUSTOM_DATE_FORMAT.format(customDate)}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.padded, styles.pickAnotherRow]}>
        <TouchableOpacity
          onPress={onPickOtherDate}
          accessibilityRole="button"
          accessibilityLabel="Pick another date"
        >
          <Text style={[styles.pickAnother, { color: colors.primary }]}>
            Pick another date →
          </Text>
        </TouchableOpacity>
      </View>

      <SectionLabel colors={colors}>Driver notes</SectionLabel>
      <View style={styles.padded}>
        <View
          style={[
            styles.notesCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <TextInput
            value={notes}
            onChangeText={onChangeNotes}
            placeholder="Buzz back door, leave with line cook…"
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            style={[styles.notesInput, { color: colors.text }]}
            accessibilityLabel="Driver notes"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  padded: {
    paddingHorizontal: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  iconTile: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.07,
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  pill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dropdown: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 220,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dropdownText: {
    fontSize: 14,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 0,
  },
  slot: {
    flexBasis: '48%',
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 0,
  },
  slotDay: {
    fontSize: 11,
    fontWeight: '500',
  },
  slotWindow: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: -0.07,
  },
  slotNote: {
    fontSize: 10,
    marginTop: 4,
  },
  pickAnotherRow: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  pickAnother: {
    fontSize: 13,
    fontWeight: '600',
  },
  notesCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  notesInput: {
    fontSize: 13,
    minHeight: 64,
    textAlignVertical: 'top',
    padding: 0,
  },
});
