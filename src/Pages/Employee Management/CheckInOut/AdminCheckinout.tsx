
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
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
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";

import api from "../../../api/axiosInstance";
import { downloadExcelFile } from "../../../utils/excel";
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
  actualWorkingSeconds?: number;
  requestedPermissionHours?: number;
  approvedPermissionRequestedHours?: number;
  approvedPermissionHours?: number;
  permissionStatus?: string | null;
  totalCreditedWorkingSeconds?: number;
  monthlyPermissionAllowanceHours?: number;
  monthlyPermissionUsedHours?: number;
  monthlyPermissionRemainingHours?: number;
  employeeName?: string;
  permissionRequests?: {
    totalHours: number;
    status: string;
  }[];
  attendanceStatus?: string;
  approvalStatus?: "Pending" | "Approved" | "Rejected";
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

type AttendanceFilterField =
  | "date"
  | "employeeId"
  | "email"
  | "checkIn"
  | "checkOut";

type AttendanceFilter = {
  field: AttendanceFilterField;
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

const formatPermissionHours = (hours?: number): string =>
  formatDuration(
    Number.isFinite(hours) ? Number(hours) * 3600 : null
  );

const formatPermissionRequests = (
  requests?: AttendanceRecord["permissionRequests"]
): string =>
  requests?.length
    ? requests
        .map(
          (request) =>
            `${formatPermissionHours(request.totalHours)} ${request.status}`
        )
        .join(", ")
    : "-";

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
  const [approvalRecords, setApprovalRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [approvalLoading, setApprovalLoading] = useState(true);
  const [approvalError, setApprovalError] = useState("");
  const [reviewingId, setReviewingId] = useState("");

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

  useEffect(() => {
    let cancelled = false;

    const fetchApprovals = async () => {
      setApprovalLoading(true);
      setApprovalError("");
      try {
        const response = await api.post<AttendanceApiResponse>(
          "/attendance/approvals",
          {}
        );
        const records = getAttendanceRecords(response);
        if (!cancelled) setApprovalRecords(records);
      } catch (error) {
        if (!cancelled) {
          setApprovalError(
            getErrorMessage(error, "Unable to load attendance approvals.")
          );
        }
      } finally {
        if (!cancelled) setApprovalLoading(false);
      }
    };

    void fetchApprovals();
    return () => {
      cancelled = true;
    };
  }, [dailyRefresh, historyRefresh]);

  const handleAttendanceReview = async (
    record: AttendanceRecord,
    decision: "Approved" | "Rejected"
  ) => {
    setReviewingId(record._id);
    setApprovalError("");
    try {
      await api.post("/attendance/review", {
        attendanceId: record._id,
        decision,
      });
      setApprovalRecords((current) =>
        current.filter((item) => item._id !== record._id)
      );
      setDailyRefresh((value) => value + 1);
      setHistoryRefresh((value) => value + 1);
    } catch (error) {
      setApprovalError(
        getErrorMessage(error, "Unable to review attendance.")
      );
    } finally {
      setReviewingId("");
    }
  };

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

      <Paper
        elevation={0}
        className="admin-checkinout__section"
        sx={{ p: 2 }}
      >
        <Box className="admin-checkinout__section-heading">
          <Box>
            <Typography className="admin-checkinout__section-title">
              Previous Day Attendance Approval
            </Typography>
            <Typography className="admin-checkinout__section-subtitle">
              Review attendance calculated after the workday is complete.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            disabled={approvalLoading}
            onClick={() => setHistoryRefresh((value) => value + 1)}
          >
            Refresh
          </Button>
        </Box>

        {approvalError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {approvalError}
          </Alert>
        )}

        {approvalLoading ? (
          <Box className="admin-checkinout__empty">
            <CircularProgress size={24} />
            <Typography>Loading pending approvals...</Typography>
          </Box>
        ) : approvalRecords.length === 0 ? (
          <Box className="admin-checkinout__empty">
            <Typography>No attendance approvals are pending.</Typography>
          </Box>
        ) : (
          <TableContainer sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Check In</TableCell>
                  <TableCell>Hours</TableCell>
                  <TableCell>Suggested Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {approvalRecords.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>{formatDay(record.day)}</TableCell>
                    <TableCell>{record.employeeId}</TableCell>
                    <TableCell>{record.email}</TableCell>
                    <TableCell>
                      {formatDateTime(record.checkInTime)}
                    </TableCell>
                    <TableCell>
                      {formatDuration(record.totalWorkingSeconds)}
                    </TableCell>
                    <TableCell>
                      {record.attendanceStatus || "Pending"}
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 1,
                        }}
                      >
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          disabled={Boolean(reviewingId)}
                          onClick={() =>
                            void handleAttendanceReview(record, "Approved")
                          }
                        >
                          {reviewingId === record._id
                            ? "Saving..."
                            : "Approve"}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          disabled={Boolean(reviewingId)}
                          onClick={() =>
                            void handleAttendanceReview(record, "Rejected")
                          }
                        >
                          Reject
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

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
  const [filterAnchor, setFilterAnchor] =
    useState<HTMLElement | null>(null);
  const [filterField, setFilterField] =
    useState<AttendanceFilterField>(
      showDay ? "date" : "employeeId"
    );
  const [filterValue, setFilterValue] = useState("");
  const [appliedFilter, setAppliedFilter] =
    useState<AttendanceFilter>({
      field: showDay ? "date" : "employeeId",
      value: "",
    });

  const filterOptions: {
    field: AttendanceFilterField;
    label: string;
  }[] = showDay
    ? [
        { field: "date", label: "Date" },
        { field: "employeeId", label: "Employee ID" },
        { field: "email", label: "Email" },
      ]
    : [
        { field: "employeeId", label: "Employee ID" },
        { field: "email", label: "Email" },
      ];

  const filteredRecords = useMemo(() => {
    const term = appliedFilter.value.trim().toLowerCase();
    if (!term) return records;

    return records.filter((record) => {
      const value = {
        date: record.day?.slice(0, 10) || "",
        employeeId: record.employeeId || "",
        email: record.email || "",
        checkIn: formatDateTime(record.checkInTime),
        checkOut: formatDateTime(record.checkOutTime),
      }[appliedFilter.field];

      return value.toLowerCase().includes(term);
    });
  }, [appliedFilter, records]);

  const downloadAttendanceExcel = () => {
    const headers = [
      ...(showDay ? ["Date"] : []),
      "Employee ID",
      "Employee Name",
      "Email",
      "Check In",
      "Check Out",
      "Working Hours",
      "Requested Permission",
      "Permission Requests",
      "Permission Status",
      "Approved Permission",
      "Eligible Permission",
      "Credited Working Hours",
      "Monthly Allowance",
      "Monthly Used",
      "Monthly Remaining",
      "Final Attendance Status",
      "Approval Status",
    ];
    const rows = [
      headers,
      ...filteredRecords.map((record) => [
        ...(showDay ? [formatDay(record.day)] : []),
        record.employeeId || "-",
        record.employeeName || "-",
        record.email || "-",
        formatDateTime(record.checkInTime),
        formatDateTime(record.checkOutTime),
        formatDuration(record.actualWorkingSeconds ?? record.totalWorkingSeconds),
        formatPermissionHours(record.requestedPermissionHours),
        formatPermissionRequests(record.permissionRequests),
        record.permissionStatus || "-",
        formatPermissionHours(record.approvedPermissionRequestedHours),
        formatPermissionHours(record.approvedPermissionHours),
        formatDuration(record.totalCreditedWorkingSeconds ?? null),
        formatPermissionHours(record.monthlyPermissionAllowanceHours),
        formatPermissionHours(record.monthlyPermissionUsedHours),
        formatPermissionHours(record.monthlyPermissionRemainingHours),
        record.attendanceStatus || "Pending",
        record.approvalStatus || "-",
      ]),
    ];

    downloadExcelFile({
      rows,
      fileName: showDay
        ? "attendance-history.xlsx"
        : "daily-attendance.xlsx",
      sheetName: showDay ? "Attendance History" : "Daily Attendance",
      columnWidths: showDay
        ? [18, 18, 24, 32, 18, 18, 18, 16, 28, 20, 18, 18, 18, 18, 18, 18, 22, 18]
        : [18, 24, 32, 18, 18, 18, 16, 28, 20, 18, 18, 18, 18, 18, 18, 22, 18],
    });
  };

  const applyFilter = () => {
    setAppliedFilter({ field: filterField, value: filterValue });
    setFilterAnchor(null);
  };

  const clearFilter = () => {
    setFilterValue("");
    setAppliedFilter({ field: filterField, value: "" });
    setFilterAnchor(null);
  };

  return (
    <Paper
      elevation={0}
      className="admin-checkinout__section"
    >
      <Box className="admin-checkinout__section-heading">
        <Box className="admin-checkinout__section-heading-copy">
          <Typography className="admin-checkinout__section-title">
            {title}
          </Typography>

          <Typography className="admin-checkinout__section-subtitle">
            {subtitle}
          </Typography>
        </Box>

        <Box className="admin-checkinout__section-actions">
          <Button
            variant="outlined"
            className="admin-checkinout__filter-button"
            startIcon={<FilterListRoundedIcon />}
            aria-haspopup="menu"
            aria-expanded={Boolean(filterAnchor)}
            onClick={(event) => setFilterAnchor(event.currentTarget)}
          >
            Filter
          </Button>
          <Menu
            anchorEl={filterAnchor}
            open={Boolean(filterAnchor)}
            onClose={() => setFilterAnchor(null)}
            slotProps={{ paper: { sx: { minWidth: 250, p: 1 } } }}
          >
            <Typography
              variant="subtitle2"
              sx={{ px: 1.5, py: 1, fontWeight: 700 }}
            >
              Filter By
            </Typography>
            {filterOptions.map(({ field, label }) => (
              <MenuItem
                key={field}
                selected={filterField === field}
                onClick={() => setFilterField(field)}
              >
                {label}
              </MenuItem>
            ))}
            <Box
              sx={{ p: 1.5, width: 270 }}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <TextField
                fullWidth
                size="small"
                type={filterField === "date" ? "date" : "text"}
                label={filterField === "date" ? undefined : "Search"}
                value={filterValue}
                onChange={(event) => setFilterValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applyFilter();
                }}
                slotProps={
                  filterField === "date"
                    ? { inputLabel: { shrink: true } }
                    : undefined
                }
              />
              <Box className="admin-checkinout__filter-actions">
                <Button
                  variant="outlined"
                  className="admin-checkinout__filter-clear"
                  onClick={clearFilter}
                >
                  Clear
                </Button>
                <Button
                  variant="contained"
                  className="admin-checkinout__filter-apply"
                  onClick={applyFilter}
                >
                  Apply
                </Button>
              </Box>
            </Box>
          </Menu>
          <Button
            variant="outlined"
            className="admin-checkinout__excel-button"
            startIcon={<FileDownloadOutlinedIcon />}
            disabled={loading || Boolean(error)}
            onClick={downloadAttendanceExcel}
          >
            Download
          </Button>
        {!loading && !error && (
          <Box className="admin-checkinout__record-count">
            <FactCheckOutlinedIcon />
            <span>
              {filteredRecords.length}{" "}
              {filteredRecords.length === 1
                ? "record"
                : "records"}
            </span>
          </Box>
        )}
        </Box>
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
      ) : filteredRecords.length === 0 ? (
        <Box className="admin-checkinout__empty">
          <EventBusyOutlinedIcon />

          <Typography>
            {records.length > 0
              ? "No attendance records match this filter."
              : emptyMessage}
          </Typography>
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
                  <TableCell>Employee Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Check In</TableCell>
                  <TableCell>Check Out</TableCell>
                  <TableCell>Actual Hours</TableCell>
                  <TableCell>Requested Permission</TableCell>
                  <TableCell>Permission Requests</TableCell>
                  <TableCell>Permission Status</TableCell>
                  <TableCell>Approved Permission</TableCell>
                  <TableCell>Eligible Permission</TableCell>
                  <TableCell>Credited Hours</TableCell>
                  <TableCell>Monthly Allowance</TableCell>
                  <TableCell>Monthly Used</TableCell>
                  <TableCell>Monthly Remaining</TableCell>
                  <TableCell>Final Status</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredRecords.map((record, index) => (
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

                    <TableCell>{record.employeeName || "-"}</TableCell>

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
                      {formatDuration(record.actualWorkingSeconds ?? record.totalWorkingSeconds)}
                    </TableCell>

                    <TableCell>
                      {formatPermissionHours(record.requestedPermissionHours)}
                    </TableCell>

                    <TableCell>
                      {formatPermissionRequests(record.permissionRequests)}
                    </TableCell>

                    <TableCell>{record.permissionStatus || "-"}</TableCell>

                    <TableCell>
                      {formatPermissionHours(record.approvedPermissionRequestedHours)}
                    </TableCell>

                    <TableCell>
                      {formatPermissionHours(record.approvedPermissionHours)}
                    </TableCell>

                    <TableCell>
                      {formatDuration(record.totalCreditedWorkingSeconds ?? null)}
                    </TableCell>

                    <TableCell>
                      {formatPermissionHours(record.monthlyPermissionAllowanceHours)}
                    </TableCell>

                    <TableCell>
                      {formatPermissionHours(record.monthlyPermissionUsedHours)}
                    </TableCell>

                    <TableCell>
                      {formatPermissionHours(record.monthlyPermissionRemainingHours)}
                    </TableCell>

                    <TableCell>
                      {record.attendanceStatus || "Pending"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box className="admin-checkinout__mobile-list">
            {filteredRecords.map((record, index) => (
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
        record.actualWorkingSeconds ?? record.totalWorkingSeconds
      ),
    },
    {
      label: "Requested Permission",
      value: formatPermissionHours(record.requestedPermissionHours),
    },
    {
      label: "Permission Requests",
      value: formatPermissionRequests(record.permissionRequests),
    },
    {
      label: "Permission Status",
      value: record.permissionStatus || "-",
    },
    {
      label: "Approved Permission",
      value: formatPermissionHours(record.approvedPermissionRequestedHours),
    },
    {
      label: "Eligible Permission",
      value: formatPermissionHours(record.approvedPermissionHours),
    },
    {
      label: "Credited Working Hours",
      value: formatDuration(record.totalCreditedWorkingSeconds ?? null),
    },
    {
      label: "Monthly Allowance",
      value: formatPermissionHours(record.monthlyPermissionAllowanceHours),
    },
    {
      label: "Monthly Used",
      value: formatPermissionHours(record.monthlyPermissionUsedHours),
    },
    {
      label: "Monthly Remaining",
      value: formatPermissionHours(record.monthlyPermissionRemainingHours),
    },
    {
      label: "Final Attendance Status",
      value: record.attendanceStatus || "Pending",
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
            {record.employeeName || "Employee"} · {record.employeeId || "-"}
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
