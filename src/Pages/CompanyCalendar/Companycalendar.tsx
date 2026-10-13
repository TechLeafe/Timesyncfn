import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

import api from "../../api/axiosInstance";

import "./CompanyCalendar.css";

type AttendanceMark = "P" | "PL" | "A" | "L" | "LP" | "PD" | "RJ";

type Holiday = {
  _id?: string;
  holidayName: string;
  holidayDate: string;
  holidayType?: string;
  description?: string;
  status?: string;
};

type AttendanceRecord = Record<string, unknown>;
type ApprovedLeave = Record<string, unknown> & {
  user_id?: string;
  fromDate?: string | null;
  toDate?: string | null;
  leaveType?: string;
  compOffDate?: string | null;
  totalHours?: number | null;
};
type ApiResponse<T> = { success?: boolean; message?: string; data?: T };
type LoggedInUser = { userId?: string; employeeId?: string; email?: string };

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MARK_NAMES: Record<AttendanceMark, string> = {
  P: "Present",
  PL: "Present Late",
  A: "Absent",
  L: "Leave",
  LP: "Loss of Pay",
  PD: "Pending",
  RJ: "Rejected",
};

function dateKey(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeDate(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date) return dateKey(value);
  const str = String(value).trim();
  const iso = str.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (iso) return iso;
  const date = new Date(str);
  return Number.isNaN(date.getTime()) ? "" : dateKey(date);
}

function displayDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
}

function readField(record: AttendanceRecord, names: string[]): string {
  for (const name of names) {
    const value = record[name];
    if (value !== null && value !== undefined && String(value).trim()) {
      return String(value).trim();
    }
  }
  return "";
}

function loggedInUser(): LoggedInUser | null {
  try {
    const value = localStorage.getItem("loggedInUser");
    return value ? (JSON.parse(value) as LoggedInUser) : null;
  } catch {
    return null;
  }
}

function belongsToUser(record: AttendanceRecord, user: LoggedInUser): boolean {
  const userId = String(user.userId ?? "").trim();
  const employeeId = String(user.employeeId ?? "").trim();
  const email = String(user.email ?? "").trim().toLowerCase();
  const recordUserId = readField(record, ["user_id", "userId"]);
  const recordEmployeeId = readField(record, ["employeeId", "employee_id"]);
  const recordEmail = readField(record, ["email", "employeeEmail"]).toLowerCase();
  return Boolean(
    (userId && (userId === recordUserId || userId === recordEmployeeId)) ||
      (employeeId && (employeeId === recordEmployeeId || employeeId === recordUserId)) ||
      (email && email === recordEmail)
  );
}

function getRecordDate(record: AttendanceRecord): string {
  return normalizeDate(readField(record, [
    "day", "date", "attendanceDate", "attendance_date", "createdAt", "created_at",
  ]));
}

