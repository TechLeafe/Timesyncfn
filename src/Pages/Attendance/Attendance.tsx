
import { useMemo, useState, type CSSProperties } from "react";

import {
  Box,
  Chip,
  Typography,
} from "@mui/material";

import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";

import MonthCalendar from "../../Components/Calendar/MonthCalendar/MonthCalendar";
import CalendarLegend from "../../Components/Calendar/CalendarLegend/CalendarLegend";

import {
  ATTENDANCE_STATUSES,
  ATTENDANCE_META,
  HOLIDAY_TONE,
  LATE_CORNER_LABEL,
  resolveAttendanceDay,
  summarizeAttendanceMonth,
} from "../../data/attendance";

import type {
  CalendarDayInfo,
  CalendarLegendItem,
} from "../../Components/Calendar/calendarTheme";

import {
  CALENDAR_TONES,
} from "../../Components/Calendar/calendarTheme";

import { useCalendarEvents } from "../../context/CalendarEventsContext";
import { toDateKey } from "../../data/calendarEvents";

import { HR, ADMIN, EMPLOYEE } from "../../data/permissions";

import "./Attendance.css";

/* ==========================================
   LOGGED-IN USER
========================================== */

interface StoredUser {
  userType?: number | string;
  name?: string;
  employeeId?: string;
  userId?: string;
}

const readLoggedInUser = (): StoredUser | null => {
  try {
    const stored = localStorage.getItem("loggedInUser");

    if (!stored) return null;

    const parsed: unknown = JSON.parse(stored);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return null;
    }

    return parsed as StoredUser;
  } catch {
    return null;
  }
};

/* ==========================================
   MAIN COMPONENT
========================================== */

