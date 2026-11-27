
import axios from "axios";
import { useEffect, useState } from "react";
import {
  AccessTimeRounded,
  CalendarMonthRounded,

  EventAvailableRounded,
  AssignmentTurnedInRounded,

  CheckCircleRounded,
  CancelRounded,
  HourglassTopRounded,
  CardGiftcardRounded,
  CalendarTodayRounded,
  BadgeRounded,
} from "@mui/icons-material";
import api from "../../api/axiosInstance";
import "./Dashboard.css";
import "./EmployeeDashboard.css";

import DailyInspiration from "../../Components/DailyInspiration/DailyInspiration";
/* ================= TYPES ================= */
interface LeaveDetails {
  allocated: number;
  used: number;
  available: number;
}
type LeaveValue = number | LeaveDetails | null;
interface LeaveBalance {
  casualLeave: LeaveValue;
  sickLeave: LeaveValue;
  compensatoryOff: LeaveValue;
  permissions: LeaveValue;
}
interface LeaveRequestSummary {
  pending: number;
  approved: number;
  rejected: number;
}
interface TodaysAttendance {
  isCheckedIn: boolean;
  isCheckedOut: boolean;
  totalWorkingSeconds?: number | null;
  currentWorkingSeconds?: number | null;
}
interface AttendanceHistoryRecord {
  _id: string;
  day: string;
  user_id: string;
  employeeId: string;
  email: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  totalWorkingSeconds: number | null;
}
interface WorkingHours {
  today: number;
  thisMonth: number;
  averagePerDay: number;
}
interface DashboardEmployee {
  user_id: string;
  employeeId: string;
  name: string;
  email: string;
  designation: string;
  team?: string;
  status?: string;
}
interface EmployeeDashboardData {
  employee?: DashboardEmployee;
  workingHours: WorkingHours;
  leaveBalance: LeaveBalance;
  leaveRequestSummary: LeaveRequestSummary;
  todaysAttendance: TodaysAttendance;
}
interface LoggedInUser {
  userId?: string;
  employeeId?: string;
  email?: string;
  name?: string;
  fullName?: string;
  employeeName?: string;
  firstName?: string;
}
type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};
/* ================= DEFAULT DATA ================= */
const EMPTY_DATA: EmployeeDashboardData = {
  workingHours: {
    today: 0,
    thisMonth: 0,
    averagePerDay: 0,
  },
  leaveBalance: {
    casualLeave: 0,
    sickLeave: 0,
    compensatoryOff: 0,
    permissions: 0,
  },
  leaveRequestSummary: {
    pending: 0,
    approved: 0,
    rejected: 0,
  },
  todaysAttendance: {
    isCheckedIn: false,
    isCheckedOut: false,
  },
};
/* ================= HELPERS ================= */
const safeNumber = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, number);
};
/* FIX: Extract numeric available leave from API object */
const getAvailableLeave = (
  leave: LeaveValue | undefined
): number => {
  if (typeof leave === "number") {
    return safeNumber(leave);
  }
  if (leave && typeof leave === "object") {
    return safeNumber(leave.available);
  }
  return 0;
};
const formatDuration = (seconds: number): string => {
  const safe = safeNumber(seconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  return `${hours}h ${minutes}m`;
};
const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const getLoggedInUser = (): LoggedInUser | null => {
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
    return parsed as LoggedInUser;
  } catch {
    return null;
  }
};
const getDashboardErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") {
      return "The dashboard request timed out. It will retry automatically.";
    }
    const status = error.response?.status;
    if (status === 401) {
      return "Your session has expired. Please sign in again.";
    }
    if (status === 403) {
      return "Your account is not authorized to load this dashboard.";
    }
    if (status && status >= 500) {
      return `The dashboard service is unavailable (HTTP ${status}). It will retry automatically.`;
    }
    if (!error.response) {
      return "Cannot reach the dashboard service. Check your connection.";
    }
  }
  return "Unable to load dashboard data. It will retry automatically.";
};
/* ================= WORKING HOURS ================= */
const computeWorkingHours = (
  history: AttendanceHistoryRecord[],
  attendance: TodaysAttendance
): WorkingHours => {
  const todayStr = getTodayDateString();
  const monthPrefix = todayStr.slice(0, 7);
  const todayRecord = history.find(
    (record) => record.day === todayStr
  );
  const savedTodaySeconds = safeNumber(
    todayRecord?.totalWorkingSeconds
  );
  const todaySeconds = safeNumber(
    attendance.currentWorkingSeconds ??
      todayRecord?.totalWorkingSeconds ??
      attendance.totalWorkingSeconds ??
      0
  );
  const monthRecords = history.filter(
    (record) =>
      record.day?.startsWith(monthPrefix) &&
      typeof record.totalWorkingSeconds === "number"
  );
  const monthSeconds = monthRecords.reduce(
    (sum, record) =>
      sum + safeNumber(record.totalWorkingSeconds),
    0
  );
  const todayAlreadyCounted = monthRecords.some(
    (record) => record.day === todayStr
  );
  const thisMonth = todayAlreadyCounted
    ? monthSeconds + todaySeconds - savedTodaySeconds
    : monthSeconds + todaySeconds;
  const daysWorked =
    monthRecords.length +
    (todayAlreadyCounted || todaySeconds === 0 ? 0 : 1);
  const averagePerDay =
    daysWorked > 0
      ? Math.round(thisMonth / daysWorked)
      : 0;
  return {
    today: todaySeconds,
    thisMonth,
    averagePerDay,
  };
};
/* ================= DATE HELPERS ================= */
const formatDate = (date: string): string => {
  if (!date) return "--";
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  const parsed = new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
const formatTime = (time: string | null): string => {
  if (!time) return "--";
  const parsed = new Date(time);
  if (Number.isNaN(parsed.getTime())) return time;
  return parsed.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};
/* ================= MAIN COMPONENT ================= */
interface UpcomingBirthday {
  _id: string;
  employeeName: string;
  employeeId: string;
  formattedBirthday: string;
  daysRemaining: number;
  isToday: boolean;
}

// Match this path to the birthday router registered in server.js.
const BIRTHDAY_ENDPOINT = "/birthday-creation/upcoming";
const getBirthdayInitials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(word => word.charAt(0).toUpperCase()).join("");
const EmployeeDashboard = () => {
  const [showAllBirthdays, setShowAllBirthdays] = useState(false);
  const [birthdayPage, setBirthdayPage] = useState(0);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<UpcomingBirthday[]>([]);
  const [birthdayLoading, setBirthdayLoading] = useState(true);
  const [birthdayError, setBirthdayError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    let busy = false;
    const load = async () => {
      if (busy || controller.signal.aborted) return;
      busy = true;
      try {
        const response = await api.get<{ success: boolean; data: UpcomingBirthday[] }>(BIRTHDAY_ENDPOINT, { signal: controller.signal });
        if (!response.data.success || !Array.isArray(response.data.data)) throw new Error("Invalid birthday response");
        if (!controller.signal.aborted) {
          setUpcomingBirthdays([...response.data.data].sort((a, b) => a.daysRemaining - b.daysRemaining));
          setBirthdayError("");
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Upcoming birthdays:", error);
          setBirthdayError("Unable to load upcoming birthdays.");
        }
      } finally {
        busy = false;
        if (!controller.signal.aborted) setBirthdayLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(load, 60000);
    window.addEventListener("focus", load);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, []);
  const birthdaysPerPage = 3;
  const totalBirthdayPages = Math.ceil(upcomingBirthdays.length / birthdaysPerPage);
  const currentBirthdayPage = showAllBirthdays ? Math.min(birthdayPage, Math.max(0, totalBirthdayPages - 1)) : 0;
  const visibleBirthdays = upcomingBirthdays.slice(currentBirthdayPage * birthdaysPerPage, (currentBirthdayPage + 1) * birthdaysPerPage);

  const [data, setData] =
    useState<EmployeeDashboardData>(EMPTY_DATA);
  const [history, setHistory] =
    useState<AttendanceHistoryRecord[]>([]);
  const [error, setError] = useState("");
  const loggedInUser = getLoggedInUser();
  const employeeName =
    loggedInUser?.name ||
    loggedInUser?.fullName ||
    loggedInUser?.employeeName ||
    loggedInUser?.firstName ||
    "Employee";
  /* ================= FETCH API ================= */
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    let requestInProgress = false;
    let hasLoadedData = false;
    const loadDashboard = async (backgroundRefresh = false) => {
      if (requestInProgress) return;
      requestInProgress = true;
      if (!backgroundRefresh) {
        setError("");
      }

try {
  // Start both independent API requests simultaneously.
  const [dashboardResult, historyResult] =
    await Promise.allSettled([
      api.post<ApiResponse<EmployeeDashboardData>>(
        "/dashboard/employee",
        { date: "" },
        { signal: controller.signal }
      ),

      api.post<ApiResponse<AttendanceHistoryRecord[]>>(
        "/attendance/history",
        {
          user_id: "",
          date: "",
        },
        { signal: controller.signal }
      ),
    ]);

  // Dashboard data is essential.
  if (dashboardResult.status === "rejected") {
    throw dashboardResult.reason;
  }

  const payload = dashboardResult.value.data.data;

  let attendance =
    payload?.todaysAttendance ??
    EMPTY_DATA.todaysAttendance;

  const leaveBalance =
    payload?.leaveBalance ??
    EMPTY_DATA.leaveBalance;

  const leaveRequestSummary =
    payload?.leaveRequestSummary ??
    EMPTY_DATA.leaveRequestSummary;

  let workingHours = EMPTY_DATA.workingHours;

  // Process attendance history independently.
  if (historyResult.status === "fulfilled") {
    const allHistory = historyResult.value.data.data;

    if (Array.isArray(allHistory)) {
      const user = getLoggedInUser();

      const myEmployeeId =
        user?.userId ?? user?.employeeId;

      const myEmail = user?.email?.toLowerCase();

      const myHistory = allHistory
        .filter((record) => {
          const matchesId =
            Boolean(myEmployeeId) &&
            record.employeeId === myEmployeeId;

          const matchesEmail =
            Boolean(myEmail) &&
            record.email?.toLowerCase() === myEmail;

          return matchesId || matchesEmail;
        })
        .sort((a, b) =>
          b.day.localeCompare(a.day)
        );

      const todayRecord = myHistory.find(
        (record) => record.day === getTodayDateString()
      );

      attendance = {
        ...attendance,
        isCheckedIn: Boolean(
          todayRecord?.checkInTime &&
          !todayRecord.checkOutTime
        ),
        isCheckedOut: Boolean(todayRecord?.checkOutTime),
      };

      workingHours = computeWorkingHours(
        myHistory,
        attendance
      );

      if (!cancelled) {
        setHistory(myHistory);
      }
    } else {
      workingHours = {
        today: safeNumber(
          attendance.currentWorkingSeconds ??
            attendance.totalWorkingSeconds
        ),
        thisMonth: safeNumber(
          payload?.workingHours?.thisMonth
        ),
        averagePerDay: safeNumber(
          payload?.workingHours?.averagePerDay
        ),
      };
    }
  } else {
    console.error(
      "Attendance history error:",
      historyResult.reason
    );
  

    // Preserve dashboard-provided fallback values.
    workingHours = {
      today: safeNumber(
        attendance.currentWorkingSeconds ??
          attendance.totalWorkingSeconds
      ),
      thisMonth: safeNumber(
        payload?.workingHours?.thisMonth
      ),
      averagePerDay: safeNumber(
        payload?.workingHours?.averagePerDay
      ),
    };
  }

  
      if (!cancelled) {
        hasLoadedData = true;

        setData({
          workingHours,
          leaveBalance,
          leaveRequestSummary,
          todaysAttendance: attendance,
        });

        setError("");
      }
    } catch (err) {
      console.error("Employee dashboard error:", err);

      if (!cancelled) {
        setError(
          backgroundRefresh && hasLoadedData
            ? "Dashboard refresh failed. Showing the last loaded data."
            : getDashboardErrorMessage(err)
        );
      }
    } finally {
      requestInProgress = false;
    }

    };
    
    // Fetch dashboard data only once when the page mounts
    void loadDashboard();
    // Cancel state updates when the page unmounts
    return () => {
      cancelled = true;
      controller.abort();
    };

  }, []);
  /* ================= EXTRACT DATA ================= */
  const {
    
    leaveBalance,
    leaveRequestSummary,
    todaysAttendance,
  } = data;
  /* ================= LEAVE BALANCE ================= */
  // All values are numbers after getAvailableLeave().
  const leaveItems = [
    {
      label: "Casual Leave",
      value: getAvailableLeave(leaveBalance.casualLeave),
      color: "#087F55",
    },
    {
      label: "Sick Leave",
      value: getAvailableLeave(leaveBalance.sickLeave),
      color: "#52C75C",
    },
    {
      label: "Compensatory Off",
      value: getAvailableLeave(leaveBalance.compensatoryOff),
      color: "#F9B23D",
    },
    {
      label: "Permission Hours",
      value: getAvailableLeave(leaveBalance.permissions),
      color: "#2697E8",
    },
  ];
  /* FIX 1: Numeric total */
  const totalLeaves = leaveItems.reduce(
    (sum, item) => sum + item.value,
    0
  );
  /* FIX 2: Numeric donut chart calculation */
  let currentPercent = 0;
  const donutSegments = leaveItems.map((item) => {
    const start = currentPercent;
    currentPercent +=
      totalLeaves > 0
        ? (item.value / totalLeaves) * 100
        : 0;
    return `${item.color} ${start}% ${currentPercent}%`;
  });
  const donutBackground =
    totalLeaves > 0
      ? `conic-gradient(${donutSegments.join(", ")})`
      : "#e9eef3";
  /* ================= LEAVE REQUESTS ================= */
  const pendingRequests = safeNumber(
    leaveRequestSummary.pending
  );
  const approvedRequests = safeNumber(
    leaveRequestSummary.approved
  );
  const rejectedRequests = safeNumber(
    leaveRequestSummary.rejected
  );
  const totalRequests =
    pendingRequests + approvedRequests + rejectedRequests;
  const requestItems = [
    {
      label: "Pending",
      value: pendingRequests,
      color: "#F5A623",
      icon: <HourglassTopRounded />,
    },
    {
      label: "Approved",
      value: approvedRequests,
      color: "#119B69",
      icon: <CheckCircleRounded />,
    },
    {
      label: "Rejected",
      value: rejectedRequests,
      color: "#E15B64",
      icon: <CancelRounded />,
    },
  ];
  /* ================= ATTENDANCE STATUS ================= */
  const attendanceStatus = todaysAttendance.isCheckedOut
    ? "Checked Out"
    : todaysAttendance.isCheckedIn
      ? "Checked In"
      : "Not Checked In";
  const currentDate = new Date();
  const todayDate = currentDate.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const hour = currentDate.getHours();
  const greeting =
    hour < 12
      ? "Good Morning "
      : hour < 17
        ? "Good Afternoon "
        : "Good Evening ";
  const recentAttendance = history.slice(0, 5);
  /* ================= UI ================= */
  return (
    <main className="emp-premium-dashboard">
      <section className="emp-dashboard-top">
        <div className="emp-dashboard-main">
          {/* WELCOME SECTION */}
          <section className="emp-welcome">
        <div className="emp-welcome-content">
          <span className="emp-welcome-tag">{greeting.toUpperCase()}</span>
          <h2>Welcome back, {employeeName}!</h2>
          <DailyInspiration />
        </div>
        <div
          className="emp-welcome-decoration"
          aria-hidden="true"
        >
          <EventAvailableRounded />
        </div>
        <div className="emp-welcome-date">
          <div className="emp-welcome-date-row">
            <CalendarMonthRounded />
            <span>{todayDate}</span>
          </div>
          <div className="emp-welcome-date-row">
            <AccessTimeRounded />
            <span>{attendanceStatus}</span>
          </div>
        </div>
      </section>
      {/* ERROR MESSAGE */}
      {error && (
        <div className="emp-error" role="alert">
          {error}
        </div>
      )}
          
        </div>
      </section>
      {/* CHARTS */}
      <section className="emp-chart-grid">
        {/* LEAVE BALANCE */}
        <article className="emp-panel">
          <div className="emp-panel-heading">
            <div>
              <h3>Your leave balance</h3>
              <p>
                Casual, sick, earned and permission
                days remaining
              </p>
            </div>
            <span className="emp-period">
              This Year
            </span>
          </div>
          <div className="emp-leave-chart">
            <div
              className="emp-donut"
              role="img"
              aria-label={`Total available leave: ${totalLeaves}`}
              style={{ background: donutBackground }}
            >
              <div className="emp-donut-inner">
                <span>Total</span>
                <strong>
                  {totalLeaves}
                </strong>
                <small>Days</small>
              </div>
            </div>
            <div className="emp-leave-list">
              {leaveItems.map((item) => (
                <div
                  key={item.label}
                  className="emp-leave-item"
                >
                  <span
                    className="emp-leave-color"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="emp-leave-name">
                    {item.label}
                  </span>
                  {/* FIX 3: item.value is a number */}
                  <strong>
                    {`${item.value} ${item.label === "Permission Hours" ? "hours" : "days"}`}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </article>
        {/* LEAVE REQUEST STATUS */}
        <article className="emp-panel">
          <div className="emp-panel-heading">
             <div>
              <h3>Leave requests by status</h3>
              <p>
                Pending, approved and rejected requests
              </p>
            </div>
            <span className="emp-period">
              Overview
            </span>
          </div>
          {totalRequests === 0 ? (
            <div className="emp-no-requests">
              <div className="emp-empty-icon">
                <AssignmentTurnedInRounded />
              </div>
              <h4>No leave requests yet</h4>
              <p>
                Your leave request activity will appear here.
              </p>
            </div>
          ) : (
            <div className="emp-request-overview">
              <div className="emp-request-total">
                <span>Total Requests</span>
                <strong>{totalRequests}</strong>
                <small>
                  Your leave application summary
                </small>
              </div>
              <div className="emp-request-list">
                {requestItems.map((item) => (
                  <div
                    key={item.label}
                    className="emp-request-item"
                  >
                    <div className="emp-request-row">
                      <div>
                        <span
                          className="emp-request-symbol"
                          style={{ color: item.color }}
                        >
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      <strong>{item.value}</strong>
                    </div>
                    <div className="emp-request-track">
                      <div
                        style={{
                          backgroundColor: item.color,
                          width: `${
                            totalRequests > 0
                              ? (item.value / totalRequests) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      </section>
      {/* BOTTOM SECTION */}
      <section className="emp-bottom-grid">
        {/* RECENT ATTENDANCE */}
        <article className="emp-panel emp-attendance-panel">
          <div className="emp-panel-heading">
            <div>
              <h3>Recent Attendance</h3>
              <p>Your latest attendance activity</p>
            </div>
            <div className="emp-heading-icon">
              <BadgeRounded />
            </div>
          </div>
          <div className="emp-table-wrapper">
            <table className="emp-attendance-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Working Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="emp-table-empty">
                    No attendance records available  
                    </td>
                  </tr>
                ) : (
                  recentAttendance.map((record) => {
                    const status = record.checkOutTime
                      ? "Checked Out"
                      : record.checkInTime
                        ? "Check In"
                        : "Not Checked In";
                    return (
                      <tr key={record._id || record.day}>
                        <td data-label="Date">
                          {formatDate(record.day)}
                        </td>
                        <td data-label="Check In">
                          {formatTime(record.checkInTime)}
                        </td>
                        <td data-label="Check Out">
                          {formatTime(record.checkOutTime)}
                        </td>
                        <td data-label="Working Hours">
                          {typeof record.totalWorkingSeconds ===
                          "number"
                            ? formatDuration(
                                record.totalWorkingSeconds
                              )
                            : "--"}
                        </td>
                        <td data-label="Status">
                          <span
                            className={`emp-status emp-status-${
                              status === "Checked Out"
                                ? "complete"
                                : status === "Check In"
                                  ? "active"
                                  : "pending"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </article>
        {/* UPCOMING BIRTHDAYS */}
        <article className="emp-panel emp-birthday-panel">
          <div className="emp-birthday-art" aria-hidden="true">
            <img src={`${import.meta.env.BASE_URL}birthday-cake.png`} alt="Birthday cake" className="emp-birthday-image" />
          </div>
          <div className="emp-birthday-content">
            <div className="emp-birthday-header">
              <svg className="emp-birthday-title-icon" viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="19" width="24" height="9" rx="2" />
                <rect x="7" y="12" width="18" height="7" rx="2" />
                <path d="M11 12V7 M16 12V7 M21 12V7 M11 2L10 4 M16 2L15 4 M21 2L20 4 M4 23Q7 27 10 23Q13 27 16 23Q19 27 22 23Q25 27 28 23" />
              </svg>
              <div className="emp-birthday-heading">
                <h3>Upcoming Birthdays</h3>
                <p>Let's wish them a happy birthday!</p>
              </div>
              {upcomingBirthdays.length > 3 && <button type="button" className="emp-birthday-view" onClick={() => { setShowAllBirthdays(v => !v); setBirthdayPage(0); }} aria-expanded={showAllBirthdays}>
                {showAllBirthdays ? "Show Less" : "View All"} 
              </button>}
            </div>
            <div className="emp-birthday-list">
              {birthdayLoading ? <p className="emp-birthday-note">Loading birthdays...</p> : birthdayError ? <p role="alert" className="emp-birthday-note">{birthdayError}</p> : visibleBirthdays.length === 0 ? <p className="emp-birthday-note">No upcoming birthdays</p> : visibleBirthdays.map((employee, index) => (
                <div className="emp-birthday-row" key={employee._id || employee.employeeId}>
                  <span className={`emp-birthday-avatar emp-birthday-avatar-${index % 3}`}>{getBirthdayInitials(employee.employeeName)}</span>
                  <div className="emp-birthday-person"><strong>{employee.employeeName}</strong><span>{employee.employeeId}</span></div>
                  <span className="emp-birthday-date"><CalendarTodayRounded />{employee.isToday ? "Today" : employee.formattedBirthday}</span>
                  <CardGiftcardRounded className="emp-birthday-gift" />
                </div>
              ))}
            </div>
            {showAllBirthdays && !birthdayLoading && !birthdayError && totalBirthdayPages > 1 && (
              <div className="emp-birthday-pagination">
                <button type="button" className="emp-birthday-page-btn" disabled={currentBirthdayPage === 0} onClick={() => setBirthdayPage(Math.max(0, currentBirthdayPage - 1))}>← Back</button>
                <span className="emp-birthday-page-count" aria-live="polite">Page {currentBirthdayPage + 1} of {totalBirthdayPages}</span>
                <button type="button" className="emp-birthday-page-btn" disabled={currentBirthdayPage >= totalBirthdayPages - 1} onClick={() => setBirthdayPage(Math.min(totalBirthdayPages - 1, currentBirthdayPage + 1))}>Next →</button>
              </div>
            )}
          </div>
        </article>
      </section>
    </main>
  );
};
export default EmployeeDashboard;
