/* ──────────────────────────────────────────────────────────────
   Company calendar events (holidays + half days).

   This module is the single source of truth for the event data and
   is consumed through the CalendarEventsProvider context, so an
   event created by HR on the Company Calendar page shows up on the
   Attendance calendar as well.
   ────────────────────────────────────────────────────────────── */

export type CalendarEventType = "holiday" | "halfDay";
export type HalfDaySlot = "first" | "second";

export interface CalendarEvent {
  title: string;
  type: CalendarEventType;
  halfDaySlot?: HalfDaySlot;
  time?: string;
  description?: string;
}

/** Half day working windows */
export const HALF_DAY_SLOTS: Record<HalfDaySlot, { label: string; window: string; range: string }> = {
  first:  { label: "First Half",  window: "Before 2:00 PM", range: "9:30 AM – 2:00 PM" },
  second: { label: "Second Half", window: "After 2:00 PM",  range: "2:00 PM – 6:30 PM" },
};

/* Initial Mock Events */
export const INITIAL_CALENDAR_EVENTS: Record<string, CalendarEvent[]> = {
  "2026-01-01": [{ title: "New Year's Day",        type: "holiday", description: "Office closed." }],
  "2026-01-26": [{ title: "Republic Day",          type: "holiday", description: "National holiday." }],
  "2026-03-04": [{ title: "Holi",                  type: "holiday", description: "Festival of colors." }],
  "2026-04-03": [{ title: "Good Friday",           type: "holiday", description: "Public holiday." }],
  "2026-05-01": [{ title: "Labour Day",            type: "holiday", description: "Workers' Day." }],
  "2026-08-15": [{ title: "Independence Day",      type: "holiday", description: "National holiday." }],
  "2026-09-15": [{ title: "Ganesh Chaturthi",      type: "holiday", description: "Office will remain closed." }],
  "2026-09-18": [{ title: "Company Foundation Day",type: "holiday", time: "All Day", description: "Annual company holiday." }],
  "2026-09-22": [{ title: "Team Review (Half Day)",  type: "halfDay", halfDaySlot: "second", description: "Company event." }],
  "2026-10-02": [{ title: "Gandhi Jayanti",        type: "holiday", description: "National holiday." }],
  "2026-10-20": [{ title: "Dussehra",              type: "holiday", description: "Office closed." }],
  "2026-11-08": [{ title: "Diwali",                type: "holiday", description: "Festival of lights." }],
  "2026-12-25": [{ title: "Christmas Day",         type: "holiday", description: "Christmas holiday." }],
};

/** `YYYY-MM-DD` key used by the events map (and by the attendance records). */
export const toDateKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth()    === b.getMonth()    &&
  a.getDate()     === b.getDate();

/** All events of one date, newest last. */
export const eventsOn = (events: Record<string, CalendarEvent[]>, date: Date): CalendarEvent[] =>
  events[toDateKey(date)] ?? [];

/** First holiday of a date, if any. */
export const holidayOn = (events: Record<string, CalendarEvent[]>, date: Date): CalendarEvent | undefined =>
  eventsOn(events, date).find((event) => event.type === "holiday");

/** First half day of a date, if any. */
export const halfDayOn = (events: Record<string, CalendarEvent[]>, date: Date): CalendarEvent | undefined =>
  eventsOn(events, date).find((event) => event.type === "halfDay");

/** Date keys (`YYYY-MM-DD`) that carry at least one holiday. */
export const holidayKeysOf = (events: Record<string, CalendarEvent[]>): Set<string> =>
  new Set(
    Object.keys(events).filter((key) => events[key].some((event) => event.type === "holiday"))
  );