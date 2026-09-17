/* ──────────────────────────────────────────────────────────────
   Mock attendance data for the Attendance page.

   * The colour legend / summary tiles are driven by ATTENDANCE_META.
   * A half day is stored with the half it was taken on, so the calendar can
     paint the two halves differently:
         halfDayFirst  → amber / yellow   (worked the second half)
         halfDaySecond → purple           (worked the first half)
   * Late arrival is NOT a status of its own – a late day stays "present"
     (green cell) and only carries the plain "LP" corner label, so it is still
     counted as a present day. The mock late days live in ATTENDANCE_LATE_KEYS.
   * Holidays are NOT stored here – they are read from the shared company
     calendar (CalendarEventsProvider), so a holiday created by HR shows up
     on this page automatically and always wins over an attendance record.
   ────────────────────────────────────────────────────────────── */

import { CALENDAR_TONES, type CalendarTone } from "../Components/Calendar/calendarTheme";
import { HALF_DAY_SLOTS, toDateKey } from "./calendarEvents";

export type AttendanceStatus = "present" | "absent" | "halfDayFirst" | "halfDaySecond" | "leave";

export interface AttendanceStatusMeta {
  /** Tile / legend label */
  label: string;
  /** Secondary text shown next to the legend dot */
  note: string;
  /** Cell colour family used by the reusable calendar */
  tone: CalendarTone;
  /** Legend dot colour (kept in sync with the calendar tone) */
  color: string;
}

export const ATTENDANCE_META: Record<AttendanceStatus, AttendanceStatusMeta> = {
  present: { label: "Present", note: "(Working)", tone: "green", color: CALENDAR_TONES.green.dot },

  absent: { label: "Absent", note: "(Not working)", tone: "red", color: CALENDAR_TONES.red.dot },

  /* First half (yellow) – the employee was present only for the first half */
  halfDayFirst: {
    label: "1st Half Day",
    note: `(${HALF_DAY_SLOTS.first.label})`,
    tone: "amber",
    color: CALENDAR_TONES.amber.dot,
  },

  /* Second half (purple) – deliberately a different colour than the first half */
  halfDaySecond: {
    label: "2nd Half Day",
    note: `(${HALF_DAY_SLOTS.second.label})`,
    tone: "purple",
    color: CALENDAR_TONES.purple.dot,
  },

  leave: { label: "Leave", note: "(Casual/Sick/Other)", tone: "blue", color: CALENDAR_TONES.blue.dot },
};

/** Order used by the summary tiles and by the legend. */
export const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  "present",
  "absent",
  "halfDayFirst",
  "halfDaySecond",
  "leave",
];

/**
 * Plain-text corner label painted on a present day the employee arrived late
 * on. It adds no colour – the cell simply stays green (present).
 */
export const LATE_CORNER_LABEL = "LP";

/** Mock `YYYY-MM-DD` days where the employee was present but arrived late. */
export const ATTENDANCE_LATE_KEYS: ReadonlySet<string> = new Set([
  "2026-09-03",
  "2026-09-11",
  "2026-09-23",
  "2026-08-11",
  "2026-10-16",
]);

/** Company holidays are always painted with this tone on the attendance calendar. */
export const HOLIDAY_TONE: CalendarTone = "pink";

/**
 * Mock attendance records (`YYYY-MM-DD` → status).
 * September 2026 mirrors the agreed design sample (12 present / 3 absent /
 * 2 half days – one first half (yellow) and one second half (purple) –
 * 2 leaves, holidays excluded because they come from the company calendar).
 * Days listed in ATTENDANCE_LATE_KEYS additionally show the "LP" corner label.
 */
export const ATTENDANCE_RECORDS: Record<string, AttendanceStatus> = {
  /* September 2026 */
  "2026-09-01": "present",
  "2026-09-02": "present",
  "2026-09-03": "present",
  "2026-09-04": "present",
  "2026-09-05": "absent",
  "2026-09-07": "leave",
  "2026-09-08": "present",
  "2026-09-09": "present",
  "2026-09-10": "halfDayFirst",
  "2026-09-11": "present",
  "2026-09-14": "present",
  "2026-09-16": "present",
  "2026-09-17": "present",
  "2026-09-21": "present",
  "2026-09-22": "halfDaySecond",
  "2026-09-23": "present",
  "2026-09-24": "absent",
  "2026-09-25": "absent",
  "2026-09-30": "leave",

  /* August 2026 (sample data, keeps the month navigation alive) */
  "2026-08-03": "present",
  "2026-08-05": "leave",
  "2026-08-11": "present",
  "2026-08-14": "halfDayFirst",
  "2026-08-19": "absent",
  "2026-08-21": "halfDaySecond",
  "2026-08-26": "present",

  /* October 2026 (sample data) */
  "2026-10-01": "present",
  "2026-10-05": "present",
  "2026-10-08": "leave",
  "2026-10-13": "halfDaySecond",
  "2026-10-16": "present",
  "2026-10-20": "halfDayFirst",
  "2026-10-27": "absent",
};

export interface AttendanceDayResult {
  /** null for holidays, weekends without a record and future working days */
  status: AttendanceStatus | null;
  /** true when the date is a company holiday (taken from the shared calendar) */
  isHoliday: boolean;
  /** true on a present day the employee arrived late (adds the "LP" corner label) */
  late: boolean;
}

export interface AttendanceLookupOptions {
  /** `YYYY-MM-DD` keys of all company holidays */
  holidayKeys: ReadonlySet<string>;
  /** Reference day – future working days stay empty */
  today?: Date;
  /**
   * Past non-weekend days without an explicit record count as "present"
   * (nobody raised a leave / absence for them).
   */
  fillPastWorkingDays?: boolean;
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/**
 * Resolves the attendance of a single day.
 * A company holiday always wins over any attendance record.
 * `late` is only ever true on a present day – a late day is still a working
 * day, so it keeps the green cell and only gains the "LP" corner label.
 */
export function resolveAttendanceDay(
  date: Date,
  { holidayKeys, today = new Date(), fillPastWorkingDays = true }: AttendanceLookupOptions
): AttendanceDayResult {
  const key = toDateKey(date);

  if (holidayKeys.has(key)) {
    return { status: null, isHoliday: true, late: false };
  }

  const recorded = ATTENDANCE_RECORDS[key];
  if (recorded) {
    return { status: recorded, isHoliday: false, late: recorded === "present" && ATTENDANCE_LATE_KEYS.has(key) };
  }

  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const isPast    = startOfDay(date) <= startOfDay(today);

  if (fillPastWorkingDays && !isWeekend && isPast) {
    return { status: "present", isHoliday: false, late: ATTENDANCE_LATE_KEYS.has(key) };
  }

  return { status: null, isHoliday: false, late: false };
}

/** Counts present / absent / first half days / second half days / leaves for a whole month. */
export function summarizeAttendanceMonth(
  year: number,
  month: number,
  options: AttendanceLookupOptions
): Record<AttendanceStatus, number> {
  const totals: Record<AttendanceStatus, number> = {
    present: 0,
    absent: 0,
    halfDayFirst: 0,
    halfDaySecond: 0,
    leave: 0,
  };
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day += 1) {
    const { status } = resolveAttendanceDay(new Date(year, month, day), options);
    if (status) totals[status] += 1;
  }

  return totals;
}