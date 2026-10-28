

import { useEffect, useState } from "react";

import {

  AccessTimeRounded,

  CalendarMonthRounded,

  PendingActionsRounded,

  TrendingUpRounded,

  EventAvailableRounded,

  AssignmentTurnedInRounded,

  ArrowForwardRounded,

  CheckCircleRounded,

  CancelRounded,

  HourglassTopRounded,

  AutoGraphRounded,

  BadgeRounded,

} from "@mui/icons-material";

import api from "../../api/axiosInstance";

import "./Dashboard.css";

import "./EmployeeDashboard.css";

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

const DashboardSpinner = ({ small = false }: { small?: boolean }) => (
  <span
    className={`emp-loading-spinner${small ? " emp-loading-spinner-small" : ""}`}
    role="status"
    aria-label="Loading"
  />
);

const EmployeeDashboard = () => {

  const [data, setData] =

    useState<EmployeeDashboardData>(EMPTY_DATA);

  const [history, setHistory] =

    useState<AttendanceHistoryRecord[]>([]);

  const [loading, setLoading] = useState(true);

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

    let cancelled = false;

    const loadDashboard = async (backgroundRefresh = false) => {

      if (!backgroundRefresh) {
        setLoading(true);
      }

      if (!backgroundRefresh) {
        setError("");
      }

      try {

        const dashboardResponse = await api.post<

          ApiResponse<EmployeeDashboardData>

        >("/dashboard/employee", {

          date: "",

        });

        const payload = dashboardResponse.data.data;

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

        try {

          const historyResponse = await api.post<

            ApiResponse<AttendanceHistoryRecord[]>

          >("/attendance/history", {

            user_id: "",

            date: "",

          });

          const allHistory = historyResponse.data.data;

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
              isCheckedIn: Boolean(todayRecord?.checkInTime),
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

        } catch (historyError) {

          console.error(

            "Attendance history error:",

            historyError

          );

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

          setData({

            workingHours,

            leaveBalance,

            leaveRequestSummary,

            todaysAttendance: attendance,

          });

        }

      } catch (err) {

        console.error("Employee dashboard error:", err);

        if (!cancelled) {

          setError(

            "Unable to load dashboard data. Please refresh the page."

          );

        }

      } finally {

        if (!cancelled && !backgroundRefresh) {

          setLoading(false);

        }

      }

    };

    const refreshDashboardWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void loadDashboard(true);
      }
    };

    document.addEventListener(
      "visibilitychange",
      refreshDashboardWhenVisible
    );
    window.addEventListener(
      "focus",
      refreshDashboardWhenVisible
    );
    const refreshInterval = window.setInterval(
      () => void loadDashboard(true),
      30_000
    );

    void loadDashboard();

    return () => {

      cancelled = true;
      document.removeEventListener(
        "visibilitychange",
        refreshDashboardWhenVisible
      );
      window.removeEventListener(
        "focus",
        refreshDashboardWhenVisible
      );
      window.clearInterval(refreshInterval);

    };

  }, []);

  /* ================= EXTRACT DATA ================= */

  const {

    workingHours,

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

      label: "Permission",

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

      ? "Check In"

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

      {/* WELCOME SECTION */}

      <section className="emp-welcome">

        <div className="emp-welcome-content">

          <span className="emp-welcome-tag">

            {greeting}

          </span>

          <h2>Welcome back, {employeeName}!</h2>

          <p>

            Track your attendance, manage your leaves

            and stay updated with your workspace.

          </p>

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

            <span>{loading ? <DashboardSpinner small /> : attendanceStatus}</span>

          </div>

        </div>

      </section>

      {/* ERROR MESSAGE */}

      {error && (

        <div className="emp-error" role="alert">

          {error}

        </div>

      )}

      {/* STATISTICS */}

      <section className="emp-stat-grid">

        <article className="emp-stat-card emp-green">

          <div className="emp-stat-header">

            <div className="emp-stat-icon">

              <AccessTimeRounded />

            </div>

            <span className="emp-stat-mini-icon">

              <TrendingUpRounded />

            </span>

          </div>

          <p className="emp-stat-label">

            Working hours today

          </p>

          <h3>

            {loading ? <DashboardSpinner /> : formatDuration(workingHours.today)}

          </h3>

          <div className="emp-stat-bottom">

            <span className="emp-stat-dot" />

            <span>{loading ? <DashboardSpinner small /> : attendanceStatus}</span>

          </div>

        </article>

        <article className="emp-stat-card emp-blue">

          <div className="emp-stat-header">

            <div className="emp-stat-icon">

              <AutoGraphRounded />

            </div>

            <span className="emp-stat-mini-icon">

              <TrendingUpRounded />

            </span>

          </div>

          <p className="emp-stat-label">

            This month's hours

          </p>

          <h3>

            {loading ? <DashboardSpinner /> : formatDuration(workingHours.thisMonth)}

          </h3>

          <div className="emp-stat-bottom">

            <span className="emp-stat-dot" />

            <span>

              Avg{" "}

              {loading ? <DashboardSpinner small /> : formatDuration(workingHours.averagePerDay)}

              /day

            </span>

          </div>

        </article>

        <article className="emp-stat-card emp-orange">

          <div className="emp-stat-header">

            <div className="emp-stat-icon">

              <PendingActionsRounded />

            </div>

            <span className="emp-stat-mini-icon">

              <AssignmentTurnedInRounded />

            </span>

          </div>

          <p className="emp-stat-label">

            Pending leave requests

          </p>

          <h3>

            {loading ? <DashboardSpinner /> : pendingRequests}

          </h3>

          <div className="emp-stat-bottom">

            <span className="emp-stat-dot" />

            <span>

              {loading ? <DashboardSpinner small /> : approvedRequests} approved

              {" · "}

              {loading ? <DashboardSpinner small /> : rejectedRequests} rejected

            </span>

          </div>

        </article>

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

                  {loading ? <DashboardSpinner small /> : totalLeaves}

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

                    {loading ? <DashboardSpinner small /> : `${item.value} days`}

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

          {loading ? (

            <div className="emp-no-requests">

              <DashboardSpinner />

            </div>

          ) : totalRequests === 0 ? (

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

                      {loading ? <DashboardSpinner /> : "No attendance records available"}

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

        {/* MY WORK SUMMARY */}

        <article className="emp-panel emp-summary-panel">

          <div className="emp-panel-heading">

            <div>

              <h3>My Work Summary</h3>

              <p>Your current attendance overview</p>

            </div>

            <span className="emp-period">

              This Month

            </span>

          </div>

          <div className="emp-summary-content">

            <div className="emp-summary-row">

              <div className="emp-summary-icon emp-summary-green">

                <AccessTimeRounded />

              </div>

              <div>

                <span>Working Hours</span>

                <strong>

                  {loading ? <DashboardSpinner small /> : formatDuration(workingHours.thisMonth)}

                </strong>

              </div>

              <ArrowForwardRounded />

            </div>

            <div className="emp-summary-row">

              <div className="emp-summary-icon emp-summary-blue">

                <AutoGraphRounded />

              </div>

              <div>

                <span>Daily Average</span>

                <strong>

                  {loading ? <DashboardSpinner small /> : formatDuration(workingHours.averagePerDay)}

                </strong>

              </div>

              <ArrowForwardRounded />

            </div>

            <div className="emp-summary-row">

              <div className="emp-summary-icon emp-summary-orange">

                <EventAvailableRounded />

              </div>

              <div>

                <span>Available Leave</span>

                <strong>

                  {loading ? <DashboardSpinner small /> : `${totalLeaves} days`}

                </strong>

              </div>

              <ArrowForwardRounded />

            </div>

            <div className="emp-summary-footer">

              <CheckCircleRounded />

              <span>Employee dashboard overview</span>

            </div>

          </div>

        </article>

      </section>

    </main>

  );

};

export default EmployeeDashboard;
