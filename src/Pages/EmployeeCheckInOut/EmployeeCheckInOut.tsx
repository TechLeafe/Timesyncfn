
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Snackbar,
  Typography,
} from "@mui/material";

import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import api from "../../api/axiosInstance";
import "./EmployeeCheckInOut.css";

interface Employee {
  name: string;
  designation: string;
  employeeId: string;
  department: string;
  email: string;
  reportingManager: string;
  location: string;
}

interface StoredUser {
  userId?: string;
  employeeId?: string;
  name?: string;
  designation?: string;
  department?: string;
  email?: string;
  reportingManager?: string;
  location?: string;
}

interface AttendanceRecord {
  employeeId?: string;
  user_id?: string;
  email?: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
}

interface AttendanceResponse {
  data?: {
    checkInTime?: string | null;
  };
  checkInTime?: string | null;
}

type AttendanceStatus =
  | "unknown"
  | "not-checked-in"
  | "checked-in"
  | "checked-out";

type ToastMessage = {
  severity: "success" | "error";
  text: string;
};

const getStoredUser = (): StoredUser | null => {
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

    return parsed as StoredUser;
  } catch {
    return null;
  }
};

const initialUser = getStoredUser();

const makeEmployee = (user: StoredUser | null): Employee => ({
  name: user?.name || "Employee",
  designation: user?.designation || "Employee",
  employeeId:
    user?.employeeId || user?.userId || "-",
  department: user?.department || "-",
  email: user?.email || "-",
  reportingManager: user?.reportingManager || "-",
  location: user?.location || "Office - TechLeafe",
});

const formatTimer = (seconds: number): string => {
  const total = Math.max(0, Math.floor(seconds));

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  return [
    hours,
    minutes,
    secs,
  ]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
};

