import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Typography,
} from "@mui/material";

import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
// import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
// import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";

import "./EmployeeCheckInOut.css";

// Use your employee image here
import employeeImage from "../../assets/CheckInOut/User_icon.png";

// Use the leaf image you provided
import leafImage from "../../assets/StatCards/Leafe.png";

interface Employee {
  name: string;
  designation: string;
  employeeId: string;
  department: string;
  email: string;
  reportingManager: string;
  location: string;
}

const employee: Employee = {
  name: "Arthi Ruth",
  designation: "Frontend Developer",
  employeeId: "TL00123",
  department: "Development",
  email: "arthi@techleafe.com",
  reportingManager: "Rahul Sharma",
  location: "Office - TechLeafe",
};

const EmployeeCheckInOut = () => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!checkInTime) {
      // setElapsedSeconds(0);
      return;
    }

    const updateTimer = () => {
      const difference = Math.floor(
        (Date.now() - checkInTime.getTime()) / 1000
      );
      console.log("Elapsed seconds:", difference);

      setElapsedSeconds(Math.max(0, difference));
    };

    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [checkInTime]);

  const handleCheckIn = () => {
    const now = new Date();

    setCheckInTime(now);
    setIsCheckedIn(true);
  };

  const handleCheckOut = () => {
    setIsCheckedIn(false);
    setCheckInTime(null);
    // setElapsedSeconds(0);
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  };

  return (
    <Box className="employee-attendance-page">
      <Box className="employee-attendance-container">
        {/* LEFT EMPLOYEE CARD */}
        <Card className="employee-profile-card">
          {/* Decorative leaf */}
          <img
            src={leafImage}
            alt=""
            className="employee-leaf employee-leaf-left"
          />

          <img
            src={leafImage}
            alt=""
            className="employee-leaf employee-leaf-bottom"
          />

          <CardContent className="employee-profile-content">
            {/* Employee image */}
            <Box className="employee-image-wrapper">
              <img
                src={employeeImage}
                alt={employee.name}
                className="employee-image"
              />
            </Box>

            {/* Employee name */}
            <Typography className="employee-name">
              {employee.name}
            </Typography>

            <Typography className="employee-designation">
              {employee.designation}
            </Typography>

            {/* Check In / Check Out */}
<Box className="attendance-actions">
  <Button
    fullWidth
    variant="contained"
    startIcon={<AccessTimeOutlinedIcon />}
    className="check-in-button"
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

                <Typography className="timer-value">
                  {formatTime(elapsedSeconds)}
                </Typography>

                <Box className="timer-labels">
                  <Typography>Hours</Typography>
                  <Typography>Minutes</Typography>
                  <Typography>Seconds</Typography>
                </Box>
              </Box>

              <Box className="timer-message">
                <img
                  src={leafImage}
                  alt=""
                  className="timer-leaf"
                />

                <Typography className="timer-message-title">
                  {isCheckedIn ? "Keep going!" : "Ready to start?"}
                </Typography>

                <Typography className="timer-message-subtitle">
                  {isCheckedIn
                    ? "You're doing great!"
                    : "Check in to start your timer"}
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
                {/* LEFT COLUMN */}
                <Box className="details-column">
                  <DetailItem
                    icon={<PersonOutlineOutlinedIcon />}
                    label="Name"
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

                {/* RIGHT COLUMN */}
                <Box className="details-column">
                  <DetailItem
                    icon={<PersonOutlineOutlinedIcon />}
                    label="Designation"
                    value={employee.designation}
                  />

                  <DetailItem
                    icon={<EmailOutlinedIcon />}
                    label="Email"
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

interface DetailItemProps {
  icon: React.ReactNode;
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