function getAttendanceMark(
  record: AttendanceRecord,
  approvedPermissionHours: number
): AttendanceMark | null {
  const approvalStatus = readField(record, ["approvalStatus"]).toLowerCase();
  const attendanceStatus = readField(record, ["attendanceStatus", "attendance_status"])
    .toLowerCase();
  if (approvalStatus === "pending") return "PD";
  if (approvalStatus === "rejected") return "RJ";
  if (approvalStatus === "approved") {
    if (attendanceStatus === "present late") return "PL";
    if (attendanceStatus === "absent") return "A";
    if (attendanceStatus === "present") return "P";
  }

  const status = readField(record, ["attendanceStatus", "attendance_status", "status", "remark"])
    .toLowerCase().replace(/[-_]/g, " ");
  const leaveType = readField(record, ["leaveType", "leave_type"]).toLowerCase();
  const checkIn = readField(record, [
    "checkInTime", "check_in_time", "checkIn", "check_in", "inTime", "clockInTime",
  ]);
  const checkOut = readField(record, [
    "checkOutTime", "check_out_time", "checkOut", "check_out", "outTime", "clockOutTime",
  ]);

  if (["loss of pay", "lop", "lp", "unpaid leave"].includes(status) ||
      ["loss of pay", "lop", "lp", "unpaid leave"].includes(leaveType)) return "LP";
  if (checkIn || checkOut) {
    const checkInDate = checkIn ? new Date(checkIn) : null;
    const indiaTimeParts = checkInDate && !Number.isNaN(checkInDate.getTime())
      ? new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hourCycle: "h23",
        }).formatToParts(checkInDate)
      : [];
    const indiaHour = Number(
      indiaTimeParts.find((part) => part.type === "hour")?.value
    );
    const indiaMinute = Number(
      indiaTimeParts.find((part) => part.type === "minute")?.value
    );
    const indiaSecond = Number(
      indiaTimeParts.find((part) => part.type === "second")?.value
    );
    const lateArrival =
      indiaHour > 11 ||
      (indiaHour === 11 && (indiaMinute > 0 || indiaSecond > 0));
    if (lateArrival) return "PL";

    const workingSeconds = Number(
      record.totalWorkingSeconds ?? record.currentWorkingSeconds ?? 0
    );
    const creditedHours =
      (Number.isFinite(workingSeconds) ? workingSeconds : 0) / 3600 +
      approvedPermissionHours;

    if (creditedHours >= 9) return "P";
    if (creditedHours >= 7) return "PL";
    return "P";
  }
  if (["leave", "on leave", "approved leave", "paid leave", "casual leave", "sick leave"].includes(status) || leaveType) return "L";
  if (["present", "checked in", "checked out"].includes(status)) return "P";
  if (["absent", "a", "not present"].includes(status)) return "A";
  return null;
}

function errorText(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error ? error.message : fallback;
}

/* =========================================
   PAGE-PEEL CORNER (INLINE SVG)
   ========================================= */

const PEEL_COLORS: Record<AttendanceMark, { back: [string, string, string]; flap: [string, string, string] }> = {
  P:  { back: ["#06600e", "#0e9a1b", "#0a7a15"], flap: ["#74cf80", "#4aa052", "#62bd6c"] },
  PL: { back: ["#a35400", "#e39418", "#bd6b08"], flap: ["#ffd78c", "#f0b84e", "#f6ca70"] },
  A:  { back: ["#111111", "#3a3a3a", "#222222"], flap: ["#b5b5b5", "#7a7a7a", "#9a9a9a"] },
  L:  { back: ["#1424a2", "#3659e5", "#2a45c4"], flap: ["#a9b6ff", "#6f85f0", "#8d9eff"] },
  LP: { back: ["#4e1495", "#8b48cc", "#6b2fb0"], flap: ["#d3b4f5", "#a574d9", "#bd94ec"] },
  PD: { back: ["#526273", "#8090a0", "#68798a"], flap: ["#d7dfe6", "#aebbc7", "#c3ced8"] },
  RJ: { back: ["#8e2e32", "#c35156", "#a43a40"], flap: ["#f2b7b9", "#d98286", "#e69b9e"] },
};

const FLAP_PATH = "M243 0 L0 195 C40 220 78 240 72 285 Z";
const BACK_PATH = "M243 0 L72 285 C70 305 60 318 35 320 L243 320 Z";

