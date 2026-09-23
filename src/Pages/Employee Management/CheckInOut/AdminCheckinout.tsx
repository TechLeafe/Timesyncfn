import { useEffect, useState } from "react";

import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";

import api from "../../../api/axiosInstance";

import "./AdminCheckinout.css";

/* =========================================
   TYPES

   Matches the real Daily Attendance and
   Attendance History API response shapes —
   both return the same record shape. Note
   there is no employee name field, only
   employeeId / email / user_id.
========================================= */

interface AttendanceRecord {
  _id: string;
  day: string;
  user_id: string;
  employeeId: string;
  email: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  totalWorkingSeconds: number | null;
}

/* =========================================
   HELPERS
========================================= */

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const formatDay = (value: string) => {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatDuration = (totalSeconds: number | null) => {
  if (totalSeconds === null || totalSeconds === undefined) {
    return "-";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const attendanceStatus = (record: AttendanceRecord) => {
  if (record.checkInTime && record.checkOutTime) return "Checked Out";
  if (record.checkInTime) return "Checked In";
  return "Not Checked In";
};

const statusPillClass = (status: string) => {
  if (status === "Checked Out") return "admin-checkinout__status-pill--out";
  if (status === "Checked In") return "admin-checkinout__status-pill--in";
  return "admin-checkinout__status-pill--none";
};

/* =========================================
   COMPONENT

   HR / Admin only. Two sections:
   1. A given day's attendance for everyone (Daily Attendance API),
      with a date picker to browse any day.
   2. The full attendance history for everyone, across all days
      (Attendance History API), newest first.
   Access to this page itself is gated by the route
   (ProtectedRoute allowedRoles=[HR, ADMIN]).
========================================= */

const AdminCheckinout = () => {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [dailyRecords, setDailyRecords] = useState<AttendanceRecord[]>([]);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError] = useState("");

  const [historyRecords, setHistoryRecords] = useState<AttendanceRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  /* =========================================
     FETCH EVERYONE'S ATTENDANCE FOR THE SELECTED DAY
     POST /attendance/daily  { user_id: "", date }
  ========================================= */

  useEffect(() => {
    const fetchDailyAttendance = async () => {
      try {
        setDailyLoading(true);
        setDailyError("");

        const response = await api.post("/attendance/daily", {
          user_id: "",
          date: selectedDate,
        });

        console.log("Daily attendance:", response.data);

        const data = response.data?.data ?? response.data;

        setDailyRecords(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("Daily attendance error:", err);

        setDailyError(err.response?.data?.message || "Unable to load attendance records.");
      } finally {
        setDailyLoading(false);
      }
    };

    fetchDailyAttendance();
  }, [selectedDate]);

  /* =========================================
     FETCH EVERYONE'S FULL ATTENDANCE HISTORY
     POST /attendance/history  { user_id: "", date: "" }
  ========================================= */

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setHistoryLoading(true);
        setHistoryError("");

        const response = await api.post("/attendance/history", {
          user_id: "",
          date: "",
        });

        console.log("Attendance history:", response.data);

        const data = response.data?.data ?? response.data;

        const records: AttendanceRecord[] = Array.isArray(data) ? data : [];

        // Newest day first, so the most recent activity is easy to find.
        records.sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));

        setHistoryRecords(records);
      } catch (err: any) {
        console.error("Attendance history error:", err);

        setHistoryError(err.response?.data?.message || "Unable to load attendance history.");
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, []);

  /* =========================================
     VIEW
  ========================================= */

  return (
    <Box sx={{ width: "100%", fontFamily: "var(--font-family)" }}>
      {/* ==================== DAILY ATTENDANCE ==================== */}

      <Box className="admin-checkinout__toolbar">
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              backgroundColor: "#E8F5E9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#1B6B33",
            }}
          >
            <AccessTimeOutlinedIcon />
          </Box>

          <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#1B6B33" }}>
              Employee Check In / Out
            </Typography>

            <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
              View every employee's check-in and check-out records.
            </Typography>
          </Box>
        </Box>

        <label className="admin-checkinout__date-field">
          <span>Date</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </label>
      </Box>

      {dailyError && (
        <Typography sx={{ mb: 2, color: "#D42B2B", fontSize: 13 }}>
          {dailyError}
        </Typography>
      )}

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: "14px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          mb: 4,
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#F8FAFC" }}>
              <TableCell>Employee ID</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Check In</TableCell>
              <TableCell>Check Out</TableCell>
              <TableCell>Working Hours</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {dailyLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : dailyRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No attendance records found for this date.
                </TableCell>
              </TableRow>
            ) : (
              dailyRecords.map((record, index) => {
                const status = attendanceStatus(record);

                return (
                  <TableRow key={record._id ?? `${record.employeeId}-${index}`} hover>
                    <TableCell>{record.employeeId || "-"}</TableCell>
                    <TableCell>{record.email || "-"}</TableCell>
                    <TableCell>{formatDateTime(record.checkInTime)}</TableCell>
                    <TableCell>{formatDateTime(record.checkOutTime)}</TableCell>
                    <TableCell>{formatDuration(record.totalWorkingSeconds)}</TableCell>
                    <TableCell>
                      <span className={`admin-checkinout__status-pill ${statusPillClass(status)}`}>
                        {status}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ==================== ATTENDANCE HISTORY ==================== */}

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "12px",
            backgroundColor: "#E8F5E9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#1B6B33",
          }}
        >
          <HistoryOutlinedIcon />
        </Box>

        <Box>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#1B6B33" }}>
            Attendance History
          </Typography>

          <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
            Every employee's check-in and check-out record, across all days.
          </Typography>
        </Box>
      </Box>

      {historyError && (
        <Typography sx={{ mb: 2, color: "#D42B2B", fontSize: 13 }}>
          {historyError}
        </Typography>
      )}

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: "14px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          maxHeight: 480,
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#F8FAFC" }}>
              <TableCell>Date</TableCell>
              <TableCell>Employee ID</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Check In</TableCell>
              <TableCell>Check Out</TableCell>
              <TableCell>Working Hours</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {historyLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : historyRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No attendance history found.
                </TableCell>
              </TableRow>
            ) : (
              historyRecords.map((record, index) => {
                const status = attendanceStatus(record);

                return (
                  <TableRow key={record._id ?? `${record.employeeId}-${record.day}-${index}`} hover>
                    <TableCell>{formatDay(record.day)}</TableCell>
                    <TableCell>{record.employeeId || "-"}</TableCell>
                    <TableCell>{record.email || "-"}</TableCell>
                    <TableCell>{formatDateTime(record.checkInTime)}</TableCell>
                    <TableCell>{formatDateTime(record.checkOutTime)}</TableCell>
                    <TableCell>{formatDuration(record.totalWorkingSeconds)}</TableCell>
                    <TableCell>
                      <span className={`admin-checkinout__status-pill ${statusPillClass(status)}`}>
                        {status}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AdminCheckinout;
