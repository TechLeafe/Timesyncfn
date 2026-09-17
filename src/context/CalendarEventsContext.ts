import { createContext, useContext } from "react";
import type { CalendarEvent } from "../data/calendarEvents";

export interface CalendarEventsContextValue {
  /** All company calendar events keyed by `YYYY-MM-DD` */
  events: Record<string, CalendarEvent[]>;
  /**
   * Create (`target` = null) or update an existing event. Moving an event to
   * another date is supported by passing a different `dateKey`.
   */
  saveEvent: (
    target: { key: string; index: number } | null,
    dateKey: string,
    event: CalendarEvent
  ) => void;
  /** Remove the event stored at `index` on `dateKey`. */
  deleteEvent: (dateKey: string, index: number) => void;
}

export const CalendarEventsContext = createContext<CalendarEventsContextValue | undefined>(undefined);

/** Access the shared company calendar events (holidays / half days) from any page. */
export function useCalendarEvents(): CalendarEventsContextValue {
  const context = useContext(CalendarEventsContext);

  if (!context) {
    throw new Error("useCalendarEvents must be used inside a <CalendarEventsProvider>");
  }

  return context;
}