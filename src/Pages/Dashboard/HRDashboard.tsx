
import { useCallback, useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
} from "@mui/material";

import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import BeachAccessRoundedIcon from "@mui/icons-material/BeachAccessRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import Diversity3RoundedIcon from "@mui/icons-material/Diversity3Rounded";

import StatCard from "../../Components/Dashboard/StatCard/StatCard";
import ProjectsPieChart from "../../Components/Dashboard/Chart/ProjectsPieChart";
import TeamAllocationChart from "../../Components/Dashboard/Chart/TeamAllocationChart";
import DailyInspiration from "../../Components/DailyInspiration/DailyInspiration";

import type { StatCardProps } from "../../Components/Dashboard/StatCard/StatCard";

import api from "../../api/axiosInstance";
import "./Dashboard.css";
import "./EmployeeDashboard.css";
import { EventAvailableRounded } from "@mui/icons-material";

/* ================= TYPES ================= */

interface EmployeeStatistics {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
}

interface AttendanceStatistics {
  present?: number;
  presentToday?: number;
  absent?: number;
  onLeave?: number;
  notCheckedIn?: number;
}

interface LeaveStatistics {
  pending: number;
  approved: number;
  rejected: number;
}

interface HRDashboardData {
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

type LoadState = "loading" | "success" | "error";

/* ================= HELPERS ================= */

const getApiError = (
  error: unknown,
  fallback: string
): string => {
  if (typeof error === "object" && error !== null) {
    const err = error as {
      code?: string;
      message?: string;
      response?: {
        status?: number;
        data?: { message?: string };
      };
    };

    if (err.response?.status === 401) {
      return "Session expired. Please sign in again.";
    }

    if (err.response?.status === 403) {
      return "You do not have permission to view this data.";
    }

    if (
      err.code === "ECONNABORTED" ||
      err.code === "ETIMEDOUT"
    ) {
      return "Server response timed out. Please try again.";
    }

    if (err.response?.data?.message) {
      return err.response.data.message;
    }

    if (!err.response && err.message === "Network Error") {
      return "Unable to connect to the server.";
    }

    return err.message || fallback;
  }

  return fallback;
};

const safeCount = (value: unknown): number => {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.max(0, number)
    : 0;
};

const formatTime = (value?: string | null): string => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDuration = (value?: number | null): string => {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  const seconds = Math.max(0, value);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return `${hours}h ${minutes}m`;
};

const attendanceStatus = (record: DailyAttendanceRecord) => {
  if (record.checkInTime && record.checkOutTime) {
    return "Checked Out";
  }

  if (record.checkInTime) {
    return "Checked In";
  }

  return "Not Checked In";
};

const statusPillClass = (status: string) => {
  if (status === "Checked Out") {
    return "admin-dashboard__status-pill--present";
  }

  if (status === "Checked In") {
    return "admin-dashboard__status-pill--leave";
  }

  return "admin-dashboard__status-pill--pending";
};

/* ================= MAIN COMPONENT ================= */

function HRDashboard() {
  const [dashboard, setDashboard] =
    useState<HRDashboardData | null>(null);

  const [todaysAttendance, setTodaysAttendance] =
    useState<DailyAttendanceRecord[] | null>(null);

  const [dashboardState, setDashboardState] =
    useState<LoadState>("loading");

  const [attendanceState, setAttendanceState] =
    useState<LoadState>("loading");

  const [dashboardError, setDashboardError] = useState("");
  const [attendanceError, setAttendanceError] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);

  const refresh = useCallback(() => {
    setRefreshCount((count) => count + 1);
  }, []);

  /* ================= FETCH APIS ================= */

  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      setDashboardState("loading");
      setAttendanceState("loading");
      setDashboardError("");
      setAttendanceError("");

      const [dashboardResult, dailyResult] =
        await Promise.allSettled([
          api.post<ApiResponse<HRDashboardData>>(
            "/dashboard/admin",
            { date: "" }
          ),

          api.post<ApiResponse<DailyAttendanceRecord[]>>(
            "/attendance/daily",
            { user_id: "", date: "" }
          ),
        ]);

      if (cancelled) return;

      /* DASHBOARD RESPONSE */

      if (dashboardResult.status === "fulfilled") {
        const body = dashboardResult.value.data;
        const payload = body.data;

        if (
          body.success !== false &&
          payload?.employeeStatistics &&
          payload?.attendanceStatistics &&
          payload?.leaveStatistics
        ) {
          setDashboard(payload);
          setDashboardState("success");
        } else {
          setDashboard(null);
          setDashboardState("error");
          setDashboardError(
            body.message || "Invalid dashboard response."
          );
        }
      } else {
        console.error(
          "HR Dashboard API Error:",
          dashboardResult.reason
        );

        setDashboard(null);
        setDashboardState("error");
        setDashboardError(
          getApiError(
            dashboardResult.reason,
            "Unable to load dashboard data."
          )
        );
      }

