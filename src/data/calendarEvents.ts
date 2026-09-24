export type CalendarEventType = "holiday" | "halfDay";
export type HalfDaySlot = "first" | "second";

// Calendar event structure
export interface CalendarEvent {
  title: string;
  type: CalendarEventType;
  halfDaySlot?: HalfDaySlot;
  time?: string;
  description?: string;
}

// Half-day time slots
export const HALF_DAY_SLOTS: Record<
  HalfDaySlot,
  { label: string; window: string; range: string }
> = {
  first: {
    label: "First Half",
    window: "Before 2:00 PM",
    range: "9:30 AM – 2:00 PM",
  },
  second: {
    label: "Second Half",
    window: "After 2:00 PM",
    range: "2:00 PM – 6:30 PM",
  },
};

// Default calendar events
export const INITIAL_CALENDAR_EVENTS: Record<string, CalendarEvent[]> = {
  "2026-01-01": [
    {
      title: "New Year's Day",
      type: "holiday",
      description: "Office closed.",
    },
  ],
  "2026-01-26": [
    {
      title: "Republic Day",
      type: "holiday",
      description: "National holiday.",
    },
  ],
  "2026-03-04": [
    {
      title: "Holi",
      type: "holiday",
      description: "Festival of colors.",
    },
  ],
  "2026-04-03": [
    {
      title: "Good Friday",
      type: "holiday",
      description: "Public holiday.",
    },
  ],
  "2026-05-01": [
    {
      title: "Labour Day",
      type: "holiday",
      description: "Workers' Day.",
    },
  ],
  "2026-08-15": [
    {
      title: "Independence Day",
      type: "holiday",
      description: "National holiday.",
    },
  ],
  "2026-09-15": [
    {
      title: "Ganesh Chaturthi",
      type: "holiday",
      description: "Office will remain closed.",
    },
  ],
  "2026-09-18": [
    {
      title: "Company Foundation Day",
      type: "holiday",
      time: "All Day",
      description: "Annual company holiday.",
    },
  ],
  "2026-09-22": [
    {
      title: "Team Review (Half Day)",
      type: "halfDay",
      halfDaySlot: "second",
      description: "Company event.",
    },
  ],
  "2026-10-02": [
    {
      title: "Gandhi Jayanti",
      type: "holiday",
      description: "National holiday.",
    },
  ],
  "2026-10-20": [
    {
      title: "Dussehra",
      type: "holiday",
      description: "Office closed.",
    },
  ],
  "2026-11-08": [
    {
      title: "Diwali",
      type: "holiday",
      description: "Festival of lights.",
    },
  ],
  "2026-12-25": [
    {
      title: "Christmas Day",
      type: "holiday",
      description: "Christmas holiday.",
    },
  ],
};

// Convert date to YYYY-MM-DD
export const toDateKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

// Check if dates match
export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// Get events for a date
export const eventsOn = (
  events: Record<string, CalendarEvent[]>,
  date: Date
): CalendarEvent[] => events[toDateKey(date)] ?? [];

// Get holiday for a date
export const holidayOn = (
  events: Record<string, CalendarEvent[]>,
  date: Date
): CalendarEvent | undefined =>
  eventsOn(events, date).find((event) => event.type === "holiday");

// Get half-day event
export const halfDayOn = (
  events: Record<string, CalendarEvent[]>,
  date: Date
): CalendarEvent | undefined =>
  eventsOn(events, date).find((event) => event.type === "halfDay");

// Get holiday date keys
export const holidayKeysOf = (
  events: Record<string, CalendarEvent[]>
): Set<string> =>
  new Set(
    Object.keys(events).filter((key) =>
      events[key].some((event) => event.type === "holiday")
    )
  );