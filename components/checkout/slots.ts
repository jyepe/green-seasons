// components/checkout/slots.ts

export type DeliverySlot = {
  id: string;
  day: string;
  window: string;
  note: string | null;
  date: Date;
};

const WEEKDAY_FORMAT = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

function atHour(base: Date, daysAhead: number, hour: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, 0, 0, 0);
  return d;
}

/**
 * Returns four preset delivery windows starting tomorrow.
 * Order: tomorrow 6–9 AM (recommended), tomorrow 2–5 PM, +2d 6–9 AM, +3d 6–9 AM.
 */
export function generateDeliverySlots(now: Date): DeliverySlot[] {
  return [
    {
      id: 'tomorrow-am',
      day: 'Tomorrow',
      window: '6–9 AM',
      note: 'Recommended',
      date: atHour(now, 1, 6),
    },
    {
      id: 'tomorrow-pm',
      day: 'Tomorrow',
      window: '2–5 PM',
      note: null,
      date: atHour(now, 1, 14),
    },
    {
      id: 'plus2-am',
      day: WEEKDAY_FORMAT.format(atHour(now, 2, 6)),
      window: '6–9 AM',
      note: null,
      date: atHour(now, 2, 6),
    },
    {
      id: 'plus3-am',
      day: WEEKDAY_FORMAT.format(atHour(now, 3, 6)),
      window: '6–9 AM',
      note: null,
      date: atHour(now, 3, 6),
    },
  ];
}
