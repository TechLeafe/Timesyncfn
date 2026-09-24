import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";

import StatCard from "../../Components/Dashboard/StatCard/StatCard"
import ProjectsPieChart from "../../Components/Dashboard/Chart/ProjectsPieChart"
import TeamAllocationChart from "../../Components/Dashboard/Chart/TeamAllocationChart"
import type { StatCardProps } from "../../Components/Dashboard/StatCard/StatCard";
import api from "../../api/axiosInstance";
import "./Dashboard.css";

interface LeaveBalance {
  casualLeave: number;
  sickLeave: number;
  earnedLeave: number;
  permission: number;
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

/* Matches the real Attendance History API response */
interface AttendanceHistoryRecord {
  _id: string;
  day: string; // "YYYY-MM-DD"
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

interface EmployeeDashboardData {
  workingHours: WorkingHours;
  leaveBalance: LeaveBalance;
  leaveRequestSummary: LeaveRequestSummary;
  todaysAttendance: TodaysAttendance;
}

type ApiResponse<T> = { success?: boolean; message?: string; data?: T };

const EMPTY_DATA: EmployeeDashboardData = {
  workingHours: { today: 0, thisMonth: 0, averagePerDay: 0 },
  leaveBalance: { casualLeave: 0, sickLeave: 0, earnedLeave: 0, permission: 0 },
  leaveRequestSummary: { pending: 0, approved: 0, rejected: 0 },
  todaysAttendance: { isCheckedIn: false, isCheckedOut: false },
};

const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getLoggedInUser = (): any => {
  const stored = localStorage.getItem("loggedInUser");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

/*
  Computes "today" and "this month" working hours directly from the
  Attendance History API instead of trusting /dashboard/employee's
  own workingHours object, which this backend doesn't reliably populate.
  Falls back to todaysAttendance's live seconds for a day still in progress
  (checked in, not yet checked out — so history has no total for it yet).
*/
const computeWorkingHours = (
  history: AttendanceHistoryRecord[],
  attendance: TodaysAttendance
): WorkingHours => {
  const todayStr = getTodayDateString();
  const monthPrefix = todayStr.slice(0, 7); // "YYYY-MM"

  const todayRecord = history.find((record) => record.day === todayStr);

  const liveTodaySeconds = attendance.currentWorkingSeconds ?? attendance.totalWorkingSeconds ?? 0;

  const todaySeconds = todayRecord?.totalWorkingSeconds ?? liveTodaySeconds ?? 0;

  const monthRecordsWithTotals = history.filter(
    (record) => record.day?.startsWith(monthPrefix) && typeof record.totalWorkingSeconds === "number"
  );

  const monthSecondsFromHistory = monthRecordsWithTotals.reduce(
    (sum, record) => sum + (record.totalWorkingSeconds ?? 0),
    0
  );

  // If today's session isn't finished yet (no completed total in history),
  // add its live in-progress seconds to the month total too.
  const todayAlreadyCounted = monthRecordsWithTotals.some((record) => record.day === todayStr);
  const thisMonth = todayAlreadyCounted ? monthSecondsFromHistory : monthSecondsFromHistory + todaySeconds;

  const daysWorkedThisMonth = monthRecordsWithTotals.length + (todayAlreadyCounted || todaySeconds === 0 ? 0 : 1);

  const averagePerDay = daysWorkedThisMonth > 0 ? Math.round(thisMonth / daysWorkedThisMonth) : 0;

  return { today: todaySeconds, thisMonth, averagePerDay };
};

const EmployeeDashboard = () => {
  const [data, setData] = useState<EmployeeDashboardData>(EMPTY_DATA);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const dashboardResponse = await api.post<ApiResponse<EmployeeDashboardData>>("/dashboard/employee", { date: "" });

        console.log("Employee dashboard response:", dashboardResponse.data);

        const payload = dashboardResponse.data.data;

        const attendance = payload?.todaysAttendance ?? EMPTY_DATA.todaysAttendance;
        const leaveBalance = payload?.leaveBalance ?? EMPTY_DATA.leaveBalance;
        const leaveRequestSummary = payload?.leaveRequestSummary ?? EMPTY_DATA.leaveRequestSummary;

        // employeeInformation.user_id isn't reliably present in the real
        // response, so — same fix as the check-in page — fetch everyone's
        // history with an empty user_id and filter down to this person by
        // employeeId / email from localStorage, instead of depending on it.
        let workingHours = EMPTY_DATA.workingHours;

        try {
          const historyResponse = await api.post<ApiResponse<AttendanceHistoryRecord[]>>("/attendance/history", {
            user_id: "",
            date: "",
          });

          console.log("Attendance history (all employees):", historyResponse.data);

          const allHistory = historyResponse.data.data;

          if (Array.isArray(allHistory)) {
            const loggedInUser = getLoggedInUser();
            const myEmployeeId: string | undefined = loggedInUser?.userId ?? loggedInUser?.employeeId;
            const myEmail: string | undefined = loggedInUser?.email;

            const myHistory = allHistory.filter(
              (record) =>
                (myEmployeeId && record.employeeId === myEmployeeId) ||
                (myEmail && record.email === myEmail)
            );

            workingHours = computeWorkingHours(myHistory, attendance);
          }
        } catch (historyErr) {
          console.error("Attendance history error:", historyErr);
          // Fall back to today's live seconds only if history couldn't be loaded.
          workingHours = {
            today: attendance.currentWorkingSeconds ?? attendance.totalWorkingSeconds ?? 0,
            thisMonth: 0,
            averagePerDay: 0,
          };
        }

        setData({ workingHours, leaveBalance, leaveRequestSummary, todaysAttendance: attendance });
      } catch (err) {
        console.error("Employee dashboard error:", err);
        setData(EMPTY_DATA);
      }
    };

