
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AccessTimeRounded,
  CalendarMonthRounded,
  PendingActionsRounded,
  TrendingUpRounded,
  EventAvailableRounded,
  AssignmentTurnedInRounded,
  GroupsRounded,
  CheckCircleRounded,
  HourglassTopRounded,
  CancelRounded,
  RefreshRounded,
  AutoGraphRounded,
} from "@mui/icons-material";

import {
  Alert,
  Button,
  CircularProgress,
} from "@mui/material";

import api from "../../api/axiosInstance";

import "./Dashboard.css";
import "./EmployeeDashboard.css";
import "./AdminDashboard.css";

interface EmployeeStatistics {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
}

// interface AttendanceStatistics {
//   present: number;
//   absent: number;
//   onLeave: number;
//   notCheckedIn: number;
// }
interface AttendanceStatistics {
  presentToday: number;
  checkedIn: number;
  checkedOut: number;
  notCheckedIn: number;
  currentlyWorking: number;
  absent?: number;
  onLeave?: number;
}

interface LeaveStatistics {
  pending: number;
  approved: number;
  rejected: number;
}

interface AdminDashboardData {
  employeeStatistics: EmployeeStatistics;
  attendanceStatistics: AttendanceStatistics;
  leaveStatistics: LeaveStatistics;
}

interface DailyAttendanceRecord {
  _id?: string;
  user_id: string;
  employeeId: string;
  email: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  totalWorkingSeconds: number | null;
}

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

const getUserName = () => {
  try {
    const raw = localStorage.getItem("loggedInUser");
    if (!raw) return "Admin";

    const user = JSON.parse(raw) as {
      name?: string;
      fullName?: string;
    };

    return user.name || user.fullName || "Admin";
  } catch {
    return "Admin";
  }
};

const getErrorMessage = (
  error: unknown,
  fallback: string
) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: { message?: string };
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return error instanceof Error
    ? error.message
    : fallback;
};

const formatTime = (value: string | null) => {
  if (!value) return "--";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "--"
    : date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
};

const formatDuration = (seconds: number | null) => {
  if (
    seconds === null ||
    !Number.isFinite(seconds)
  ) {
    return "--";
  }

  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);

  return `${hours}h ${minutes}m`;
};

const getStatus = (record: DailyAttendanceRecord) => {
  if (record.checkInTime && record.checkOutTime) {
    return "Checked Out";
  }

  if (record.checkInTime) return "Checked In";

  return "Not Checked In";
};

