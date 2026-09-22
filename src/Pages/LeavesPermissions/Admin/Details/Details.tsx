import { useState } from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  Typography,
} from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import { useNavigate } from "react-router-dom";
import "./Details.css";

type RequestStatus = "Pending" | "Approved" | "Rejected";

interface LeaveRequest {
  employeeId: string;
  employeeName: string;
  currentCasualLeave: number;
  currentSickLeave: number;
  currentPermission: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: RequestStatus;
}

const staticLeaveRequest: LeaveRequest = {
  employeeId: "EMP001",
  employeeName: "Arthi Ruth",
  currentCasualLeave: 8,
  currentSickLeave: 5,
  currentPermission: 2,
  leaveType: "Casual Leave",
  startDate: "18/09/2026",
  endDate: "20/09/2026",
  reason: "Personal work",
  status: "Pending",
};

function Details() {
  const navigate = useNavigate();

  const [request, setRequest] =
    useState<LeaveRequest>(staticLeaveRequest);

  const updateStatus = (status: RequestStatus) => {
    setRequest((current) => ({
      ...current,
      status,
    }));
  };

  return (
    <Box className="leave-details">

      {/* Back Button */}
      <Button
        startIcon={<ArrowBackOutlinedIcon />}
        className="leave-details__back-button"
        onClick={() => navigate("/admin-leaves-permissions")}
      >
        Back to Leave Requests
      </Button>

      {/* Header */}
      <Box className="leave-details__header">
        <Typography className="leave-details__title">
          Leave Request Details
        </Typography>

        <Typography className="leave-details__subtitle">
          View employee leave request information
        </Typography>
      </Box>

      {/* Employee Information */}
      <Card className="leave-details__employee-card">

        <Box className="leave-details__employee-item">
          <Typography className="leave-details__label">
            Employee Name
          </Typography>

          <Typography className="leave-details__value">
            {request.employeeName}
          </Typography>
        </Box>

        <Box className="leave-details__employee-item">
          <Typography className="leave-details__label">
            Employee ID
          </Typography>

          <Typography className="leave-details__value leave-details__employee-id">
            {request.employeeId}
          </Typography>
        </Box>

        <Box className="leave-details__employee-item">
          <Typography className="leave-details__label">
            Casual Leave
          </Typography>

          <Typography className="leave-details__value">
            {request.currentCasualLeave}
          </Typography>
        </Box>

        <Box className="leave-details__employee-item">
          <Typography className="leave-details__label">
            Sick Leave
          </Typography>

          <Typography className="leave-details__value">
            {request.currentSickLeave}
          </Typography>
        </Box>

        <Box className="leave-details__employee-item">
          <Typography className="leave-details__label">
            Permission
          </Typography>

          <Typography className="leave-details__value">
            {request.currentPermission}
          </Typography>
        </Box>

      </Card>

      {/* Request Details */}
      <Card className="leave-details__request-card">

        <Box className="leave-details__request-heading">
          <Typography className="leave-details__request-title">
            Request Details
          </Typography>
        </Box>

        <Box className="leave-details__form">

          {/* Leave Type */}
          <Box className="leave-details__form-field">
            <Typography className="leave-details__form-label">
              Leave Type
            </Typography>

            <Box className="leave-details__readonly-field">
              <Typography>
                {request.leaveType}
              </Typography>
            </Box>
          </Box>

          {/* Start Date */}
          <Box className="leave-details__form-field">
            <Typography className="leave-details__form-label">
              Start Date
            </Typography>

            <Box className="leave-details__readonly-field">
              <Typography>
                {request.startDate}
              </Typography>
            </Box>
          </Box>

          {/* End Date */}
          <Box className="leave-details__form-field">
            <Typography className="leave-details__form-label">
              End Date
            </Typography>

            <Box className="leave-details__readonly-field">
              <Typography>
                {request.endDate}
              </Typography>
            </Box>
          </Box>

          {/* Leave Reason */}
          <Box className="leave-details__form-field leave-details__form-field--full">
            <Typography className="leave-details__form-label">
              Leave Reason
            </Typography>

            <Box className="leave-details__readonly-field leave-details__readonly-field--reason">
              <Typography>
                {request.reason}
              </Typography>
            </Box>
          </Box>

        </Box>

        {/* Actions */}
        {request.status === "Pending" ? (
          <Box className="leave-details__actions">

            <Button
              variant="outlined"
              startIcon={<CancelOutlinedIcon />}
              className="leave-details__reject-button"
              onClick={() => updateStatus("Rejected")}
            >
              Reject
            </Button>

            <Button
              variant="contained"
              startIcon={<CheckCircleOutlineOutlinedIcon />}
              className="leave-details__approve-button"
              onClick={() => updateStatus("Approved")}
            >
              Approve
            </Button>

          </Box>
        ) : (
          <Box className="leave-details__status">

            <Chip
              label={request.status}
              className={`leave-details__status-chip ${
                request.status === "Approved"
                  ? "leave-details__status-chip--approved"
                  : "leave-details__status-chip--rejected"
              }`}
            />

          </Box>
        )}

      </Card>

    </Box>
  );
}

export default Details;