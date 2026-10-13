
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";

import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import PeopleOutlineOutlinedIcon from "@mui/icons-material/PeopleOutlineOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";

import api from "../../../api/axiosInstance";
import "./AdminCheckinout.css";

/* =========================================
   TYPES
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

type AttendanceStatus =
  | "Checked In"
  | "Checked Out"
  | "Not Checked In";

interface AttendanceApiResponse {
  success?: boolean;
  message?: string;
  data?: AttendanceRecord[];
}

type AttendanceCardField = {
  label: string;
  value: string;
};

/* =========================================
   HELPERS
========================================= */

const getTodayDateString = (): string => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDateTime = (
  value: string | null
): string => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDay = (value: string): string => {
  if (!value) return "-";

  const datePart = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];

  if (!datePart) {
    return value;
  }

  const [year, month, day] = datePart.split("-").map(Number);

  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDuration = (
  totalSeconds: number | null
): string => {
  if (
    totalSeconds === null ||
    totalSeconds === undefined ||
    !Number.isFinite(totalSeconds)
  ) {
    return "-";
  }

  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  return `${hours}h ${minutes}m`;
};

const attendanceStatus = (
  record: AttendanceRecord
): AttendanceStatus => {
  if (record.checkInTime && record.checkOutTime) {
    return "Checked Out";
  }

  if (record.checkInTime) {
    return "Checked In";
  }

  return "Not Checked In";
};

const statusPillClass = (
  status: AttendanceStatus
): string => {
  if (status === "Checked Out") {
    return "admin-checkinout__status-pill--out";
  }

  if (status === "Checked In") {
    return "admin-checkinout__status-pill--in";
  }

  return "admin-checkinout__status-pill--none";
};

const getErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return error instanceof Error ? error.message : fallback;
};

const getAttendanceRecords = (
  response: {
    data: AttendanceApiResponse | AttendanceRecord[];
  }
): AttendanceRecord[] => {
  const body = response.data;

  if (Array.isArray(body)) {
    return body;
  }

  if (body.success === false) {
    throw new Error(
      body.message || "Unable to retrieve attendance data."
    );
  }

  if (!Array.isArray(body.data)) {
    throw new Error("Invalid attendance API response.");
  }

  return body.data;
};

/* =========================================
   MAIN COMPONENT
========================================= */

