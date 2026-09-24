import { useMemo, useState, type CSSProperties } from "react";
import { Box, Typography } from "@mui/material";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";

import MonthCalendar from "../../Components/Calendar/MonthCalendar";
import CalendarLegend from "../../Components/Calendar/CalendarLegend";

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
import { CALENDAR_TONES } from "../../Components/Calendar/calendarTheme";

import { useCalendarEvents } from "../../context/CalendarEventsContext";
import { toDateKey } from "../../data/calendarEvents";

import {
  HR,
  ADMIN,
  EMPLOYEE,
} from "../../data/permissions";

import "./Attendance.css";

function Attendance() {
  const today = useMemo(() => new Date(), []);

  /* =====================================
     LOGGED IN USER
  ===================================== */

  const storedUser = localStorage.getItem("loggedInUser");

  let loggedInUser: any = null;

  if (storedUser) {
    try {
      loggedInUser = JSON.parse(storedUser);
    } catch {
      loggedInUser = null;
    }
  }

  const userType = Number(loggedInUser?.userType);

  const employeeId =
    loggedInUser?.employeeId ??
    loggedInUser?.userId ??
    "";

  const employeeName =
    loggedInUser?.name ??
    "Employee";

  const isHR = userType === HR;
  const isAdmin = userType === ADMIN;
  const isEmployee = userType === EMPLOYEE;

  const canViewAllAttendance = isHR || isAdmin;

  /* =====================================
     COMPANY CALENDAR EVENTS
  ===================================== */

  const { events } = useCalendarEvents();

  /* =====================================
     CALENDAR STATE
  ===================================== */

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

  /* =====================================
     HOLIDAYS
  ===================================== */

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

  /* =====================================
     MONTH LABEL
  ===================================== */

  const monthLabel = visibleMonth.toLocaleDateString(
    "en-US",
    {
      month: "short",
      year: "numeric",
    }
  );

  /* =====================================
     ATTENDANCE SUMMARY
  ===================================== */

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
    [
      visibleMonth,
      holidayKeys,
      today,
    ]
  );

  /* =====================================
     LEGEND
  ===================================== */

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

  /* =====================================
     DAY INFORMATION
  ===================================== */

  const getDayInfo = (
    date: Date
  ): CalendarDayInfo | undefined => {
    const {
      status,
      isHoliday,
      late,
    } = resolveAttendanceDay(date, {
      holidayKeys,
      today,
    });

    if (isHoliday) {
      const title =
        holidayTitles.get(toDateKey(date)) ??
        "Company holiday";

      return {
        tone: HOLIDAY_TONE,
        tooltip: `🎉 ${title}`,
      };
    }

    if (!status) {
      return undefined;
    }

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

  return (
    <Box className="attendance-page">
      {/* ===============================
          PAGE HEADER
      =============================== */}

      <Box className="attendance-page-header">
        <Box className="attendance-header-icon">
          <FactCheckOutlinedIcon className="attendance-header-icon-svg" />
        </Box>

        <Box className="attendance-header-content">
          <Typography className="attendance-title">
            Attendance
          </Typography>

          <Typography className="attendance-subtitle">
            {isEmployee
              ? `View your attendance record, ${employeeName}.`
              : "View employee attendance, leaves and working days."}
          </Typography>
        </Box>
      </Box>

      {/* Temporary role information
          Can be removed later */}

      {isEmployee && (
        <Box className="attendance-role-info attendance-role-info-employee">
          <Typography className="attendance-role-text attendance-role-text-employee">
            Showing attendance for{" "}
            <strong>{employeeName}</strong>
            {employeeId ? ` (${employeeId})` : ""}
          </Typography>
        </Box>
      )}

      {canViewAllAttendance && (
        <Box className="attendance-role-info attendance-role-info-admin">
          <Typography className="attendance-role-text attendance-role-text-admin">
            You have permission to view attendance records
            for all employees.
          </Typography>
        </Box>
      )}

      {/* ===============================
          MAIN LAYOUT
      =============================== */}

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

        {/* ===============================
            RIGHT PANEL
        =============================== */}

        <Box className="attendance-right-panel">
          {/* ===============================
              SUMMARY
          =============================== */}

          <Box className="attendance-card">
            <Box className="attendance-card-header">
              <Typography className="attendance-card-title">
                Attendance Summary ({monthLabel})
              </Typography>
            </Box>

            <Box className="attendance-card-content attendance-summary-content">
              <Box className="attendance-summary-grid">
                {ATTENDANCE_STATUSES.map((status) => {
                  const meta = ATTENDANCE_META[status];
                  const palette = CALENDAR_TONES[meta.tone];

                  return (
                    <Box
                      key={status}
                      className="attendance-summary-item"
                      style={{
                        "--summary-bg": palette.bg,
                        "--summary-border": palette.border,
                        "--summary-text": palette.text,
                      } as CSSProperties}
                    >
                      <Typography
                        className="attendance-summary-count"
                      >
                        {summary[status]}
                      </Typography>

                      <Typography
                        className="attendance-summary-label"
                      >
                        {meta.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>

          {/* ===============================
              LEGEND
          =============================== */}

          <Box className="attendance-card">
            <Box className="attendance-card-header">
              <Typography className="attendance-card-title">
                Legend
              </Typography>
            </Box>

            <Box className="attendance-card-content">
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