function AdminDashboard() {
  const [dashboard, setDashboard] =
    useState<AdminDashboardData | null>(null);

  const [attendanceRecords, setAttendanceRecords] =
    useState<DailyAttendanceRecord[] | null>(null);

  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [attendanceError, setAttendanceError] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);

  const [userName] = useState(getUserName);
  const [now] = useState(() => new Date());

  const refresh = useCallback(() => {
    setRefreshCount((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setDashboardError("");
      setAttendanceError("");

      const [dashboardResult, attendanceResult] =
        await Promise.allSettled([
          api.post<ApiResponse<AdminDashboardData>>(
            "/dashboard/admin",
            { date: "" }
          ),
          api.post<ApiResponse<DailyAttendanceRecord[]>>(
            "/attendance/daily",
            { user_id: "", date: "" }
          ),
        ]);

      if (cancelled) return;

      if (dashboardResult.status === "fulfilled") {
        const body = dashboardResult.value.data;

        if (
          body.success !== false &&
          body.data?.employeeStatistics &&
          body.data?.attendanceStatistics &&
          body.data?.leaveStatistics
        ) {
          setDashboard(body.data);
        } else {
          setDashboard(null);
          setDashboardError(
            body.message || "Unable to load dashboard data."
          );
        }
      } else {
        setDashboard(null);
        setDashboardError(
          getErrorMessage(
            dashboardResult.reason,
            "Unable to load dashboard data."
          )
        );
      }

      if (attendanceResult.status === "fulfilled") {
        const body = attendanceResult.value.data;

        if (
          body.success !== false &&
          Array.isArray(body.data)
        ) {
          setAttendanceRecords(body.data);
        } else {
          setAttendanceRecords(null);
          setAttendanceError(
            body.message || "Unable to load attendance."
          );
        }
      } else {
        setAttendanceRecords(null);
        setAttendanceError(
          getErrorMessage(
            attendanceResult.reason,
            "Unable to load attendance."
          )
        );
      }

      setLoading(false);
    };

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [refreshCount]);

  const employeeStats = dashboard?.employeeStatistics;
  const attendanceStats = dashboard?.attendanceStatistics;
  const leaveStats = dashboard?.leaveStatistics;

  const checkedInCount = useMemo(
    () =>
      attendanceRecords?.filter(
        (record) => Boolean(record.checkInTime)
      ).length ?? null,
    [attendanceRecords]
  );

  const greeting =
    now.getHours() < 12
      ? "GOOD MORNING"
      : now.getHours() < 17
        ? "GOOD AFTERNOON"
        : "GOOD EVENING";

  const todayDate = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  
const attendanceItems = [
  {
    label: "Present",
    value: attendanceStats?.presentToday ?? 0,
    color: "#087f55",
  },
  {
    label: "Absent",
    value: attendanceStats?.absent ?? 0,
    color: "#52c75c",
  },
  {
    label: "On Leave",
    value: attendanceStats?.onLeave ?? 0,
    color: "#f9b23d",
  },
  {
    label: "Not Checked In",
    value: attendanceStats?.notCheckedIn ?? 0,
    color: "#2697e8",
  },
];


  // const attendanceItems = [
  //   {
  //     label: "Present",
  //     value: attendanceStats?.present ?? 0,
  //     color: "#087f55",
  //   },
  //   {
  //     label: "Absent",
  //     value: attendanceStats?.absent ?? 0,
  //     color: "#52c75c",
  //   },
  //   {
  //     label: "On Leave",
  //     value: attendanceStats?.onLeave ?? 0,
  //     color: "#f9b23d",
  //   },
  //   {
  //     label: "Not Checked In",
  //     value: attendanceStats?.notCheckedIn ?? 0,
  //     color: "#2697e8",
  //   },
  // ];

  const totalAttendance = attendanceItems.reduce(
    (sum, item) => sum + item.value,
    0
  );

  let runningPercent = 0;

  const attendanceSegments = attendanceItems.map((item) => {
    const start = runningPercent;

    runningPercent +=
      totalAttendance > 0
        ? (item.value / totalAttendance) * 100
        : 0;

    return `${item.color} ${start}% ${runningPercent}%`;
  });

  const attendanceDonut =
    totalAttendance > 0
      ? `conic-gradient(${attendanceSegments.join(", ")})`
      : "#e9eef3";

  const leaveItems = [
    {
      label: "Pending",
      value: leaveStats?.pending ?? 0,
      color: "#f5a623",
      icon: <HourglassTopRounded />,
    },
    {
      label: "Approved",
      value: leaveStats?.approved ?? 0,
      color: "#119b69",
      icon: <CheckCircleRounded />,
    },
    {
      label: "Rejected",
      value: leaveStats?.rejected ?? 0,
      color: "#e15b64",
      icon: <CancelRounded />,
    },
  ];

  const totalLeaveRequests = leaveItems.reduce(
    (sum, item) => sum + item.value,
    0
  );

  return (
    <main className="emp-premium-dashboard admin-employee-match">

      {/* WELCOME BANNER */}

      <section className="emp-welcome">
        <div className="emp-welcome-content">
          <span className="emp-welcome-tag">
            {greeting}
          </span>

          <h2>Welcome back, {userName}!</h2>

          <p>
            Monitor your workforce, manage attendance,
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
            <span>
              {loading
                ? "Loading attendance..."
                : checkedInCount === null
                  ? "Attendance unavailable"
                  : `${checkedInCount} checked in today`}
            </span>
          </div>
        </div>
      </section>

      {(dashboardError || attendanceError) && (
        <div className="admin-match-errors">
          {dashboardError && (
            <Alert severity="error">
              {dashboardError}
            </Alert>
          )}

          {attendanceError && (
            <Alert severity="warning">
              {attendanceError}
            </Alert>
          )}
        </div>
      )}

      {/* THREE STAT CARDS — EMPLOYEE STYLE */}

      <section className="emp-stat-grid">
        <article className="emp-stat-card emp-green">
          <div className="emp-stat-header">
            <div className="emp-stat-icon">
              <GroupsRounded />
            </div>

            <span className="emp-stat-mini-icon">
              <TrendingUpRounded />
            </span>
          </div>

          <p className="emp-stat-label">
            Total employees
          </p>

          <h3>
            {loading || !employeeStats
              ? "—"
              : employeeStats.totalEmployees}
          </h3>

          <div className="emp-stat-bottom">
            <span className="emp-stat-dot" />
            <span>
              {employeeStats
                ? `${employeeStats.activeEmployees} active employees`
                : "Data unavailable"}
            </span>
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
            Checked in today
          </p>

          <h3>
            {loading || checkedInCount === null
              ? "—"
              : checkedInCount}
          </h3>

          <div className="emp-stat-bottom">
            <span className="emp-stat-dot" />
            <span>Recorded employee check-ins</span>
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
            {loading || !leaveStats
              ? "—"
              : leaveStats.pending}
          </h3>

          <div className="emp-stat-bottom">
            <span className="emp-stat-dot" />
            <span>
              {leaveStats
                ? `${leaveStats.approved} approved · ${leaveStats.rejected} rejected`
                : "Data unavailable"}
            </span>
          </div>
        </article>
      </section>

      {/* CHARTS — EMPLOYEE PANEL STYLE */}

      <section className="emp-chart-grid">

        {/* ATTENDANCE DONUT */}

        <article className="emp-panel">
          <div className="emp-panel-heading">
            <div>
              <h3>Today's attendance</h3>
              <p>
                Present, absent, on leave and not checked in
              </p>
            </div>

            <span className="emp-period">Today</span>
          </div>

          {loading ? (
            <div className="emp-no-requests">
              <CircularProgress size={25} />
              <p>Loading attendance...</p>
            </div>
          ) : !dashboard ? (
            <div className="emp-no-requests">
              <p>Attendance data is unavailable.</p>
            </div>
          ) : totalAttendance === 0 ? (
            <div className="emp-no-requests">
              <div className="emp-empty-icon">
                <EventAvailableRounded />
              </div>

              <h4>No attendance statistics yet</h4>
              <p>
                Attendance information will appear here.
              </p>
            </div>
          ) : (
            <div className="emp-leave-chart">
              <div
                className="emp-donut"
                role="img"
                aria-label={`Total reported attendance categories: ${totalAttendance}`}
                style={{ background: attendanceDonut }}
              >
                <div className="emp-donut-inner">
                  <span>Today's</span>
                  <strong>{totalAttendance}</strong>
                  <small>Records</small>
                </div>
              </div>

              <div className="emp-leave-list">
                {attendanceItems.map((item) => (
                  <div
                    key={item.label}
                    className="emp-leave-item"
                  >
                    <span
                      className="emp-leave-color"
                      style={{
                        backgroundColor: item.color,
                      }}
                    />

                    <span className="emp-leave-name">
                      {item.label}
                    </span>

                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* LEAVE STATUS */}

        <article className="emp-panel">
          <div className="emp-panel-heading">
            <div>
              <h3>Leave requests by status</h3>
              <p>
                Pending, approved and rejected requests
              </p>
            </div>

            <span className="emp-period">Overview</span>
          </div>

          {loading ? (
            <div className="emp-no-requests">
              <p>Loading leave requests...</p>
            </div>
          ) : !dashboard ? (
            <div className="emp-no-requests">
              <p>Leave request data is unavailable.</p>
            </div>
          ) : totalLeaveRequests === 0 ? (
            <div className="emp-no-requests">
              <div className="emp-empty-icon">
                <AssignmentTurnedInRounded />
              </div>

              <h4>No leave requests yet</h4>

              <p>
                Employee leave requests will appear here.
              </p>
            </div>
          ) : (
            <div className="emp-request-overview">
              <div className="emp-request-total">
                <span>Total Requests</span>
                <strong>{totalLeaveRequests}</strong>
                <small>
                  Employee leave application summary
                </small>
              </div>

              <div className="emp-request-list">
                {leaveItems.map((item) => (
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
                            totalLeaveRequests > 0
                              ? (item.value /
                                  totalLeaveRequests) *
                                100
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

      {/* ATTENDANCE RECORDS */}

      <section className="emp-panel admin-match-attendance">
        <div className="emp-panel-heading">
          <div>
            <h3>Today's check-ins</h3>
            <p>
              Employee attendance and working hours
            </p>
          </div>

          <div className="admin-match-panel-actions">
            <span className="emp-period">
              {attendanceRecords?.length ?? "—"} records
            </span>

            <Button
              variant="outlined"
              size="small"
              onClick={refresh}
              disabled={loading}
              startIcon={<RefreshRounded />}
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="emp-table-wrapper">
          <table className="emp-attendance-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Email</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Working Hours</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ||
              attendanceRecords === null ||
              attendanceRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="emp-table-empty"
                  >
                    {loading
                      ? "Loading attendance..."
                      : attendanceRecords === null
                        ? "Attendance records are unavailable."
                        : "No check-ins recorded yet today."}
                  </td>
                </tr>
              ) : (
                attendanceRecords.map((record, index) => {
                  const status = getStatus(record);

                  return (
                    <tr
                      key={
                        record._id ||
                        `${record.user_id}-${index}`
                      }
                    >
                      <td>{record.employeeId || "—"}</td>
                      <td>{record.email || "—"}</td>
                      <td>
                        {formatTime(record.checkInTime)}
                      </td>
                      <td>
                        {formatTime(record.checkOutTime)}
                      </td>
                      <td>
                        {formatDuration(
                          record.totalWorkingSeconds
                        )}
                      </td>
                      <td>
                        <span
                          className={`emp-status ${
                            status === "Checked Out"
                              ? "emp-status-complete"
                              : status === "Checked In"
                                ? "emp-status-active"
                                : "emp-status-pending"
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
      </section>
    </main>
  );
}

export default AdminDashboard;
