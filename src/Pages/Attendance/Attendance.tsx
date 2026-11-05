
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";

import {
  Alert,
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
  type AttendanceStatus,
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

import { EMPLOYEE } from "../../data/permissions";
import api from "../../api/axiosInstance";

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

interface AttendanceApiRecord {
  day: string;
  employeeName?: string;
  employeeId?: string;
  attendanceStatus?: string;
  finalizedAt?: string | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  actualWorkingSeconds?: number;
  approvedPermissionHours?: number;
  approvedPermissionRequestedHours?: number;
  requestedPermissionHours?: number;
  permissionStatus?: string | null;
  permissionRequests?: {
    totalHours: number;
    fromTime: string | null;
    toTime: string | null;
    status: string;
  }[];
  totalCreditedWorkingSeconds?: number;
  monthlyPermissionUsedHours?: number;
  monthlyPermissionRemainingHours?: number;
}

const getTodayInIndia = (): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const formatAttendanceTime = (value?: string | null): string => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not recorded"
    : date.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "2-digit",
      });
};

const formatWorkingDuration = (seconds?: number): string => {
  const totalMinutes = Math.floor(Math.max(0, seconds || 0) / 60);
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
};

const formatPermissionHours = (hours?: number): string => {
  const totalMinutes = Math.round(Math.max(0, hours || 0) * 60);
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
};

const formatPermissionRequests = (
  requests?: AttendanceApiRecord["permissionRequests"]
): string =>
  requests?.length
    ? requests
        .map(
          (request) =>
            `${formatPermissionHours(request.totalHours)} ${request.status}`
        )
        .join(", ")
    : "None";