    void loadDashboard();
  }, []);

  const { workingHours, leaveBalance, leaveRequestSummary, todaysAttendance } = data;

  const STATS: StatCardProps[] = [
    {
      label: "Working hours today",
      value: formatDuration(workingHours.today),
      icon: <AccessTimeOutlinedIcon fontSize="small" />,
      trend: todaysAttendance.isCheckedIn ? "Checked in" : "Checked out",
      trendDirection: "neutral",
    },
    {
      label: "This month's hours",
      value: formatDuration(workingHours.thisMonth),
      icon: <TaskAltRoundedIcon fontSize="small" />,
      trend: `Avg ${formatDuration(workingHours.averagePerDay)}/day`,
      trendDirection: "neutral",
    },
    {
      label: "Pending leave requests",
      value: leaveRequestSummary.pending,
      icon: <PendingActionsRoundedIcon fontSize="small" />,
      trend: `${leaveRequestSummary.approved} approved, ${leaveRequestSummary.rejected} rejected`,
      trendDirection: "neutral",
    },
  ];

  const LEAVE_BALANCE_DISTRIBUTION = [
    { label: "Casual Leave", value: leaveBalance.casualLeave },
    { label: "Sick Leave", value: leaveBalance.sickLeave },
    { label: "Earned Leave", value: leaveBalance.earnedLeave },
    { label: "Permission", value: leaveBalance.permission },
  ];

  const LEAVE_REQUESTS_BY_STATUS = [
    { project: "Pending", members: leaveRequestSummary.pending },
    { project: "Approved", members: leaveRequestSummary.approved },
    { project: "Rejected", members: leaveRequestSummary.rejected },
  ];

  return (
      <Box component="main" className="admin-dashboard__main">
        <Box className="admin-dashboard__stats employee-dashbaord_status">
          {STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </Box>

        <Box className="admin-dashboard__charts">
          <ProjectsPieChart
            title="Your leave balance"
            subtitle="Casual vs sick vs earned vs permission days remaining"
            data={LEAVE_BALANCE_DISTRIBUTION}
          />
          <TeamAllocationChart
            title="Leave requests by status"
            subtitle="Pending vs approved vs rejected requests"
            data={LEAVE_REQUESTS_BY_STATUS}
          />
        </Box>
      </Box>
  );
};

export default EmployeeDashboard;