      /* DAILY ATTENDANCE RESPONSE */

      if (dailyResult.status === "fulfilled") {
        const body = dailyResult.value.data;

        if (
          body.success !== false &&
          Array.isArray(body.data)
        ) {
          setTodaysAttendance(body.data);
          setAttendanceState("success");
        } else {
          setTodaysAttendance(null);
          setAttendanceState("error");
          setAttendanceError(
            body.message || "Invalid attendance response."
          );
        }
      } else {
        console.error(
          "Daily Attendance API Error:",
          dailyResult.reason
        );

        setTodaysAttendance(null);
        setAttendanceState("error");
        setAttendanceError(
          getApiError(
            dailyResult.reason,
            "Unable to load attendance records."
          )
        );
      }
    };

    void loadAll();

    return () => {
      cancelled = true;
    };
  }, [refreshCount]);

  /* ================= DASHBOARD DATA ================= */

  const employeeStats = dashboard?.employeeStatistics;
  const attendanceStats = dashboard?.attendanceStatistics;
  const leaveStats = dashboard?.leaveStatistics;

  const isDashboardLoading = dashboardState === "loading";
  const isAttendanceLoading = attendanceState === "loading";

  const isRefreshing =
    isDashboardLoading || isAttendanceLoading;

  const attendanceReady =
    attendanceState === "success" &&
    todaysAttendance !== null;

  const dashboardReady =
    dashboardState === "success" &&
    dashboard !== null;

  const presentToday = attendanceReady
    ? todaysAttendance.filter(
        (record) => Boolean(record.checkInTime)
      ).length
    : null;

  const totalEmployees = employeeStats
    ? safeCount(employeeStats.totalEmployees)
    : null;

  const notCheckedIn =
    presentToday !== null && totalEmployees !== null
      ? Math.max(0, totalEmployees - presentToday)
      : attendanceReady
        ? safeCount(attendanceStats?.notCheckedIn)
        : null;

  /* ================= STAT CARDS ================= */

  const STATS: StatCardProps[] = [];

  if (employeeStats) {
    STATS.push(
      {
        label: "Total employees",
        value: safeCount(employeeStats.totalEmployees),
        icon: <GroupsRoundedIcon fontSize="small" />,
        trend: "Company-wide",
        trendDirection: "neutral",
      },
      {
        label: "Active employees",
        value: safeCount(employeeStats.activeEmployees),
        icon: <Diversity3RoundedIcon fontSize="small" />,
        trend: `${safeCount(
          employeeStats.inactiveEmployees
        )} inactive`,
        trendDirection: "neutral",
      }
    );
  }

  if (presentToday !== null) {
    STATS.push({
      label: "Present today",
      value: presentToday,
      icon: <TaskAltRoundedIcon fontSize="small" />,
      trend:
        notCheckedIn !== null
          ? `${notCheckedIn} not checked in`
          : "Attendance recorded",
      trendDirection: "up",
    });
  }

  if (attendanceStats && dashboardReady) {
    STATS.push(
      {
        label: "Absent today",
        value: safeCount(attendanceStats.absent),
        icon: <EventBusyRoundedIcon fontSize="small" />,
        trend: `${safeCount(
          attendanceStats.onLeave
        )} on leave`,
        trendDirection: "down",
      },
      {
        label: "On leave today",
        value: safeCount(attendanceStats.onLeave),
        icon: <BeachAccessRoundedIcon fontSize="small" />,
        trend: leaveStats
          ? `${safeCount(leaveStats.pending)} pending requests`
          : "Leave overview",
        trendDirection: "neutral",
      }
    );
  }

  /* ================= CHART DATA ================= */

  const ATTENDANCE_DISTRIBUTION = [
    {
      label: "Present",
      value:
        presentToday ??
        safeCount(
          attendanceStats?.presentToday ??
          attendanceStats?.present
        ),
    },
    {
      label: "Absent",
      value: safeCount(attendanceStats?.absent),
    },
    {
      label: "On leave",
      value: safeCount(attendanceStats?.onLeave),
    },
    {
      label: "Not checked in",
      value:
        notCheckedIn ??
        safeCount(attendanceStats?.notCheckedIn),
    },
  ];

  const LEAVE_REQUESTS_BY_STATUS = [
    {
      project: "Pending",
      members: safeCount(leaveStats?.pending),
    },
    {
      project: "Approved",
      members: safeCount(leaveStats?.approved),
    },
    {
      project: "Rejected",
      members: safeCount(leaveStats?.rejected),
    },
  ];

  /* ================= UI ================= */

  const [now] = useState(() => new Date());

  const greeting =
   now.getHours() < 12
     ? "Good Morning ☀️"
     : now.getHours() < 17
       ? "Good Afternoon ☀️"
       : "Good Evening ✨";

  const getHRName = () => {
    try {
      const raw = localStorage.getItem("loggedInUser");
      if (!raw) return "HR";

      const user = JSON.parse(raw);
      return user.name || user.fullName || "HR";
   } catch {
    return "HR";
  }
};