function AdminCheckinout() {
  const [selectedDate, setSelectedDate] = useState(
    getTodayDateString
  );

  const [dailyRecords, setDailyRecords] = useState<
    AttendanceRecord[]
  >([]);

  const [historyRecords, setHistoryRecords] = useState<
    AttendanceRecord[]
  >([]);

  const [dailyLoading, setDailyLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [dailyError, setDailyError] = useState("");
  const [historyError, setHistoryError] = useState("");

  const [dailyRefresh, setDailyRefresh] = useState(0);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  /* =========================================
     DAILY ATTENDANCE
  ========================================= */

  useEffect(() => {
    let cancelled = false;

    const fetchDailyAttendance = async () => {
      if (!selectedDate) {
        setDailyRecords([]);
        setDailyError("Please select a date.");
        setDailyLoading(false);
        return;
      }

      setDailyLoading(true);
      setDailyError("");

      try {
        const response = await api.post<
          AttendanceApiResponse
        >("/attendance/daily", {
          user_id: "",
          date: selectedDate,
        });

        const records = getAttendanceRecords(response);

        if (!cancelled) {
          setDailyRecords(records);
        }
      } catch (error) {
        if (!cancelled) {
          setDailyRecords([]);
          setDailyError(
            getErrorMessage(
              error,
              "Unable to load daily attendance."
            )
          );
        }
      } finally {
        if (!cancelled) {
          setDailyLoading(false);
        }
      }
    };

    void fetchDailyAttendance();

    return () => {
      cancelled = true;
    };
  }, [selectedDate, dailyRefresh]);

  /* =========================================
     ATTENDANCE HISTORY
  ========================================= */

  useEffect(() => {
    let cancelled = false;

    const fetchHistory = async () => {
      setHistoryLoading(true);
      setHistoryError("");

      try {
        const response = await api.post<
          AttendanceApiResponse
        >("/attendance/history", {
          user_id: "",
          date: "",
        });

        const records = getAttendanceRecords(response);

        const sortedRecords = [...records].sort(
          (a, b) => {
            const dayOrder = (b.day || "").localeCompare(
              a.day || ""
            );

            if (dayOrder !== 0) {
              return dayOrder;
            }

            return (b.checkInTime || "").localeCompare(
              a.checkInTime || ""
            );
          }
        );

        if (!cancelled) {
          setHistoryRecords(sortedRecords);
        }
      } catch (error) {
        if (!cancelled) {
          setHistoryRecords([]);
          setHistoryError(
            getErrorMessage(
              error,
              "Unable to load attendance history."
            )
          );
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    };

    void fetchHistory();

    return () => {
      cancelled = true;
    };
  }, [historyRefresh]);

  /* =========================================
     DAILY SUMMARY
  ========================================= */

  const dailySummary = useMemo(() => {
    const checkedIn = dailyRecords.filter(
      (record) =>
        attendanceStatus(record) === "Checked In"
    ).length;

    const checkedOut = dailyRecords.filter(
      (record) =>
        attendanceStatus(record) === "Checked Out"
    ).length;

    const notCheckedIn = dailyRecords.filter(
      (record) =>
        attendanceStatus(record) === "Not Checked In"
    ).length;

    return {
      total: dailyRecords.length,
      checkedIn,
      checkedOut,
      notCheckedIn,
    };
  }, [dailyRecords]);

  /* =========================================
     PAGE
  ========================================= */

  return (
    <Box className="admin-checkinout">

      {/* PAGE HEADER */}

      <Box className="admin-checkinout__toolbar">
        <Box className="admin-checkinout__heading">
          <Box className="admin-checkinout__heading-icon">
            <AccessTimeOutlinedIcon />
          </Box>

          <Box className="admin-checkinout__heading-text">
            <Typography
              component="h2"
              className="admin-checkinout__title"
            >
              Employee Check In / Out
            </Typography>

            <Typography className="admin-checkinout__subtitle">
              Monitor daily attendance and employee
              working hours.
            </Typography>
          </Box>
        </Box>

        <label className="admin-checkinout__date-field">
          <span>Select Date</span>

          <input
            type="date"
            value={selectedDate}
            onChange={(event) =>
              setSelectedDate(event.target.value)
            }
          />
        </label>
      </Box>

      {/* DATE BANNER */}

      <Box className="admin-checkinout__date-banner">
        <Box className="admin-checkinout__date-banner-icon">
          <CalendarTodayOutlinedIcon />
        </Box>

        <Box>
          <Typography className="admin-checkinout__date-label">
            Daily Attendance
          </Typography>

          <Typography className="admin-checkinout__date-value">
            {formatDay(selectedDate)}
          </Typography>
        </Box>

        <Tooltip title="Refresh daily attendance">
          <span className="admin-checkinout__refresh-holder">
            <IconButton
              className="admin-checkinout__refresh-button"
              aria-label="Refresh daily attendance"
              disabled={dailyLoading}
              onClick={() =>
                setDailyRefresh((value) => value + 1)
              }
            >
              <RefreshRoundedIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* DAILY ERROR */}

      {dailyError && (
        <Alert
          severity="error"
          className="admin-checkinout__alert"
          action={
            <Button
              color="inherit"
              size="small"
              disabled={dailyLoading}
              onClick={() =>
                setDailyRefresh((value) => value + 1)
              }
            >
              Retry
            </Button>
          }
        >
          {dailyError}
        </Alert>
      )}

      {/* DAILY SUMMARY */}

      <Box className="admin-checkinout__stats">
        <StatCard
          label="Total Records"
          value={
            dailyLoading || dailyError
              ? null
              : dailySummary.total
          }
          icon={<PeopleOutlineOutlinedIcon />}
          tone="green"
        />

        <StatCard
          label="Checked In"
          value={
            dailyLoading || dailyError
              ? null
              : dailySummary.checkedIn
          }
          icon={<LoginOutlinedIcon />}
          tone="blue"
        />

        <StatCard
          label="Checked Out"
          value={
            dailyLoading || dailyError
              ? null
              : dailySummary.checkedOut
          }
          icon={<LogoutOutlinedIcon />}
          tone="purple"
        />

        <StatCard
          label="Not Checked In"
          value={
            dailyLoading || dailyError
              ? null
              : dailySummary.notCheckedIn
          }
          icon={<EventBusyOutlinedIcon />}
          tone="amber"
        />
      </Box>

      {/* DAILY RECORDS */}

      <AttendanceSection
        title="Daily Attendance Records"
        subtitle="Check-in, check-out, and recorded working hours for the selected day."
        records={dailyRecords}
        loading={dailyLoading}
        error={dailyError}
        showDay={false}
        emptyMessage="No attendance records found for this date."
      />

      {/* HISTORY HEADER */}

      <Box className="admin-checkinout__history-header">
        <Box className="admin-checkinout__heading">
          <Box className="admin-checkinout__heading-icon">
            <HistoryOutlinedIcon />
          </Box>

          <Box className="admin-checkinout__heading-text">
            <Typography
              component="h2"
              className="admin-checkinout__title"
            >
              Attendance History
            </Typography>

            <Typography className="admin-checkinout__subtitle">
              Review recorded employee attendance
              across all available dates.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          className="admin-checkinout__history-refresh"
          startIcon={
            historyLoading ? (
              <CircularProgress
                size={15}
                color="inherit"
              />
            ) : (
              <RefreshRoundedIcon />
            )
          }
          disabled={historyLoading}
          onClick={() =>
            setHistoryRefresh((value) => value + 1)
          }
        >
          Refresh
        </Button>
      </Box>

      {historyError && (
        <Alert
          severity="error"
          className="admin-checkinout__alert"
          action={
            <Button
              color="inherit"
              size="small"
              disabled={historyLoading}
              onClick={() =>
                setHistoryRefresh((value) => value + 1)
              }
            >
              Retry
            </Button>
          }
        >
          {historyError}
        </Alert>
      )}

      {/* HISTORY */}

      <AttendanceSection
        title="All Attendance History"
        subtitle="Latest recorded attendance dates are displayed first."
        records={historyRecords}
        loading={historyLoading}
        error={historyError}
        showDay
        emptyMessage="No attendance history found."
      />
    </Box>
  );
}

/* =========================================
   SUMMARY CARD
========================================= */

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number | null;
  icon: ReactNode;
  tone: "green" | "blue" | "purple" | "amber";
}) {
  return (
    <Paper
      elevation={0}
      className={`admin-checkinout__stat-card admin-checkinout__stat--${tone}`}
    >
      <Box className="admin-checkinout__stat-content">
        <Box className="admin-checkinout__stat-text">
          <Typography className="admin-checkinout__stat-label">
            {label}
          </Typography>

          <Typography className="admin-checkinout__stat-value">
            {value === null ? "—" : value}
          </Typography>
        </Box>

        <Box className="admin-checkinout__stat-icon">
          {icon}
        </Box>
      </Box>
    </Paper>
  );
}