function PagePeel({ mark }: { mark: AttendanceMark }) {
  const c = PEEL_COLORS[mark];
  const id = `ccp-${mark}`;
  return (
    <svg className="cc-peel" viewBox="0 0 243 320" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-back`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={c.back[0]} />
          <stop offset=".7" stopColor={c.back[1]} />
          <stop offset="1" stopColor={c.back[2]} />
        </linearGradient>
        <linearGradient id={`${id}-flap`} gradientUnits="userSpaceOnUse" x1="10" y1="225" x2="157" y2="142">
          <stop offset="0" stopColor={c.flap[0]} />
          <stop offset=".7" stopColor={c.flap[1]} />
          <stop offset="1" stopColor={c.flap[2]} />
        </linearGradient>
        <filter id={`${id}-blur`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      {/* soft shadow the flap casts on the white page */}
      <path d={FLAP_PATH} transform="translate(-6 -5)" fill="#000" opacity=".4" filter={`url(#${id}-blur)`} />
      <path d={BACK_PATH} fill={`url(#${id}-back)`} />
      <path d={FLAP_PATH} fill={`url(#${id}-flap)`} />
    </svg>
  );
}

/* =========================================
   HOLIDAY ICON SELECTOR
   ========================================= */

function HolidayIcon({ name }: { name: string }) {
  const holiday = name.toLowerCase();

  const icon: ReactNode = pickHolidayIcon(holiday);

  return (
    <span className="cc-holiday-symbol" aria-hidden="true">
      {icon}
    </span>
  );
}

export default function CompanyCalendar() {
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDay, setSelectedDay] = useState(() => dateKey(new Date()));
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceMark>>({});
  const [approvedLeaveDays, setApprovedLeaveDays] = useState<Record<string, true>>({});
  const [approvedPermissionHours, setApprovedPermissionHours] = useState<Record<string, number>>({});
  const [canMarkAbsences, setCanMarkAbsences] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attendanceWarning, setAttendanceWarning] = useState("");
  const today = dateKey(new Date());

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    setError("");
    setAttendanceWarning("");
    const [holidayResponse, attendanceResponse, leaveResponse] = await Promise.allSettled([
      api.post<ApiResponse<Holiday[]>>("/holidays/list", { companyYear: "", holidayType: "" }),
      api.post<ApiResponse<AttendanceRecord[]>>("/attendance/history", { user_id: "", date: "" }),
      api.post<ApiResponse<ApprovedLeave[]>>("/leave-apply/list", { status: "Approved", businessYear: "" }),
    ]);
    let holidaysLoaded = false;
    let attendanceLoaded = false;
    let leavesLoaded = false;
    let attendanceRecords: AttendanceRecord[] = [];
    let permissionHoursByDay: Record<string, number> = {};

    if (holidayResponse.status === "fulfilled") {
      const result = holidayResponse.value.data;
      if (result.success === false || !Array.isArray(result.data)) {
        setError(result.message || "Unable to load company holidays.");
        setHolidays([]);
      } else {
        setHolidays(result.data.filter((item) => (item.status || "Active").toLowerCase() === "active"));
        holidaysLoaded = true;
      }
    } else {
      setError(errorText(holidayResponse.reason, "Unable to load company holidays."));
      setHolidays([]);
    }

    if (attendanceResponse.status === "fulfilled") {
      const result = attendanceResponse.value.data;
      const user = loggedInUser();
      if (result.success === false || !Array.isArray(result.data)) {
        setAttendanceWarning(result.message || "Attendance records are unavailable.");
        setAttendance({});
      } else if (!user || (!user.userId && !user.employeeId && !user.email)) {
        setAttendanceWarning("Logged-in employee details are unavailable.");
        setAttendance({});
      } else {
        attendanceRecords = result.data.filter((record) =>
          belongsToUser(record, user)
        );
        attendanceLoaded = true;
      }
    } else {
      setAttendanceWarning((current) => [
        current,
        errorText(attendanceResponse.reason, "Attendance records are unavailable."),
      ].filter(Boolean).join(" "));
      setAttendance({});
    }

    if (leaveResponse.status === "fulfilled") {
      const result = leaveResponse.value.data;
      if (result.success === false || !Array.isArray(result.data)) {
        setAttendanceWarning((current) => [
          current,
          result.message || "Approved leave records are unavailable; absences cannot be confirmed.",
        ].filter(Boolean).join(" "));
        setApprovedLeaveDays({});
        setApprovedPermissionHours({});
      } else {
        const leaveDays: Record<string, true> = {};
        const permissionHours: Record<string, number> = {};
        const user = loggedInUser();
        const ownLeaves = user
          ? result.data.filter((leave) => belongsToUser(leave, user))
          : [];
        for (const leave of ownLeaves) {
          const leaveType = String(leave.leaveType || "").toLowerCase();
          if (leaveType === "permission") {
            const permissionDate = normalizeDate(leave.fromDate);
            const hours = Number(leave.totalHours || 0);
            if (permissionDate && Number.isFinite(hours) && hours > 0) {
              permissionHours[permissionDate] =
                (permissionHours[permissionDate] || 0) + hours;
            }
            continue;
          }

          const compOffDate = leaveType === "comp_off"
            ? normalizeDate(leave.compOffDate || leave.fromDate)
            : "";
          const startKey = compOffDate || normalizeDate(leave.fromDate);
          const endKey = compOffDate || normalizeDate(leave.toDate || leave.fromDate);
          if (!startKey || !endKey) continue;

          const current = new Date(`${startKey}T12:00:00`);
          const end = new Date(`${endKey}T12:00:00`);
          while (current <= end) {
            leaveDays[dateKey(current)] = true;
            current.setDate(current.getDate() + 1);
          }
        }
        setApprovedLeaveDays(leaveDays);
        setApprovedPermissionHours(permissionHours);
        permissionHoursByDay = permissionHours;
        leavesLoaded = true;
      }
    } else {
      setAttendanceWarning((current) => [
        current,
        errorText(leaveResponse.reason, "Approved leave records are unavailable; absences cannot be confirmed."),
      ].filter(Boolean).join(" "));
      setApprovedLeaveDays({});
      setApprovedPermissionHours({});
    }

    setCanMarkAbsences(
      holidaysLoaded && attendanceLoaded && leavesLoaded
    );
    const marks: Record<string, AttendanceMark> = {};
    for (const record of attendanceRecords) {
      const key = getRecordDate(record);
      if (!key) continue;
      const mark = getAttendanceMark(
        record,
        permissionHoursByDay[key] || 0
      );
      if (mark) marks[key] = mark;
    }
    setAttendance(marks);
    setLoading(false);
  }, []);

  useEffect(() => { void loadCalendar(); }, [loadCalendar]);

  const holidayByDay = useMemo(() => {
    const map = new Map<string, Holiday[]>();
    for (const holiday of holidays) {
      const key = normalizeDate(holiday.holidayDate);
      if (key) map.set(key, [...(map.get(key) || []), holiday]);
    }
    return map;
  }, [holidays]);

  const calendarDays = useMemo(() => {
    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    const count = Math.ceil((first.getDay() + new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()) / 7) * 7;
    return Array.from({ length: count }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      return { date, key: dateKey(date), inMonth: date.getMonth() === visibleMonth.getMonth() };
    });
  }, [visibleMonth]);

  const monthLabel = visibleMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const monthPrefix = `${visibleMonth.getFullYear()}-${String(visibleMonth.getMonth() + 1).padStart(2, "0")}-`;
  const monthHolidays = holidays.filter((item) => normalizeDate(item.holidayDate).startsWith(monthPrefix));
  const selectedHolidays = holidayByDay.get(selectedDay) || [];
  const getMark = (key: string, date: Date): AttendanceMark | undefined => {
    if (key >= today) return undefined;
    const recordedMark = attendance[key];
    if (recordedMark) return recordedMark;
    if (approvedLeaveDays[key]) return "L";

    const isWeekday = date.getDay() !== 0 && date.getDay() !== 6;
    if (
      canMarkAbsences &&
      key < today &&
      isWeekday &&
      !holidayByDay.has(key) &&
      !approvedLeaveDays[key]
    ) {
      return "A";
    }
    return undefined;
  };

  const selectedDate = new Date(`${selectedDay}T12:00:00`);
  const selectedMark = getMark(selectedDay, selectedDate);

  function moveMonth(offset: number) {
    const next = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
    setVisibleMonth(next);
    setSelectedDay(dateKey(next));
  }

  return (
    <div className="company-calendar-page">
      <header className="cc-page-header">
        <div className="cc-heading-icon"><CalendarDays size={21} /></div>
        <div className="cc-heading-text">
          <h1>Company Calendar</h1>
          <p>Company holidays and your attendance at a glance.</p>
        </div>
        <button className="cc-refresh" type="button" onClick={() => void loadCalendar()} disabled={loading}>
          <RefreshCw size={15} /><span>Refresh</span>
        </button>
      </header>

      {error && <p className="cc-alert" role="alert">{error}</p>}
      {attendanceWarning && <p className="cc-alert cc-alert--warning" role="status">{attendanceWarning}</p>}

      <section className="cc-calendar-card" aria-label="Company month calendar">
        <div className="cc-calendar-header">
          <div className="cc-month-controls">
            <button type="button" title="Previous month" aria-label="Previous month" onClick={() => moveMonth(-1)}><ChevronLeft size={21} /></button>
            <h2>{monthLabel}</h2>
            <button type="button" title="Next month" aria-label="Next month" onClick={() => moveMonth(1)}><ChevronRight size={21} /></button>
          </div>
          <span className="cc-month-summary">{loading ? "Loading..." : `${monthHolidays.length} holiday${monthHolidays.length === 1 ? "" : "s"} this month`}</span>
        </div>

        <div className="cc-calendar-body">
          <div className="cc-weekdays" aria-hidden="true">
            {DAYS.map((day) => (
              <span key={day} className={day === "SUN" ? "cc-weekday-sunday" : day === "SAT" ? "cc-weekday-saturday" : ""}>{day}</span>
            ))}
          </div>

          <div className="cc-grid">
            {calendarDays.map(({ date, key, inMonth }) => {
              const weekDay = date.getDay();
              const dayHolidays = holidayByDay.get(key) || [];
              const hasHoliday = inMonth && dayHolidays.length > 0;
              const mark = inMonth && key < today && !hasHoliday && weekDay !== 0 && weekDay !== 6
                ? getMark(key, date)
                : undefined;
              const description = dayHolidays.length > 0 ? dayHolidays.map((h) => h.holidayName).join(", ") : mark ? MARK_NAMES[mark] : "";
              const classes = [
                "cc-day", !inMonth && "cc-day-outside", weekDay === 0 && "cc-day-sunday",
                weekDay === 6 && "cc-day-saturday", hasHoliday && "cc-day-holiday",
                mark && `cc-day-mark-${mark.toLowerCase()}`,
                key === today && "cc-day-today", key === selectedDay && "cc-day-selected",
              ].filter(Boolean).join(" ");
              return (
                <button
                  type="button" key={key} className={classes} aria-pressed={key === selectedDay}
                  title={`${date.toDateString()}${description ? ` — ${description}` : ""}`}
                  onClick={() => {
                    setSelectedDay(key);
                    if (!inMonth) setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                  }}
                >
                  <span className="cc-day-number">{date.getDate()}</span>
                  {hasHoliday && (
                    <span className="cc-holiday-content">
                      <HolidayIcon name={dayHolidays[0].holidayName} />
                      <span className="cc-holiday-name">{dayHolidays[0].holidayName}</span>
                    </span>
                  )}
                  {mark && (
                    <span className={`cc-corner cc-corner--${mark.toLowerCase()}`} aria-label={MARK_NAMES[mark]}>
                      <PagePeel mark={mark} />
                      <span>{mark}</span>
                    </span>
                  )}
                  {key === today && <span className="cc-today-dot" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          <div className="cc-legend">
            <span><i className="cc-legend-color cc-legend-color--sunday" />Sunday</span>
            <span><i className="cc-legend-color cc-legend-color--saturday" />Saturday</span>
            <span><i className="cc-legend-color cc-legend-color--holiday" />Company Holiday</span>
            <span><i className="cc-legend-color cc-legend-color--present" />P – Present</span>
            <span><i className="cc-legend-color cc-legend-color--absent" />A – Absent</span>
            <span><i className="cc-legend-color cc-legend-color--leave" />L – Leave</span>
            <span><i className="cc-legend-color cc-legend-color--pl" />PL – Present Late</span>
            <span><i className="cc-legend-color cc-legend-color--lp" />LP – Loss of Pay</span>
            <span><i className="cc-legend-color cc-legend-color--pending" />Pending approval</span>
            <span><i className="cc-legend-color cc-legend-color--rejected" />Rejected</span>
          </div>
        </div>
      </section>

      <section className="cc-selection-card" aria-label="Selected date details">
        <div className="cc-selection-header">
          <div><span>SELECTED DATE</span><h3>{displayDate(selectedDay)}</h3></div>
          {selectedDay === today && <span className="cc-today-pill">Today</span>}
        </div>
        <div className="cc-selection-body">
          {selectedHolidays.length ? selectedHolidays.map((h, i) => (
            <div className="cc-selected-holiday" key={h._id || i}>
              <HolidayIcon name={h.holidayName} />
              <div><strong>{h.holidayName}</strong><p>{h.description || `${h.holidayType || "Company"} holiday`}</p></div>
            </div>
          )) : selectedMark ? (
            <div className="cc-selected-attendance">
              <strong>{MARK_NAMES[selectedMark]}</strong>
              <span>
                {selectedMark === "PD"
                  ? "This attendance is waiting for HR/Admin approval."
                  : selectedMark === "RJ"
                    ? "HR/Admin rejected this attendance entry."
                    : selectedMark === "L"
                      ? "Approved leave is recorded for this date."
                      : "Attendance status is approved for your employee account."}
              </span>
            </div>
          ) : (
            <p className="cc-selection-empty">No company holiday or confirmed attendance status for this date.</p>
          )}
        </div>
      </section>
    </div>
  );
}

/* =========================================
   FESTIVAL ICONS — INLINE SVG
   No PNG files required
   ========================================= */

function GandhiIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <g stroke="#ff6800" strokeWidth="2.8"
         strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 59v-7c0-8 7-12 15-12s15 4 15 12v7" />
        <path d="M23 41l9 9 9-9M27 48l5 6 5-6" />
        <path d="M20 22c0-12 5-18 12-18s12 6 12 18" />
        <path d="M19 23c-5-5-8 2-5 7l6 3M45 23c5-5 8 2 5 7l-6 3" />
        <path d="M20 19c0-11 5-15 12-15s12 4 12 15" />
        <circle cx="25" cy="26" r="6" />
        <circle cx="39" cy="26" r="6" />
        <path d="M31 26h2M19 25h-3M45 25h3" />
        <path d="M29 35c2 2 4 2 6 0M27 39c3 2 7 2 10 0" />
        <path d="M22 14c3-4 17-4 20 0" />
      </g>
    </svg>
  );
}

function VijayDasamiIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="#ff6800" aria-hidden="true">
      <path d="M32 7c-7 10-9 19 0 30 9-11 7-20 0-30Z" />
      <path d="M17 13c-3 13 0 22 11 27-1-12-5-21-11-27Z" />
      <path d="M47 13c3 13 0 22-11 27 1-12 5-21 11-27Z" />
      <path d="M7 24c1 13 8 21 21 22-5-11-12-17-21-22Z" />
      <path d="M57 24c-1 13-8 21-21 22 5-11 12-17 21-22Z" />
      <path d="M12 46c12 9 28 11 40 0-7 12-33 16-40 0Z" />
    </svg>
  );
}

function AyuthaPoojaIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="#ff6800" aria-hidden="true">
      <path d="M26 7h12l-2 9h-8L26 7Z" />
      <path d="M23 17h18l3 27H20l3-27Z" />
      <path d="M18 44h28v7H18z" />
      <path d="M12 51h40v9H12z" />
      <path d="M6 47h8v13H6zM50 47h8v13h-8z" />
      <path d="M30 45h4v15h-4z" />
      <g fill="#ffffff">
        <rect x="28" y="20" width="2" height="5" />
        <rect x="34" y="20" width="2" height="5" />
        <rect x="25" y="29" width="2" height="5" />
        <rect x="31" y="29" width="2" height="5" />
        <rect x="37" y="29" width="2" height="5" />
        <rect x="23" y="38" width="2" height="5" />
        <rect x="30" y="38" width="3" height="5" />
        <rect x="39" y="38" width="2" height="5" />
      </g>
      <path d="M29 3h6v4h-6z" />
    </svg>
  );
}

function CompanyLeaveIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="#213fbd" aria-hidden="true">
      <ellipse cx="32" cy="13" rx="10" ry="12" />
      <ellipse cx="14" cy="23" rx="8" ry="9" />
      <ellipse cx="50" cy="23" rx="8" ry="9" />
      <rect x="21" y="29" width="22" height="31" rx="7" />
      <path d="M9 34c-5 1-7 5-7 11v14h16V40c0-3-1-5-3-6H9Z" />
      <path d="M49 34c-2 1-3 3-3 6v19h16V45c0-6-3-10-8-11h-5Z" />
    </svg>
  );
}