function Attendance() {
  const today = useMemo(() => new Date(), []);

  const loggedInUser = useMemo(
    () => readLoggedInUser(),
    []
  );

  const userType = Number(loggedInUser?.userType);

  const employeeName =
    loggedInUser?.name || "Employee";

  const isEmployee = userType === EMPLOYEE;
  const canViewAllAttendance =
    userType === HR || userType === ADMIN;

  /* ==========================================
     COMPANY CALENDAR EVENTS
  ========================================== */

  const { events } = useCalendarEvents();

  /* ==========================================
     CALENDAR STATE
  ========================================== */

  const [visibleMonth, setVisibleMonth] = useState(
    () =>
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
  );

  const [selectedDate, setSelectedDate] = useState<Date | null>(
    () =>
      new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      )
  );

  /* ==========================================
     HOLIDAYS
  ========================================== */

  const holidayTitles = useMemo(() => {
    const map = new Map<string, string>();

    Object.entries(events).forEach(([key, list]) => {
      const holiday = list.find(
        (event) => event.type === "holiday"
      );

      if (holiday) {
        map.set(key, holiday.title);
      }
    });

    return map;
  }, [events]);

  const holidayKeys = useMemo(
    () => new Set(holidayTitles.keys()),
    [holidayTitles]
  );

  /* ==========================================
     MONTH LABEL
  ========================================== */

  const monthLabel = visibleMonth.toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric",
    }
  );

  const selectedDateLabel = selectedDate
    ? selectedDate.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Select a date";

  /* ==========================================
     ATTENDANCE SUMMARY
  ========================================== */

  const summary = useMemo(
    () =>
      summarizeAttendanceMonth(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth(),
        {
          holidayKeys,
          today,
        }
      ),
    [visibleMonth, holidayKeys, today]
  );

  const monthlyHolidayCount = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();

    return [...holidayKeys].filter((dateKey) => {
      const [dateYear, dateMonth] =
        dateKey.split("-").map(Number);

      return (
        dateYear === year &&
        dateMonth === month + 1
      );
    }).length;
  }, [holidayKeys, visibleMonth]);

  /* ==========================================
     LEGEND
  ========================================== */

  const legendItems: CalendarLegendItem[] = useMemo(
    () => [
      ...ATTENDANCE_STATUSES.map((status) => ({
        color: ATTENDANCE_META[status].color,
        label: ATTENDANCE_META[status].label,
        note: ATTENDANCE_META[status].note,
      })),
      {
        color: CALENDAR_TONES.green.dot,
        label: "Late Present",
        note: `(${LATE_CORNER_LABEL} in the corner · still present)`,
      },
      {
        color: CALENDAR_TONES[HOLIDAY_TONE].dot,
        label: "Holiday",
        note: "(Company holiday)",
      },
    ],
    []
  );

  /* ==========================================
     DAY INFORMATION
  ========================================== */

  const getDayInfo = (
    date: Date
  ): CalendarDayInfo | undefined => {
    const { status, isHoliday, late } =
      resolveAttendanceDay(date, {
        holidayKeys,
        today,
      });

    if (isHoliday) {
      const title =
        holidayTitles.get(toDateKey(date)) ??
        "Company holiday";

      return {
        tone: HOLIDAY_TONE,
        tooltip: `Company Holiday: ${title}`,
      };
    }

    if (!status) return undefined;

    const meta = ATTENDANCE_META[status];

    return {
      tone: meta.tone,
      tooltip: late
        ? `${meta.label} ${meta.note} · ${LATE_CORNER_LABEL} (late arrival)`
        : `${meta.label} ${meta.note}`,
      cornerLabel: late
        ? LATE_CORNER_LABEL
        : undefined,
    };
  };

  /* ==========================================
     SELECTED DAY DETAILS
  ========================================== */

  const selectedDayInfo = useMemo(() => {
    if (!selectedDate) return null;

    const resolved = resolveAttendanceDay(
      selectedDate,
      {
        holidayKeys,
        today,
      }
    );

    const holidayTitle =
      holidayTitles.get(toDateKey(selectedDate));

    if (resolved.isHoliday) {
      return {
        title: holidayTitle || "Company Holiday",
        description: "This date is marked as a company holiday.",
        tone: HOLIDAY_TONE,
      };
    }

    if (resolved.status) {
      const meta = ATTENDANCE_META[resolved.status];

      return {
        title: meta.label,
        description: resolved.late
          ? `${meta.note} · Late arrival`
          : meta.note,
        tone: meta.tone,
      };
    }

    return {
      title: "No attendance status",
      description:
        "No status is available for the selected date.",
      tone: null,
    };
  }, [selectedDate, holidayKeys, holidayTitles, today]);

  /* ==========================================
     RENDER
  ========================================== */

  return (
    <Box className="attendance-page">

      {/* PAGE HEADER */}

      <Box className="attendance-page-header">
        <Box className="attendance-header-icon">
          <FactCheckOutlinedIcon className="attendance-header-icon-svg" />
        </Box>

        <Box className="attendance-header-content">
          <Typography
            component="h2"
            className="attendance-title"
          >
            Attendance Calendar
          </Typography>

          <Typography className="attendance-subtitle">
            {isEmployee
              ? `Explore attendance dates and holidays, ${employeeName}.`
              : "View attendance statuses, company holidays, and monthly summaries."}
          </Typography>
        </Box>
      </Box>

      {/* MONTH OVERVIEW */}

      <Box className="attendance-overview-banner">
        <Box className="attendance-overview-left">
          <Box className="attendance-overview-icon">
            <CalendarMonthOutlinedIcon />
          </Box>

          <Box>
            <Typography className="attendance-overview-label">
              Viewing Month
            </Typography>

            <Typography className="attendance-overview-value">
              {monthLabel}
            </Typography>
          </Box>
        </Box>

        <Box className="attendance-overview-right">
          <EventAvailableOutlinedIcon />

          <Typography>
            {monthlyHolidayCount}{" "}
            {monthlyHolidayCount === 1
              ? "Holiday"
              : "Holidays"}
          </Typography>
        </Box>
      </Box>

      {/* DATA INFORMATION */}

      <Box className="attendance-role-info">
        <InfoOutlinedIcon />

        <Typography className="attendance-role-text">
          This calendar currently displays statuses
          from the configured attendance data.
          Live employee-specific attendance is not
          connected on this page.
          {canViewAllAttendance &&
            " HR/Admin access to individual records requires an attendance API and employee selection."}
        </Typography>
      </Box>

      {/* MAIN LAYOUT */}

      <Box className="attendance-main-layout">

        {/* CALENDAR */}

        <Box className="attendance-calendar">
          <MonthCalendar
            visibleMonth={visibleMonth}
            onMonthChange={setVisibleMonth}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            today={today}
            getDayInfo={getDayInfo}
          />
        </Box>

        {/* RIGHT PANEL */}

        <Box className="attendance-right-panel">

          {/* SUMMARY */}

          <Box className="attendance-card">
            <Box className="attendance-card-header">
              <Box>
                <Typography className="attendance-card-title">
                  Monthly Summary
                </Typography>

                <Typography className="attendance-card-subtitle">
                  {monthLabel}
                </Typography>
              </Box>

              <Chip
                size="small"
                label="Monthly"
                className="attendance-month-chip"
              />
            </Box>

            <Box className="attendance-card-content">
              <Box className="attendance-summary-grid">
                {ATTENDANCE_STATUSES.map((status) => {
                  const meta = ATTENDANCE_META[status];
                  const palette = CALENDAR_TONES[meta.tone];

                  return (
                    <Box
                      key={status}
                      className="attendance-summary-item"
                      style={
                        {
                          "--summary-bg": palette.bg,
                          "--summary-border": palette.border,
                          "--summary-text": palette.text,
                        } as CSSProperties
                      }
                    >
                      <Typography className="attendance-summary-count">
                        {summary[status]}
                      </Typography>

                      <Typography className="attendance-summary-label">
                        {meta.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>

          {/* SELECTED DATE */}

          <Box className="attendance-card">
            <Box className="attendance-card-header">
              <Box>
                <Typography className="attendance-card-title">
                  Selected Date
                </Typography>

                <Typography className="attendance-card-subtitle">
                  Calendar day information
                </Typography>
              </Box>
            </Box>

            <Box className="attendance-card-content">
              <Typography className="attendance-selected-date">
                {selectedDateLabel}
              </Typography>

              {selectedDayInfo && (
                <Box
                  className="attendance-selected-status"
                  style={
                    selectedDayInfo.tone
                      ? ({
                          "--selected-bg":
                            CALENDAR_TONES[selectedDayInfo.tone].bg,
                          "--selected-border":
                            CALENDAR_TONES[selectedDayInfo.tone].border,
                          "--selected-color":
                            CALENDAR_TONES[selectedDayInfo.tone].text,
                        } as CSSProperties)
                      : undefined
                  }
                >
                  <Typography className="attendance-selected-status-title">
                    {selectedDayInfo.title}
                  </Typography>

                  <Typography className="attendance-selected-status-description">
                    {selectedDayInfo.description}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* LEGEND */}

          <Box className="attendance-card">
            <Box className="attendance-card-header">
              <Typography className="attendance-card-title">
                Calendar Legend
              </Typography>
            </Box>

            <Box className="attendance-card-content attendance-legend-content">
              <CalendarLegend
                items={legendItems}
                layout="stacked"
              />
            </Box>
          </Box>

        </Box>
      </Box>
    </Box>
  );
}

export default Attendance;