/* =========================================
   STATUS PILL
========================================= */

function StatusPill({
  record,
}: {
  record: AttendanceRecord;
}) {
  const status = attendanceStatus(record);

  return (
    <span
      className={`admin-checkinout__status-pill ${statusPillClass(
        status
      )}`}
    >
      <span className="admin-checkinout__status-dot" />
      {status}
    </span>
  );
}

/* =========================================
   ATTENDANCE TABLE / MOBILE CARDS
========================================= */

function AttendanceSection({
  title,
  subtitle,
  records,
  loading,
  error,
  showDay,
  emptyMessage,
}: {
  title: string;
  subtitle: string;
  records: AttendanceRecord[];
  loading: boolean;
  error: string;
  showDay: boolean;
  emptyMessage: string;
}) {
  return (
    <Paper
      elevation={0}
      className="admin-checkinout__section"
    >
      <Box className="admin-checkinout__section-heading">
        <Box>
          <Typography className="admin-checkinout__section-title">
            {title}
          </Typography>

          <Typography className="admin-checkinout__section-subtitle">
            {subtitle}
          </Typography>
        </Box>

        {!loading && !error && (
          <Box className="admin-checkinout__record-count">
            <FactCheckOutlinedIcon />
            <span>
              {records.length}{" "}
              {records.length === 1
                ? "record"
                : "records"}
            </span>
          </Box>
        )}
      </Box>

      {loading ? (
        <Box className="admin-checkinout__empty">
          <CircularProgress
            size={26}
            sx={{ color: "#087b4d" }}
          />

          <Typography>
            Loading attendance records...
          </Typography>
        </Box>
      ) : error ? (
        <Box className="admin-checkinout__empty">
          <Typography>
            Attendance information is unavailable.
          </Typography>
        </Box>
      ) : records.length === 0 ? (
        <Box className="admin-checkinout__empty">
          <EventBusyOutlinedIcon />

          <Typography>{emptyMessage}</Typography>
        </Box>
      ) : (
        <>
          <TableContainer className="admin-checkinout__table-wrapper">
            <Table
              size="small"
              stickyHeader={showDay}
              className="admin-checkinout__table"
            >
              <TableHead>
                <TableRow>
                  {showDay && (
                    <TableCell>Date</TableCell>
                  )}
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Check In</TableCell>
                  <TableCell>Check Out</TableCell>
                  <TableCell>Working Hours</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {records.map((record, index) => (
                  <TableRow
                    key={
                      record._id ||
                      `${record.user_id}-${record.day}-${index}`
                    }
                    hover
                  >
                    {showDay && (
                      <TableCell>
                        {formatDay(record.day)}
                      </TableCell>
                    )}

                    <TableCell className="admin-checkinout__employee-cell">
                      {record.employeeId || "-"}
                    </TableCell>

                    <TableCell className="admin-checkinout__email-cell">
                      {record.email || "-"}
                    </TableCell>

                    <TableCell>
                      {formatDateTime(
                        record.checkInTime
                      )}
                    </TableCell>

                    <TableCell>
                      {formatDateTime(
                        record.checkOutTime
                      )}
                    </TableCell>

                    <TableCell>
                      {formatDuration(
                        record.totalWorkingSeconds
                      )}
                    </TableCell>

                    <TableCell>
                      <StatusPill record={record} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box className="admin-checkinout__mobile-list">
            {records.map((record, index) => (
              <AttendanceMobileCard
                key={
                  record._id ||
                  `${record.user_id}-${record.day}-${index}`
                }
                record={record}
                showDay={showDay}
              />
            ))}
          </Box>
        </>
      )}
    </Paper>
  );
}

/* =========================================
   MOBILE ATTENDANCE CARD
========================================= */

function AttendanceMobileCard({
  record,
  showDay,
}: {
  record: AttendanceRecord;
  showDay: boolean;
}) {
  const fields: AttendanceCardField[] = [
    ...(showDay
      ? [
          {
            label: "Date",
            value: formatDay(record.day),
          },
        ]
      : []),
    {
      label: "Check In",
      value: formatDateTime(
        record.checkInTime
      ),
    },
    {
      label: "Check Out",
      value: formatDateTime(
        record.checkOutTime
      ),
    },
    {
      label: "Working Hours",
      value: formatDuration(
        record.totalWorkingSeconds
      ),
    },
  ];

  return (
    <Paper
      elevation={0}
      className="admin-checkinout__mobile-card"
    >
      <Box className="admin-checkinout__mobile-card-header">
        <Box className="admin-checkinout__mobile-employee">
          <Typography className="admin-checkinout__mobile-employee-id">
            {record.employeeId || "-"}
          </Typography>

          <Typography className="admin-checkinout__mobile-email">
            {record.email || "-"}
          </Typography>
        </Box>

        <StatusPill record={record} />
      </Box>

      <Box className="admin-checkinout__mobile-grid">
        {fields.map((field) => (
          <Box
            key={field.label}
            className="admin-checkinout__mobile-field"
          >
            <Typography className="admin-checkinout__mobile-label">
              {field.label}
            </Typography>

            <Typography className="admin-checkinout__mobile-value">
              {field.value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

export default AdminCheckinout;