const formatClockTime = (
  value: string | Date | null
): string => {
  if (!value) return "--";

  const date = value instanceof Date
    ? value
    : new Date(value);

  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getApiError = (
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
          data?: { message?: string };
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return fallback;
};

const EmployeeCheckInOut = () => {
  const [employee, setEmployee] = useState<Employee>(
    () => makeEmployee(initialUser)
  );

  const [status, setStatus] =
    useState<AttendanceStatus>("unknown");

  const [checkInTime, setCheckInTime] =
    useState<Date | null>(null);

  const [checkOutTime, setCheckOutTime] =
    useState<Date | null>(null);

  const [elapsedSeconds, setElapsedSeconds] =
    useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [toast, setToast] =
    useState<ToastMessage | null>(null);

  const isCheckedIn = status === "checked-in";
  const isCheckedOut = status === "checked-out";

  const todayLabel = new Date().toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  /* ================= FETCH STATUS ================= */

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      /*
       * Preserve the existing API contract.
       * This endpoint should ultimately return
       * only the authenticated user's permitted data.
       */
      const response = await api.post(
        "/attendance/daily",
        {
          user_id: "",
          date: "",
        }
      );

      const payload =
        response.data?.data ?? response.data;

      if (!Array.isArray(payload)) {
        throw new Error("Invalid attendance response.");
      }

      const records = payload as AttendanceRecord[];
      const user = getStoredUser();

      const myId =
        user?.userId || user?.employeeId;

      const myEmail = user?.email?.toLowerCase();

      if (!myId && !myEmail) {
        throw new Error(
          "Your employee identity is unavailable. Please sign in again."
        );
      }

      const record = records.find((entry) => {
        const idMatches =
          Boolean(myId) &&
          (entry.employeeId === myId ||
            entry.user_id === myId);

        const emailMatches =
          Boolean(myEmail) &&
          entry.email?.toLowerCase() === myEmail;

        return idMatches || emailMatches;
      });

      const inTime = record?.checkInTime
        ? new Date(record.checkInTime)
        : null;

      const outTime = record?.checkOutTime
        ? new Date(record.checkOutTime)
        : null;

      const validIn =
        inTime && !Number.isNaN(inTime.getTime())
          ? inTime
          : null;

      const validOut =
        outTime && !Number.isNaN(outTime.getTime())
          ? outTime
          : null;

      setCheckInTime(validIn);
      setCheckOutTime(validOut);

      if (validOut) {
        setStatus("checked-out");
      } else if (validIn) {
        setStatus("checked-in");
      } else {
        setStatus("not-checked-in");
      }

      return true;
    } catch (err) {
      setError(
        getApiError(
          err,
          err instanceof Error
            ? err.message
            : "Unable to load attendance status."
        )
      );

      setStatus("unknown");
      setCheckInTime(null);
      setCheckOutTime(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /* ================= INITIAL LOAD ================= */

  useEffect(() => {
    void fetchStatus();

    /*
     * The employee dashboard endpoint is used
     * only for optional employee-role profile details.
     * HR/Admin may not have access to it.
     */
    const loadProfile = async () => {
      try {
        const response = await api.post(
          "/dashboard/employee",
          { date: "" }
        );

        const payload =
          response.data?.data ?? response.data;

        const info = payload?.employeeInformation;

        if (info) {
          setEmployee((current) => ({
            ...current,
            name: info.name ?? current.name,
            designation:
              info.designation ?? current.designation,
            employeeId:
              info.employeeId ?? current.employeeId,
            email: info.email ?? current.email,
          }));
        }
      } catch {
        // Keep profile data from the current login.
      }
    };

    void loadProfile();
  }, [fetchStatus]);

  /* ================= LIVE TIMER ================= */

  useEffect(() => {
    if (!isCheckedIn || !checkInTime) {
      return;
    }

    const updateTimer = () => {
      const seconds = Math.floor(
        (Date.now() - checkInTime.getTime()) / 1000
      );

      setElapsedSeconds(Math.max(0, seconds));
    };

    updateTimer();

    const interval = window.setInterval(
      updateTimer,
      1000
    );

    return () => window.clearInterval(interval);
  }, [isCheckedIn, checkInTime]);

  /* ================= CHECK IN ================= */

  const handleCheckIn = async () => {
    if (
      submitting ||
      loading ||
      status !== "not-checked-in"
    ) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await api.post<AttendanceResponse>(
        "/attendance/check-in"
      );

      const payload =
        response.data?.data ?? response.data;

      const returnedTime = payload?.checkInTime
        ? new Date(payload.checkInTime)
        : new Date();

      const time = Number.isNaN(returnedTime.getTime())
        ? new Date()
        : returnedTime;

      setCheckInTime(time);
      setCheckOutTime(null);
      setElapsedSeconds(0);
      setStatus("checked-in");

      setToast({
        severity: "success",
        text: "Checked in successfully.",
      });
    } catch (err) {
      setToast({
        severity: "error",
        text: getApiError(
          err,
          "Unable to check in. Please refresh your attendance status."
        ),
      });

      // Reconcile with the backend after a failed request.
      await fetchStatus();
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= CHECK OUT ================= */

  const handleCheckOut = async () => {
    if (
      submitting ||
      loading ||
      status !== "checked-in"
    ) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await api.post("/attendance/check-out");

      setCheckOutTime(new Date());
      setCheckInTime(null);
      setElapsedSeconds(0);
      setStatus("checked-out");

      setToast({
        severity: "success",
        text: "Checked out successfully.",
      });
    } catch (err) {
      setToast({
        severity: "error",
        text: getApiError(
          err,
          "Unable to check out. Please try again."
        ),
      });

      await fetchStatus();
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= STATUS DETAILS ================= */

  const statusLabel =
    status === "checked-in"
      ? "Checked In"
      : status === "checked-out"
        ? "Checked Out"
        : status === "not-checked-in"
          ? "Not Checked In"
          : "Status Unavailable";

  const statusClass =
    status === "checked-in"
      ? "attendance-status-active"
      : status === "checked-out"
        ? "attendance-status-complete"
        : "attendance-status-pending";

  const userInitials = employee.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  const actionDisabled =
    loading || submitting || status === "unknown";

  const timerValue = isCheckedIn
    ? elapsedSeconds
    : 0;

  /* ================= UI ================= */

  return (
    <Box className="employee-attendance-page">
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        {toast ? (
          <Alert
            severity={toast.severity}
            variant="filled"
            onClose={() => setToast(null)}
          >
            {toast.text}
          </Alert>
        ) : undefined}
      </Snackbar>

      {/* PAGE HEADER */}

      <Box className="attendance-page-heading">
        <Box className="attendance-page-heading-icon">
          <AccessTimeOutlinedIcon />
        </Box>

        <Box>
          <Typography
            component="h2"
            className="attendance-page-title"
          >
            Check In / Check Out
          </Typography>

          <Typography className="attendance-page-description">
            Manage your daily attendance and
            track your working session.
          </Typography>
        </Box>
      </Box>

      {/* DATE AND STATUS */}

      <Box className="attendance-overview">
        <Box className="attendance-overview-date">
          <CalendarTodayOutlinedIcon />
          <Typography>{todayLabel}</Typography>
        </Box>

        <Box
          className={`attendance-status-badge ${statusClass}`}
        >
          <span className="attendance-status-dot" />
          {loading ? "Loading status..." : statusLabel}
        </Box>
      </Box>

      {/* ERROR AND RETRY */}

      {error && (
        <Alert
          severity="error"
          className="attendance-error"
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshRoundedIcon />}
              onClick={() => void fetchStatus()}
              disabled={loading || submitting}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Box className="employee-attendance-container">

        {/* EMPLOYEE CARD */}

        <Card className="employee-profile-card">
          <CardContent className="employee-profile-content">
            <Box className="employee-profile-top-label">
              MY ATTENDANCE
            </Box>

            <Avatar className="employee-profile-avatar">
              {userInitials || "E"}
            </Avatar>

            <Typography className="employee-name">
              {employee.name}
            </Typography>

            <Typography className="employee-designation">
              {employee.designation}
            </Typography>

            <Box className="employee-profile-status">
              <span
                className={`attendance-status-dot ${statusClass}`}
              />
              {statusLabel}
            </Box>

            <Divider className="employee-profile-divider" />

            <Box className="employee-session-info">
              <Box className="employee-session-row">
                <span>Check In</span>
                <strong>
                  {formatClockTime(checkInTime)}
                </strong>
              </Box>

              <Box className="employee-session-row">
                <span>Check Out</span>
                <strong>
                  {formatClockTime(checkOutTime)}
                </strong>
              </Box>
            </Box>

            <Box className="attendance-actions">
              {isCheckedOut ? (
                <Button
                  fullWidth
                  variant="contained"
                  disabled
                  startIcon={
                    <CheckCircleOutlineRoundedIcon />
                  }
                  className="check-in-button"
                >
                  Attendance Completed
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  className="check-in-button"
                  disabled={actionDisabled}
                  onClick={
                    isCheckedIn
                      ? handleCheckOut
                      : handleCheckIn
                  }
                  startIcon={
                    submitting ? (
                      <CircularProgress
                        size={17}
                        color="inherit"
                      />
                    ) : isCheckedIn ? (
                      <LogoutRoundedIcon />
                    ) : (
                      <LoginRoundedIcon />
                    )
                  }
                >
                  {submitting
                    ? "Processing..."
                    : isCheckedIn
                      ? "Check Out"
                      : "Check In"}
                </Button>
              )}
            </Box>

            <Box className="employee-location">
              <LocationOnOutlinedIcon />
              <Typography>
                {employee.location}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* RIGHT COLUMN */}

        <Box className="attendance-right-section">

          {/* TIMER */}

          <Card className="timer-card">
            <CardContent className="timer-card-content">
              <Box className="timer-left">
                <Box className="timer-heading">
                  <AccessTimeOutlinedIcon />
                  <Typography>
                    Current Working Session
                  </Typography>
                </Box>

                <Typography className="timer-value">
                  {formatTimer(timerValue)}
                </Typography>

                <Box className="timer-labels">
                  <Typography>Hours</Typography>
                  <Typography>Minutes</Typography>
                  <Typography>Seconds</Typography>
                </Box>
              </Box>

              <Box className="timer-message">
                <Box className="timer-message-icon">
                  <AccessTimeOutlinedIcon />
                </Box>

                <Typography className="timer-message-title">
                  {isCheckedIn
                    ? "Session in progress"
                    : isCheckedOut
                      ? "Day completed"
                      : "Ready to start?"}
                </Typography>

                <Typography className="timer-message-subtitle">
                  {isCheckedIn
                    ? "Your session timer is running."
                    : isCheckedOut
                      ? "You have checked out for today."
                      : "Check in to start tracking time."}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* EMPLOYEE DETAILS */}

          <Card className="employee-details-card">
            <CardContent className="employee-details-content">
              <Box className="details-title">
                <PersonOutlineOutlinedIcon />
                <Box>
                  <Typography className="details-heading">
                    Employee Details
                  </Typography>
                  <Typography className="details-subheading">
                    Your workplace information
                  </Typography>
                </Box>
              </Box>

              <Box className="details-grid">
                <Box className="details-column">
                  <DetailItem
                    icon={<PersonOutlineOutlinedIcon />}
                    label="Full Name"
                    value={employee.name}
                  />

                  <DetailItem
                    icon={<BadgeOutlinedIcon />}
                    label="Employee ID"
                    value={employee.employeeId}
                  />

                  <DetailItem
                    icon={<BusinessCenterOutlinedIcon />}
                    label="Department"
                    value={employee.department}
                  />
                </Box>

                <Divider
                  orientation="vertical"
                  flexItem
                  className="details-divider"
                />

                <Box className="details-column">
                  <DetailItem
                    icon={<BusinessCenterOutlinedIcon />}
                    label="Designation"
                    value={employee.designation}
                  />

                  <DetailItem
                    icon={<EmailOutlinedIcon />}
                    label="Email Address"
                    value={employee.email}
                  />

                  <DetailItem
                    icon={<GroupsOutlinedIcon />}
                    label="Reporting Manager"
                    value={employee.reportingManager}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

/* ================= DETAIL ITEM ================= */

interface DetailItemProps {
  icon: ReactNode;
  label: string;
  value: string;
}

const DetailItem = ({
  icon,
  label,
  value,
}: DetailItemProps) => (
  <Box className="detail-item">
    <Box className="detail-icon">{icon}</Box>

    <Box className="detail-text">
      <Typography className="detail-label">
        {label}
      </Typography>

      <Typography className="detail-value">
        {value}
      </Typography>
    </Box>
  </Box>
);

export default EmployeeCheckInOut;