const [hrName] = useState(getHRName); 
  return (
    <Box component="main" className="admin-dashboard__main">

      {/* HR WELCOME BANNER */}

       <section className="emp-welcome hr-welcome">
         <div className="emp-welcome-content">
          <span className="emp-welcome-tag">
            {greeting}
          </span>

          <h2>Welcome back, {hrName}!</h2>

          <DailyInspiration />
         </div>

        <div
           className="emp-welcome-decoration"
           aria-hidden="true"
        >
       <EventAvailableRounded />
       </div>
      </section>

      {/* API ERROR MESSAGES */}

      {dashboardError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={refresh}>
              Retry
            </Button>
          }
        >
          {dashboardError}
        </Alert>
      )}

      {attendanceError && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={refresh}>
              Retry
            </Button>
          }
        >
          {attendanceError}
        </Alert>
      )}
      
      <DailyInspiration />

      {/* STAT CARDS */}

      <Box className="admin-dashboard__stats">
        {isRefreshing && STATS.length === 0 ? (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              padding: 4,
            }}
          >
            <CircularProgress size={28} sx={{ color: "#087b4d" }} />
          </Box>
        ) : STATS.length > 0 ? (
          STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))
        ) : (
          <Alert severity="info" sx={{ width: "100%" }}>
            Dashboard statistics are unavailable.
          </Alert>
        )}
      </Box>

      {/* CHARTS */}

      <Box className="admin-dashboard__charts">
        {dashboardReady ? (
          <>
            <Box sx={{ width: "100%", minWidth: 0 }}>
              <ProjectsPieChart
                title="Today's attendance breakdown"
                subtitle="Present vs absent vs on leave vs not checked in"
                data={ATTENDANCE_DISTRIBUTION}
              />
            </Box>

            <Box sx={{ width: "100%", minWidth: 0 }}>
              <TeamAllocationChart
                title="Leave requests by status"
                subtitle="Pending vs approved vs rejected requests"
                data={LEAVE_REQUESTS_BY_STATUS}
              />
            </Box>
          </>
        ) : isDashboardLoading ? (
          <Box sx={{ display: "flex", alignItems: "center", p: 4 }}>
            <CircularProgress size={25} sx={{ color: "#087b4d" }} />
          </Box>
        ) : (
          <Alert severity="info">
            Charts are unavailable until dashboard data loads.
          </Alert>
        )}
      </Box>

      {/* TODAY'S CHECK-INS */}

      <Box className="admin-dashboard__table-card">
        <Box className="admin-dashboard__table-title">
          Today's Check-ins
        </Box>

        <Box className="admin-dashboard__table-wrapper">
          <table className="admin-dashboard__table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Email</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Working Hours</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {isAttendanceLoading ? (
                <tr>
                  <td colSpan={6} className="admin-dashboard__empty-row">
                    <CircularProgress
                      size={20}
                      sx={{ color: "#087b4d" }}
                    />
                  </td>
                </tr>
              ) : !attendanceReady ? (
                <tr>
                  <td colSpan={6} className="admin-dashboard__empty-row">
                    Attendance records are unavailable.
                  </td>
                </tr>
              ) : todaysAttendance.length === 0 ? (
                <tr className="admin-dashboard__empty-table-row">
                  <td colSpan={6} className="admin-dashboard__empty-row">
                    No check-ins recorded yet today.
                  </td>
                </tr>
              ) : (
                todaysAttendance.map((record, index) => {
                  const status = attendanceStatus(record);

                  return (
                    <tr
                      key={
                        record._id ??
                        `${record.employeeId}-${index}`
                      }
                    >
                      <td data-label="Employee ID">
                        {record.employeeId || "—"}
                      </td>

                      <td data-label="Email">
                        {record.email || "—"}
                      </td>

                      <td data-label="Check-in">
                        {formatTime(record.checkInTime)}
                      </td>

                      <td data-label="Check-out">
                        {formatTime(record.checkOutTime)}
                      </td>

                      <td data-label="Working Hours">
                        {formatDuration(record.totalWorkingSeconds)}
                      </td>

                      <td data-label="Status">
                        <span
                          className={`admin-dashboard__status-pill ${statusPillClass(
                            status
                          )}`}
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
        </Box>
      </Box>
    </Box>
  );
}

export default HRDashboard;
