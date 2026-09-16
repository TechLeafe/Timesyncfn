import { useMemo, useState, type ReactNode } from "react";
import { INITIAL_CALENDAR_EVENTS, type CalendarEvent } from "../data/calendarEvents";
import { CalendarEventsContext, type CalendarEventsContextValue } from "./CalendarEventsContext";

function CalendarEventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Record<string, CalendarEvent[]>>(INITIAL_CALENDAR_EVENTS);

  const value = useMemo<CalendarEventsContextValue>(
    () => ({
      events,

      saveEvent: (target, dateKey, event) => {
        setEvents((prev) => {
          const next = { ...prev };

          /* New event – just append it to the selected date */
          if (!target) {
            next[dateKey] = [...(next[dateKey] ?? []), event];
            return next;
          }

          /* Existing event – remove it from its old date, then re-add it */
          const list = [...(next[target.key] ?? [])];
          list.splice(target.index, 1);

          if (target.key === dateKey) {
            list.splice(target.index, 0, event);
            next[dateKey] = list;
          } else {
            if (list.length === 0) delete next[target.key];
            else next[target.key] = list;

            next[dateKey] = [...(next[dateKey] ?? []), event];
          }

          return next;
        });
      },

      deleteEvent: (dateKey, index) => {
        setEvents((prev) => {
          const list = [...(prev[dateKey] ?? [])];
          list.splice(index, 1);

          const next = { ...prev };
          if (list.length === 0) delete next[dateKey];
          else next[dateKey] = list;

          return next;
        });
      },
    }),
    [events]
  );

  return <CalendarEventsContext.Provider value={value}>{children}</CalendarEventsContext.Provider>;
}

export default CalendarEventsProvider;