/* =========================================
   EXTRA FESTIVAL ICONS + KEYWORD PICKER
   Every holiday gets an icon (FestivalStarIcon is the fallback)
   ========================================= */

function DiyaIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="#ff6800" aria-hidden="true">
      <path d="M32 4c-8 9-9 17-2 25 7-8 9-16 2-25Z" />
      <path d="M6 36h52c0 13-11 22-26 22S6 49 6 36Z" />
      <path d="M20 60h24v3H20z" />
    </svg>
  );
}

function PongalIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="#ff6800" aria-hidden="true">
      <path d="M24 17c-3-4 3-6 0-11M32 17c-3-4 3-6 0-11M40 17c-3-4 3-6 0-11"
        fill="none" stroke="#ff6800" strokeWidth="3" strokeLinecap="round" />
      <path d="M10 22h44v7H10z" />
      <path d="M14 31h36c3 13-4 28-18 28S11 44 14 31Z" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="#ff6800" aria-hidden="true">
      <path d="M32 3c2 15 7 26 29 29-22 3-27 14-29 29-2-15-7-26-29-29C25 29 30 18 32 3Z" />
      <path d="M52 6c1 5 2 7 7 8-5 1-6 3-7 8-1-5-2-7-7-8 5-1 6-3 7-8Z" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="#ff6800" aria-hidden="true">
      <path d="M11 5h4v56h-4z" />
      <path d="M15 8h38l-9 13 9 13H15z" />
    </svg>
  );
}

function TreeIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="#ff6800" aria-hidden="true">
      <path d="M32 3l13 17h-8l12 16H39l13 17H12l13-17H15l12-16h-8Z" />
      <path d="M27 53h10v9H27z" />
    </svg>
  );
}

function CrescentIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="#ff6800" aria-hidden="true">
      <path d="M42 6a27 27 0 1 0 0 52 21 21 0 1 1 0-52Z" />
      <path d="M50 16l2.4 6 6.3.5-4.8 4 1.6 6.2-5.5-3.4-5.5 3.4 1.6-6.2-4.8-4 6.3-.5Z" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="#ff6800" aria-hidden="true">
      <path d="M27 4h10v19h18v10H37v27H27V33H9V23h18Z" />
    </svg>
  );
}

function LabourIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="#ff6800" aria-hidden="true">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <rect key={angle} x="27" y="3" width="10" height="14" rx="2"
          transform={`rotate(${angle} 32 32)`} />
      ))}
      <circle cx="32" cy="32" r="17" />
      <circle cx="32" cy="32" r="7" fill="#ffffff" />
    </svg>
  );
}

function FestivalStarIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="#ff6800" aria-hidden="true">
      <path d="M32 3l7 15 16-5-5 16 15 7-15 7 5 16-16-5-7 15-7-15-16 5 5-16-15-7 15-7-5-16 16 5Z" />
      <circle cx="32" cy="32" r="8" fill="#ffffff" />
    </svg>
  );
}

function pickHolidayIcon(holiday: string): ReactNode {
  const has = (...words: string[]) => words.some((word) => holiday.includes(word));

  if (has("gandhi")) return <GandhiIcon />;
  if (has("vijay", "dashami", "dussehra", "dasara")) return <VijayDasamiIcon />;
  if (has("ayutha", "ayudha", "saraswati", "pooja", "puja")) return <AyuthaPoojaIcon />;
  if (has("company leave", "office leave")) return <CompanyLeaveIcon />;
  if (has("diwali", "deepavali", "deepam", "karthigai")) return <DiyaIcon />;
  if (has("pongal", "sankranti", "makar", "uzhavar", "thiruvalluvar")) return <PongalIcon />;
  if (has("new year", "puthandu", "tamil year")) return <SparkleIcon />;
  if (has("republic", "independence")) return <FlagIcon />;
  if (has("christmas", "xmas")) return <TreeIcon />;
  if (has("eid", "ramzan", "ramadan", "bakrid", "bakri", "muharram", "milad")) return <CrescentIcon />;
  if (has("good friday", "easter")) return <CrossIcon />;
  if (has("labour", "labor", "may day", "workers")) return <LabourIcon />;
  return <FestivalStarIcon />;
}