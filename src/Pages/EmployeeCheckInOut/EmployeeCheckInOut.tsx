import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Snackbar,
  Typography,
} from "@mui/material";

import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";

import api from "../../api/axiosInstance";

import "./EmployeeCheckInOut.css";

import employeeImage from "../../assets/CheckInOut/User_icon.png";
import leafImage from "../../assets/StatCards/Leafe.png";

/* =========================================
   TYPES
========================================= */

interface Employee {
  name: string;
  designation: string;
  employeeId: string;
  department: string;
  email: string;
  reportingManager: string;
  location: string;
}

/* =========================================
   COMPONENT

   Personal self check-in / check-out.
   Every role (Employee, HR, Admin) gets this
   same page for their own attendance — the
   "view everyone's records" table lives on
   its own page now (Employee Management ->
   AdminCheckinout.tsx), reached only by HR/Admin.
========================================= */

const EmployeeCheckInOut = () => {
  /* =========================================
     GET LOGGED IN USER
  ========================================= */

  const storedUser = localStorage.getItem("loggedInUser");

  let loggedInUser: any = null;

  if (storedUser) {
    try {
      loggedInUser = JSON.parse(storedUser);
    } catch {
      loggedInUser = null;
    }
  }

  /* =========================================
     STATES
  ========================================= */

  const [employee, setEmployee] = useState<Employee>({
    name: loggedInUser?.name ?? "Employee",
    designation: loggedInUser?.designation ?? "-",
    employeeId: loggedInUser?.employeeId ?? loggedInUser?.userId ?? "-",
    department: loggedInUser?.department ?? "-",
    email: loggedInUser?.email ?? "-",
    reportingManager: loggedInUser?.reportingManager ?? "-",
    location: loggedInUser?.location ?? "Office - TechLeafe",
  });

  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ severity: "success" | "error"; text: string } | null>(null);

  /* =========================================
     FETCH OWN STATUS

     There's no dedicated "/checkinout/me" endpoint on this backend
     (confirmed 404). We previously used /dashboard/employee to find
     this user's internal user_id, but that endpoint is restricted to
     Employee-role accounts only (confirmed: an Admin account gets a
     403 there) — and this page has to work identically for Employee,
     HR, and Admin. So status now comes from /attendance/daily with an
     empty user_id (get everyone today — the same call the Admin/HR
     "Employee Management" table already uses successfully for every
     role), filtered down to this person's own row. The dashboard call
     is now only used as optional, best-effort profile enrichment — if
     it 403s (HR/Admin), we just keep the localStorage-based details.

     Returns the real checkInTime if one was found, so callers
     (e.g. a failed check-in) know whether status actually synced.
  ========================================= */

  const fetchStatus = async (): Promise<Date | null> => {
    try {
      setLoading(true);

      try {
        const dashboardResponse = await api.post("/dashboard/employee", { date: "" });

        console.log("Employee dashboard (profile enrichment):", dashboardResponse.data);

        const dashboardData = dashboardResponse.data?.data ?? dashboardResponse.data;
        const info = dashboardData?.employeeInformation;

        if (info) {
          setEmployee((current) => ({
            ...current,
            name: info.name ?? current.name,
            designation: info.designation ?? current.designation,
            employeeId: info.employeeId ?? current.employeeId,
            email: info.email ?? current.email,
          }));
        }
      } catch (dashboardErr) {
        // Expected for HR/Admin accounts — this endpoint is Employee-only.
        console.warn("Employee dashboard not accessible for this account's role (expected for HR/Admin):", dashboardErr);
      }

      const dailyResponse = await api.post("/attendance/daily", { user_id: "", date: "" });

      console.log("Today's attendance (all employees):", dailyResponse.data);

      const dailyData = dailyResponse.data?.data ?? dailyResponse.data;
      const records = Array.isArray(dailyData) ? dailyData : [];

      const myEmployeeId: string | undefined = loggedInUser?.userId ?? loggedInUser?.employeeId;
      const myEmail: string | undefined = loggedInUser?.email;

      const todaysRecord = records.find(
        (record: any) =>
          (myEmployeeId && record.employeeId === myEmployeeId) ||
          (myEmail && record.email === myEmail)
      );

      const checkedIn = Boolean(todaysRecord?.checkInTime) && !todaysRecord?.checkOutTime;

      setIsCheckedIn(checkedIn);

      if (checkedIn && todaysRecord?.checkInTime) {
        const time = new Date(todaysRecord.checkInTime);
        setCheckInTime(time);
        return time;
      }

      setCheckInTime(null);
      return null;
    } catch (err: any) {
      console.error("Status fetch error:", err);

      setError(err.response?.data?.message || "Unable to load check-in/out status.");

      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setError("");
    fetchStatus();
  }, []);

  /* =========================================
     TIMER
  ========================================= */

  useEffect(() => {
    if (!checkInTime) {
      return;
    }

    const updateTimer = () => {
      const difference = Math.floor((Date.now() - checkInTime.getTime()) / 1000);

      setElapsedSeconds(Math.max(0, difference));
    };

    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [checkInTime]);

  /* =========================================
     CHECK IN
  ========================================= */

  const handleCheckIn = async () => {
    try {
      setError("");

      const response = await api.post("/attendance/check-in");

      console.log("Check In:", response.data);

      const data = response.data?.data ?? response.data;

      const time = data?.checkInTime ? new Date(data.checkInTime) : new Date();

      setCheckInTime(time);
      setIsCheckedIn(true);
      setElapsedSeconds(0);
      setToast({ severity: "success", text: "Checked in successfully." });
    } catch (err: any) {
      console.error("Check In error:", err);

      const message: string = err.response?.data?.message || "Unable to check in.";

      // Already checked in for the day — just tell them, don't start the
      // timer or flip the button. There's no session here to "resume":
      // one check-in per day, and today's is already used.
      setToast({ severity: "error", text: message });
    }
  };

  /* =========================================
     CHECK OUT
  ========================================= */

  const handleCheckOut = async () => {
    try {
      setError("");

      const response = await api.post("/attendance/check-out");

      console.log("Check Out:", response.data);

      setIsCheckedIn(false);
      setCheckInTime(null);
      setElapsedSeconds(0);
      setToast({ severity: "success", text: "Checked out successfully." });
    } catch (err: any) {
      console.error("Check Out error:", err);

      const message: string = err.response?.data?.message || "Unable to check out.";

      setToast({ severity: "error", text: message });
    }
  };

  /* =========================================
     FORMAT TIMER
  ========================================= */

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  /* =========================================
     VIEW
  ========================================= */

  return (
    <Box className="employee-attendance-page">
      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {toast ? (
          <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)}>
            {toast.text}
          </Alert>
        ) : undefined}
      </Snackbar>

      {error && (
        <Typography sx={{ mb: 2, color: "#D42B2B", fontSize: 13 }}>
          {error}
        </Typography>
      )}

      <Box className="employee-attendance-container">
        {/* LEFT EMPLOYEE CARD */}

        <Card className="employee-profile-card">
          <img src={leafImage} alt="" className="employee-leaf employee-leaf-left" />
          <img src={leafImage} alt="" className="employee-leaf employee-leaf-bottom" />

          <CardContent className="employee-profile-content">
            {/* EMPLOYEE IMAGE */}

            <Box className="employee-image-wrapper">
              <img src={employeeImage} alt={employee.name} className="employee-image" />
            </Box>

            {/* NAME */}

            <Typography className="employee-name">{employee.name}</Typography>
            <Typography className="employee-designation">{employee.designation}</Typography>

            {/* CHECK IN / CHECK OUT */}

            <Box className="attendance-actions">
              <Button
                fullWidth
                variant="contained"
                startIcon={<AccessTimeOutlinedIcon />}
                className="check-in-button"
                disabled={loading}
                onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
              >
                {isCheckedIn ? "Check Out" : "Check In"}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* RIGHT SIDE */}

        <Box className="attendance-right-section">
          {/* TIMER CARD */}

          <Card className="timer-card">
            <CardContent className="timer-card-content">
              <Box className="timer-left">
                <Box className="timer-heading">
                  <AccessTimeOutlinedIcon />
                  <Typography>Time Since Check In</Typography>
                </Box>

                <Typography className="timer-value">{formatTime(elapsedSeconds)}</Typography>

                <Box className="timer-labels">
                  <Typography>Hours</Typography>
                  <Typography>Minutes</Typography>
                  <Typography>Seconds</Typography>
                </Box>
              </Box>

              <Box className="timer-message">
                <img src={leafImage} alt="" className="timer-leaf" />

                <Typography className="timer-message-title">
                  {isCheckedIn ? "Keep going!" : "Ready to start?"}
                </Typography>

                <Typography className="timer-message-subtitle">
                  {isCheckedIn ? "You're doing great!" : "Check in to start your timer"}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* EMPLOYEE DETAILS */}

          <Card className="employee-details-card">
            <CardContent className="employee-details-content">
              <Box className="details-title">
                <PersonOutlineOutlinedIcon />
                <Typography>Employee Details</Typography>
              </Box>

              <Box className="details-grid">
                {/* LEFT */}

                <Box className="details-column">
                  <DetailItem icon={<PersonOutlineOutlinedIcon />} label="Name" value={employee.name} />
                  <DetailItem icon={<BadgeOutlinedIcon />} label="Employee ID" value={employee.employeeId} />
                  <DetailItem icon={<BusinessCenterOutlinedIcon />} label="Department" value={employee.department} />
                </Box>

                <Divider orientation="vertical" flexItem className="details-divider" />

                {/* RIGHT */}

                <Box className="details-column">
                  <DetailItem icon={<PersonOutlineOutlinedIcon />} label="Designation" value={employee.designation} />
                  <DetailItem icon={<EmailOutlinedIcon />} label="Email" value={employee.email} />
                  <DetailItem icon={<GroupsOutlinedIcon />} label="Reporting Manager" value={employee.reportingManager} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

/* =========================================
   DETAIL ITEM
========================================= */

interface DetailItemProps {
  icon: ReactNode;
  label: string;
  value: string;
}

const DetailItem = ({ icon, label, value }: DetailItemProps) => {
  return (
    <Box className="detail-item">
      <Box className="detail-icon">{icon}</Box>

      <Box className="detail-text">
        <Typography className="detail-label">{label}</Typography>
        <Typography className="detail-value">{value}</Typography>
      </Box>
    </Box>
  );
};

export default EmployeeCheckInOut;
