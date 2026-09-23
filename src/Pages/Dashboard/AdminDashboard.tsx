import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import BeachAccessRoundedIcon from "@mui/icons-material/BeachAccessRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import Diversity3RoundedIcon from "@mui/icons-material/Diversity3Rounded";

import StatCard from "../../Components/Dashboard/StatCard/StatCard"
import ProjectsPieChart from "../../Components/Dashboard/Chart/ProjectsPieChart"
import TeamAllocationChart from "../../Components/Dashboard/Chart/TeamAllocationChart"
import type { StatCardProps } from "../../Components/Dashboard/StatCard/StatCard";
import api from "../../api/axiosInstance";
import "./Dashboard.css";

interface EmployeeStatistics {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
}

interface AttendanceStatistics {
  present: number;
  absent: number;
  onLeave: number;
  notCheckedIn: number;
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

/* Matches the real Daily Attendance API response — no name/status field,
   only employeeId / email / user_id / times. */
interface DailyAttendanceRecord {
  _id?: string;
  user_id: string;
  employeeId: string;
  email: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  totalWorkingSeconds: number | null;
}

type ApiResponse<T> = { success?: boolean; message?: string; data?: T };

const EMPTY_DATA: AdminDashboardData = {
  employeeStatistics: { totalEmployees: 0, activeEmployees: 0, inactiveEmployees: 0 },
  attendanceStatistics: { present: 0, absent: 0, onLeave: 0, notCheckedIn: 0 },
  leaveStatistics: { pending: 0, approved: 0, rejected: 0 },
};

const formatTime = (isoString?: string | null) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

const attendanceStatus = (record: DailyAttendanceRecord) => {
  if (record.checkInTime && record.checkOutTime) return "Checked Out";
  if (record.checkInTime) return "Checked In";
  return "Not Checked In";
};

const statusPillClass = (status: string) => {
  if (status === "Checked Out") return "admin-dashboard__status-pill--present";
  if (status === "Checked In") return "admin-dashboard__status-pill--leave";
  return "admin-dashboard__status-pill--pending";
};

const AdminDashboard = () => {
  const [data, setData] = useState<AdminDashboardData>(EMPTY_DATA);
  const [todaysAttendance, setTodaysAttendance] = useState<DailyAttendanceRecord[]>([]);

  useEffect(() => {
    const loadAll = async () => {
      // Run both requests together, then combine them — Present/Not-checked-in
      // needs both totalEmployees (from the dashboard) and the real check-in
      // list (from Daily Attendance) to compute correctly.
      const [dashboardResult, dailyResult] = await Promise.allSettled([
        api.post<ApiResponse<AdminDashboardData>>("/dashboard/admin", { date: "" }),
        api.post<ApiResponse<DailyAttendanceRecord[]>>("/attendance/daily", { user_id: "", date: "" }),
      ]);

      let employeeStatistics = EMPTY_DATA.employeeStatistics;
      let leaveStatistics = EMPTY_DATA.leaveStatistics;
      // absent/onLeave have no independent source here — they can only
      // come from the dashboard's own numbers, with 0 as a safe fallback
      // for any field it doesn't actually populate.
      let dashboardAbsent = 0;
      let dashboardOnLeave = 0;

      if (dashboardResult.status === "fulfilled") {
        console.log("Admin dashboard response:", dashboardResult.value.data);

        const payload = dashboardResult.value.data.data;
        if (payload) {
          employeeStatistics = payload.employeeStatistics ?? EMPTY_DATA.employeeStatistics;
          leaveStatistics = payload.leaveStatistics ?? EMPTY_DATA.leaveStatistics;
          dashboardAbsent = payload.attendanceStatistics?.absent ?? 0;
          dashboardOnLeave = payload.attendanceStatistics?.onLeave ?? 0;
        }
      } else {
        console.error("Admin dashboard error:", dashboardResult.reason);
      }

      let records: DailyAttendanceRecord[] = [];

      if (dailyResult.status === "fulfilled") {
        console.log("Today's check-ins (daily attendance):", dailyResult.value.data);

        const dailyData = dailyResult.value.data.data;
        records = Array.isArray(dailyData) ? dailyData : [];
      } else {
        console.error("Daily attendance error:", dailyResult.reason);
      }

      setTodaysAttendance(records);

      // Present = anyone with a real check-in today, computed from the
      // actual attendance records rather than the dashboard's own
      // (unreliable) present/notCheckedIn fields.
      const present = records.filter((record) => record.checkInTime).length;
      const notCheckedIn = Math.max(0, employeeStatistics.totalEmployees - present);

      setData({
        employeeStatistics,
        leaveStatistics,
        attendanceStatistics: {
          present,
          notCheckedIn,
          absent: dashboardAbsent,
          onLeave: dashboardOnLeave,
        },
      });
    };

    void loadAll();
  }, []);

  const { employeeStatistics, attendanceStatistics, leaveStatistics } = data;

  const STATS: StatCardProps[] = [
    {
      label: "Total employees",
      value: employeeStatistics.totalEmployees,
      icon: <GroupsRoundedIcon fontSize="small" />,
      trend: "Company-wide",
      trendDirection: "neutral",
    },
    {
      label: "Active employees",
      value: employeeStatistics.activeEmployees,
      icon: <Diversity3RoundedIcon fontSize="small" />,
      trend: `${employeeStatistics.inactiveEmployees} inactive`,
      trendDirection: "neutral",
    },
    {
      label: "Present today",
      value: attendanceStatistics.present,
      icon: <TaskAltRoundedIcon fontSize="small" />,
      trend: `${attendanceStatistics.notCheckedIn} not checked in`,
      trendDirection: "up",
    },
    {
      label: "Absent today",
      value: attendanceStatistics.absent,
      icon: <EventBusyRoundedIcon fontSize="small" />,
      trend: `${attendanceStatistics.onLeave} on leave`,
      trendDirection: "down",
    },
    {
      label: "On leave today",
      value: attendanceStatistics.onLeave,
      icon: <BeachAccessRoundedIcon fontSize="small" />,
      trend: `${leaveStatistics.pending} pending requests`,
      trendDirection: "neutral",
    },
  ];

  const ATTENDANCE_DISTRIBUTION = [
    { label: "Present", value: attendanceStatistics.present },
    { label: "Absent", value: attendanceStatistics.absent },
    { label: "On leave", value: attendanceStatistics.onLeave },
    { label: "Not checked in", value: attendanceStatistics.notCheckedIn },
  ];

  const LEAVE_REQUESTS_BY_STATUS = [
    { project: "Pending", members: leaveStatistics.pending },
    { project: "Approved", members: leaveStatistics.approved },
    { project: "Rejected", members: leaveStatistics.rejected },
  ];

  return (
      <Box component="main" className="admin-dashboard__main">
        <Box className="admin-dashboard__stats">
          {STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </Box>

        <Box className="admin-dashboard__charts">
          <ProjectsPieChart
            title="Today's attendance breakdown"
            subtitle="Present vs absent vs on leave vs not checked in"
            data={ATTENDANCE_DISTRIBUTION}
          />
          <TeamAllocationChart
            title="Leave requests by status"
            subtitle="Pending vs approved vs rejected requests"
            data={LEAVE_REQUESTS_BY_STATUS}
          />
        </Box>

        <Box className="admin-dashboard__table-card">
          <Box className="admin-dashboard__table-title">Today's Check-ins</Box>
          <Box className="admin-dashboard__table-wrapper">
            <table className="admin-dashboard__table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Email</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {todaysAttendance.length > 0 ? (
                  todaysAttendance.map((record, index) => {
                    const status = attendanceStatus(record);

                    return (
                      <tr key={record._id ?? `${record.employeeId}-${index}`}>
                        <td>{record.employeeId || "-"}</td>
                        <td>{record.email || "-"}</td>
                        <td>{formatTime(record.checkInTime)}</td>
                        <td>{formatTime(record.checkOutTime)}</td>
                        <td>
                          <span className={`admin-dashboard__status-pill ${statusPillClass(status)}`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="admin-dashboard__empty-row">
                      No check-ins recorded yet today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Box>
        </Box>
      </Box>
  );
};

export default AdminDashboard;