const toCalendarStatus = (
  status: string | undefined
): AttendanceStatus | null => {
  switch (status) {
    case "Present":
      return "present";
    case "Half-Day Present":
      return "halfDay";
    case "Late Present":
    case "Present Late":
      return "present";
    case "Early Departure":
    case "Absent":
      return "absent";
    default:
      return null;
  }
};

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
  const todayInIndia = getTodayInIndia();

  const loggedInUser = useMemo(
    () => readLoggedInUser(),
    []
  );

  const userType = Number(loggedInUser?.userType);

  const employeeName =
    loggedInUser?.name || "Employee";

  const isEmployee = userType === EMPLOYEE;

  /* ==========================================
     COMPANY CALENDAR EVENTS
  ========================================== */

  const { events } = useCalendarEvents();
  const [liveAttendance, setLiveAttendance] =
    useState<AttendanceApiRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] =
    useState(isEmployee);
  const [attendanceError, setAttendanceError] = useState("");

  useEffect(() => {
    if (!isEmployee) return;

    let cancelled = false;
    setAttendanceLoading(true);
    setAttendanceError("");

    const loadAttendance = async () => {
      try {
        const response = await api.post<{ data?: AttendanceApiRecord[] }>(
          "/attendance/history",
          { user_id: "", date: "" }
        );
        const records = response.data?.data;
        if (!Array.isArray(records)) {
          throw new Error("Attendance history response was invalid.");
        }
        if (!cancelled) setLiveAttendance(records);
      } catch (error: unknown) {
        console.error("Unable to load attendance calendar:", error);
        if (!cancelled) {
          setAttendanceError(
            "Unable to load live attendance. Please refresh the page and try again."
          );
        }
      } finally {
        if (!cancelled) setAttendanceLoading(false);
      }
    };

    const refreshOnFocus = () => {
      if (document.visibilityState === "visible") {
        void loadAttendance();
      }
    };

    void loadAttendance();
    const refreshInterval = window.setInterval(
      () => void loadAttendance(),
      30_000
    );
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnFocus);

    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, [isEmployee]);

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

  const attendanceStatusByDate = useMemo(
    () =>
      Object.fromEntries(
        liveAttendance
          .filter(
            (record) =>
              record.attendanceStatus &&
              (record.day !== todayInIndia || record.finalizedAt)
          )
          .map((record) => [record.day, record.attendanceStatus as string])
      ) as Record<string, string>,
    [liveAttendance, todayInIndia]
  );

  const attendanceRecordByDate = useMemo(
    () =>
      Object.fromEntries(
        liveAttendance.map((record) => [record.day, record])
      ) as Record<string, AttendanceApiRecord>,
    [liveAttendance]
  );

  const selectedAttendanceRecord = selectedDate
    ? attendanceRecordByDate[toDateKey(selectedDate)]
    : undefined;

  const liveAttendanceRecords = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(attendanceStatusByDate).flatMap(([day, status]) => {
          const calendarStatus = toCalendarStatus(status);
          return calendarStatus ? [[day, calendarStatus]] : [];
        })
      ) as Record<string, AttendanceStatus>,
    [attendanceStatusByDate]
  );

  const liveLateKeys = useMemo(
    () =>
      new Set(
        Object.entries(attendanceStatusByDate)
          .filter(([, status]) =>
            ["Late Present", "Present Late"].includes(status)
          )
          .map(([day]) => day)
      ),
    [attendanceStatusByDate]
  );

  const attendanceLookupOptions = useMemo(
    () => ({
      holidayKeys,
      today,
      fillPastWorkingDays: !isEmployee,
      attendanceRecords: isEmployee ? liveAttendanceRecords : undefined,
      lateKeys: liveLateKeys,
    }),
    [
      holidayKeys,
      today,
      isEmployee,
      liveAttendanceRecords,
      liveLateKeys,
    ]
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
        attendanceLookupOptions
      ),
    [visibleMonth, attendanceLookupOptions]
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
      resolveAttendanceDay(date, attendanceLookupOptions);

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
        ? `${attendanceStatusByDate[toDateKey(date)] || meta.label} ${meta.note} · ${LATE_CORNER_LABEL} (late arrival)`
        : `${attendanceStatusByDate[toDateKey(date)] || meta.label} ${meta.note}`,
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
      attendanceLookupOptions
    );

    const holidayTitle =
      holidayTitles.get(toDateKey(selectedDate));
    const savedStatus =
      attendanceStatusByDate[toDateKey(selectedDate)];
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
        title:
          savedStatus === "Early Departure"
            ? "Early Departure"
            : savedStatus || meta.label,
        description:
          savedStatus === "Early Departure"
            ? "Checkout was before 4:30 PM without approved permission covering the missed time."
            : resolved.late
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
  }, [
    selectedDate,
    attendanceLookupOptions,
    holidayTitles,
    attendanceStatusByDate,
  ]);

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
          {isEmployee
            ? attendanceLoading
              ? "Loading your live attendance records..."
              : "Today's attendance is finalized by the 10:00 PM IST job and appears in the calendar after it runs."
            : "This calendar displays configured attendance data. HR/Admin individual attendance selection is not available here."}
        </Typography>
      </Box>

      {attendanceError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {attendanceError}
        </Alert>
      )}

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

              {isEmployee && selectedAttendanceRecord && (
                <Box className="attendance-calculation-details">
                  {[
                    ["Employee Name", selectedAttendanceRecord.employeeName || employeeName],
                    ["Employee ID", selectedAttendanceRecord.employeeId || loggedInUser?.employeeId || "Not recorded"],
                    ["Actual Check-In", formatAttendanceTime(selectedAttendanceRecord.checkInTime)],
                    ["Actual Check-Out", formatAttendanceTime(selectedAttendanceRecord.checkOutTime)],
                    ["Total Actual Working Hours", formatWorkingDuration(selectedAttendanceRecord.actualWorkingSeconds)],
                    ["Requested Permission Duration", formatPermissionHours(selectedAttendanceRecord.requestedPermissionHours)],
                    ["Permission Requests", formatPermissionRequests(selectedAttendanceRecord.permissionRequests)],
                    ["Permission Status", selectedAttendanceRecord.permissionStatus || "None"],
                    ["Approved Permission Hours", formatPermissionHours(selectedAttendanceRecord.approvedPermissionRequestedHours)],
                    ["Eligible Approved Permission Hours", formatPermissionHours(selectedAttendanceRecord.approvedPermissionHours)],
                    ["Total Credited Working Hours", formatWorkingDuration(selectedAttendanceRecord.totalCreditedWorkingSeconds)],
                    ["Monthly Permission Allowance", "4h 0m"],
                    ["Monthly Permission Used", formatPermissionHours(selectedAttendanceRecord.monthlyPermissionUsedHours)],
                    ["Monthly Permission Remaining", formatPermissionHours(selectedAttendanceRecord.monthlyPermissionRemainingHours)],
                    ["Final Attendance Status", selectedAttendanceRecord.attendanceStatus || "Pending"],
                  ].map(([label, value]) => (
                    <Box className="attendance-detail-row" key={label}>
                      <Typography>{label}</Typography>
                      <Typography>{value}</Typography>
                    </Box>
                  ))}
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
