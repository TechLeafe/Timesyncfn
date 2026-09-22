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

interface AttendanceRecord {
  user_id: string;
  employeeId: string;
  name: string;
  email: string;
  checkInTime: string;
  checkOutTime: string;
  totalWorkingSeconds: number;
  status: string;
}

interface AdminDashboardData {
  employeeStatistics: EmployeeStatistics;
  attendanceStatistics: AttendanceStatistics;
  leaveStatistics: LeaveStatistics;
  todaysAttendance: AttendanceRecord[];
}

type ApiResponse<T> = { success?: boolean; message?: string; data?: T };

const EMPTY_DATA: AdminDashboardData = {
  employeeStatistics: { totalEmployees: 0, activeEmployees: 0, inactiveEmployees: 0 },
  attendanceStatistics: { present: 0, absent: 0, onLeave: 0, notCheckedIn: 0 },
  leaveStatistics: { pending: 0, approved: 0, rejected: 0 },
  todaysAttendance: [],
};

const formatTime = (isoString?: string) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

const statusPillClass = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes("present")) return "admin-dashboard__status-pill--present";
  if (normalized.includes("absent")) return "admin-dashboard__status-pill--absent";
  if (normalized.includes("leave")) return "admin-dashboard__status-pill--leave";
  return "admin-dashboard__status-pill--pending";
};

const AdminDashboard = () => {
  const [data, setData] = useState<AdminDashboardData>(EMPTY_DATA);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await api.post<ApiResponse<AdminDashboardData>>("/dashboard/admin", { date: "" });
        const payload = response.data.data;
        if (payload) {
          setData({
            employeeStatistics: payload.employeeStatistics ?? EMPTY_DATA.employeeStatistics,
            attendanceStatistics: payload.attendanceStatistics ?? EMPTY_DATA.attendanceStatistics,
            leaveStatistics: payload.leaveStatistics ?? EMPTY_DATA.leaveStatistics,
            todaysAttendance: payload.todaysAttendance ?? [],
          });
        }
      } catch {
        setData(EMPTY_DATA);
      }
    };

    void loadDashboard();
  }, []);

  const { employeeStatistics, attendanceStatistics, leaveStatistics, todaysAttendance } = data;

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
                  <th>Employee</th>
                  <th>Employee ID</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {todaysAttendance.length > 0 ? (
                  todaysAttendance.map((record) => (
                    <tr key={record.user_id}>
                      <td>{record.name}</td>
                      <td>{record.employeeId}</td>
                      <td>{formatTime(record.checkInTime)}</td>
                      <td>{record.checkOutTime ? formatTime(record.checkOutTime) : "—"}</td>
                      <td>
                        <span className={`admin-dashboard__status-pill ${statusPillClass(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))
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
