export type CalendarTone = "green" | "red" | "amber" | "purple" | "blue" | "pink";

export interface CalendarTonePalette {
  /** Resting cell background */
  bg: string;
  /** Deeper tint used while the cell is selected */
  bgStrong: string;
  /** Background on hover */
  bgHover: string;
  /** Background on hover while selected */
  bgHoverStrong: string;
  /** Resting cell border */
  border: string;
  /** Selected border + outline colour */
  accent: string;
  /** Date number colour */
  text: string;
  /** Status dot colour */
  dot: string;
}

export const CALENDAR_TONES: Record<CalendarTone, CalendarTonePalette> = {
  /* Present / success */
  green: {
    bg: "#E8F5E9",
    bgStrong: "#C8E6C9",
    bgHover: "#DCF0DE",
    bgHoverStrong: "#C8E6C9",
    border: "#A5D6A7",
    accent: "#1B6B33",
    text: "#1B6B33",
    dot: "#4CAF50",
  },
  /* Absent / holiday / danger */
  red: {
    bg: "#FFEBEE",
    bgStrong: "#FFCDD2",
    bgHover: "#FFCDD2",
    bgHoverStrong: "#FFC1C1",
    border: "#FFCDD2",
    accent: "#D42B2B",
    text: "#D42B2B",
    dot: "#D42B2B",
  },
  /* First half day (yellow) / warning */
  amber: {
    bg: "#FFF8E1",
    bgStrong: "#FFECB3",
    bgHover: "#FFF3CD",
    bgHoverStrong: "#FFECB3",
    border: "#FFE082",
    accent: "#F59E0B",
    text: "#B45309",
    dot: "#F59E0B",
  },
  /* Second half day – deliberately NOT yellow so the two halves of a day
     are never confused (first half = yellow, second half = purple) */
  purple: {
    bg: "#F3E5F5",
    bgStrong: "#E1BEE7",
    bgHover: "#EBDBEF",
    bgHoverStrong: "#E1BEE7",
    border: "#CE93D8",
    accent: "#6A1B9A",
    text: "#6A1B9A",
    dot: "#8E24AA",
  },
  /* Leave / half day (company calendar) / info */
  blue: {
    bg: "#E3F2FD",
    bgStrong: "#BBDEFB",
    bgHover: "#D6E9FB",
    bgHoverStrong: "#BBDEFB",
    border: "#BBDEFB",
    accent: "#1565C0",
    text: "#1565C0",
    dot: "#1565C0",
  },
  /* Company holiday on the attendance calendar */
  pink: {
    bg: "#FCE4EC",
    bgStrong: "#F8BBD0",
    bgHover: "#FAD9E5",
    bgHoverStrong: "#F8BBD0",
    border: "#F8BBD0",
    accent: "#EC407A",
    text: "#C2185B",
    dot: "#EC407A",
  },
};

/** State that the calendar hands to `getDayInfo` for every rendered day. */
export interface CalendarDayState {
  isSelected: boolean;
  isToday: boolean;
  /** false for the leading / trailing days borrowed from the neighbour months */
  inMonth: boolean;
  isWeekend: boolean;
}

/** Colour + tooltip description of a single day cell. */
export interface CalendarDayInfo {
  /** Colour family; leave `undefined` for a plain, unmarked day */
  tone?: CalendarTone;
  /** Force the status dot on / off (defaults to on when a tone is set) */
  dot?: boolean;
  /** Overrides the dot colour coming from the tone */
  dotColor?: string;
  /** Overrides the date number colour coming from the tone */
  dateColor?: string;
  /**
   * Short plain-text label painted in the top-right corner of the cell,
   * e.g. "LP" for a present day the employee arrived late on. It never adds
   * a colour of its own – the cell keeps the tone of the day.
   */
  cornerLabel?: string;
  /** Overrides the corner label colour (defaults to the tone text colour) */
  cornerColor?: string;
  /** Hover tooltip rendered inside the shared tooltip skin */
  tooltip?: string;
}

/** Single entry of the colour legend shown under / next to a calendar. */
export interface CalendarLegendItem {
  /** Dot colour */
  color: string;
  /** Primary label, e.g. "Present" */
  label: string;
  /** Optional secondary note, e.g. "(Working)" – only used by the stacked layout */
  note?: string;
}