import { useEffect, useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../../../api/axiosInstance";
import "./EmployeeLeaveDetail.css";

type RequestStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";

interface LeaveApiData {
  _id: string;
  employeeId?: {
    _id: string;
    name: string;
    email: string;
  };
  user_id: string;
  leaveType: string;
  fromDate: string;
  toDate: string | null;
  fromTime: string | null;
  toTime: string | null;
  totalDays: number;
  reason: string;
  status: RequestStatus;
  rejectionReason: string | null;
}

interface LeavePolicy {
  casualLeave: number;
  sickLeave: number;
  permissionsPerMonth: number;
}

interface LeavePolicyResponse {
  success: boolean;
  message: string;
  data: LeavePolicy[];
}

interface LeaveListResponse {
  success: boolean;
  message: string;
  data: LeaveApiData[] | LeaveApiData;
}

interface LeaveReviewResponse {
  success?: boolean;
  message?: string;
  data?: LeaveApiData;
  leaveId?: string;
  status?: RequestStatus;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  currentCasualLeave: number;
  currentSickLeave: number;
  currentPermission: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: RequestStatus;
  rejectionReason?: string | null;
}

const getBusinessYear = (date = new Date()) => {
  const year = date.getFullYear();
  return date.getMonth() >= 3
    ? `${year}-${year + 1}`
    : `${year - 1}-${year}`;
};

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-IN") : "-";

const getLeaveTypeLabel = (value: string) => {
  if (value === "SL") return "Sick Leave";
  if (value === "COMP_OFF") return "Comp Off";
  if (value === "PERMISSION") return "Permission";
  return "Casual Leave";
};

const mapRequest = (item: LeaveApiData): LeaveRequest => ({
  id: item._id,
  employeeId: item.user_id,
  employeeName: item.employeeId?.name ?? item.user_id,
  currentCasualLeave: 0,
  currentSickLeave: 0,
  currentPermission: 0,
  leaveType: getLeaveTypeLabel(item.leaveType),
  startDate: formatDate(item.fromDate),
  endDate: formatDate(item.toDate),
  totalDays: item.totalDays,
  reason: item.reason,
  status: item.status,
  rejectionReason: item.rejectionReason,
});

function Details() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationRequest = (location.state as { request?: LeaveRequest } | null)?.request;
  const [request, setRequest] = useState<LeaveRequest | null>(navigationRequest ?? null);
  const [status, setStatus] = useState<RequestStatus>(navigationRequest?.status ?? "Pending");
  const [rejectionReason, setRejectionReason] = useState(navigationRequest?.rejectionReason ?? "");
  const [loading, setLoading] = useState(!navigationRequest);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchRequest = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await api.post<LeaveListResponse>(
          "/leave-apply/list",
          { status: "", businessYear: getBusinessYear() },
        );
        const data = Array.isArray(response.data.data)
          ? response.data.data
          : response.data.data
            ? [response.data.data]
            : [];
        const found = data.find((item) => item._id === id);

        if (!found) {
          setError("Leave request not found.");
          return;
        }

        const policyResponse = await api.post<LeavePolicyResponse>(
          "/leaves/list",
          { businessYear: getBusinessYear() },
        );
        const policy = policyResponse.data.data?.[0];
        const employeeRequests = data.filter(
          (item) => item.user_id === found.user_id,
        );
        const approvedDays = (leaveType: string) =>
          employeeRequests
            .filter(
              (item) =>
                item.leaveType === leaveType &&
                item.status === "Approved",
            )
            .reduce((total, item) => total + item.totalDays, 0);
        const approvedPermissions = employeeRequests.filter(
          (item) =>
            item.leaveType === "PERMISSION" &&
            item.status === "Approved",
        ).length;

        const mapped = mapRequest(found);
        mapped.currentCasualLeave = Math.max(
          (policy?.casualLeave ?? 0) - approvedDays("CL"),
          0,
        );
        mapped.currentSickLeave = Math.max(
          (policy?.sickLeave ?? 0) - approvedDays("SL"),
          0,
        );
        mapped.currentPermission = Math.max(
          (policy?.permissionsPerMonth ?? 0) - approvedPermissions,
          0,
        );
        setRequest(mapped);
        setStatus(mapped.status);
        setRejectionReason(mapped.rejectionReason ?? "");
      } catch (requestError) {
        console.error("Admin leave detail API error:", requestError);
        setError("Failed to load leave request.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id]);

  const reviewLeave = async () => {
    if (!id) return;
    if (status === "Rejected" && !rejectionReason.trim()) {
      setError("Please enter a reason for rejecting this leave.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const body = {
        leaveId: id,
        status,
        ...(status === "Rejected" && { rejectionReason: rejectionReason.trim() }),
      };
      const response = await api.post<LeaveReviewResponse>("leave-apply/review", body);

      if (response.data.success === false) {
        setError(response.data.message || "Failed to review leave request.");
        return;
      }

      setRequest((current) => current ? { ...current, status, rejectionReason } : current);
      setMessage(response.data.message || `Leave request ${status.toLowerCase()}.`);
    } catch (reviewError) {
      console.error("Leave review API error:", reviewError);
      setError("Failed to review leave request.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box className="leave-details">

      <Snackbar open={Boolean(error)} autoHideDuration={4000} onClose={() => setError("")}>
        <Alert severity="error" onClose={() => setError("")}>{error}</Alert>
      </Snackbar>
      <Snackbar open={Boolean(message)} autoHideDuration={3000} onClose={() => setMessage("")}>
        <Alert severity="success" onClose={() => setMessage("")}>{message}</Alert>
      </Snackbar>

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
      </Box>

      {/* Employee Information */}
      {loading ? (
        <Typography>Loading leave request...</Typography>
      ) : request ? <>
      <Box className="leave-details__balance-cards">
        <Paper className="leave-details__balance-card">
          <Box>
            <Typography className="leave-details__balance-label">
              Employee Name
            </Typography>
            <Typography className="leave-details__employee-card-value">
              {request.employeeName}
            </Typography>
          </Box>
        </Paper>
        <BalanceCard
          label="Casual Leave (CL)"
          value={request.currentCasualLeave}
          unit="days left"
          icon={<EventAvailableOutlinedIcon />}
        />
        <BalanceCard
          label="Sick Leave (SL)"
          value={request.currentSickLeave}
          unit="days left"
          icon={<AccessTimeOutlinedIcon />}
        />
        <BalanceCard
          label="Permissions"
          value={request.currentPermission}
          unit="left this month"
          icon={<FactCheckOutlinedIcon />}
        />
      </Box>

      {/* Request Details */}
      <Paper className="leave-details__request-card">

        <Box className="leave-details__request-heading">
          <Typography className="leave-details__request-title">
            Request Details
          </Typography>
        </Box>

        <Box className="leave-details__form">

          {/* Leave request values */}
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

          <Box className="leave-details__form-field">
            <Typography className="leave-details__form-label">
              Total Days
            </Typography>

            <Box className="leave-details__readonly-field">
              <Typography>{request.totalDays}</Typography>
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
            <Box className="leave-details__status-actions">
              <Button
                variant={status === "Pending" ? "contained" : "outlined"}
                onClick={() => setStatus("Pending")}
              >
                Pending
              </Button>
              <Button
                variant={status === "Approved" ? "contained" : "outlined"}
                startIcon={<CheckCircleOutlineOutlinedIcon />}
                className="leave-details__approve-button"
                onClick={() => setStatus("Approved")}
              >
                Approve
              </Button>
              <Button
                variant={status === "Rejected" ? "contained" : "outlined"}
                startIcon={<CancelOutlinedIcon />}
                className="leave-details__reject-button"
                onClick={() => setStatus("Rejected")}
              >
                Reject
              </Button>
            </Box>
            {status === "Rejected" && (
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Rejection reason"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
              />
            )}
            <Button
              variant="contained"
              startIcon={status === "Approved" ? <CheckCircleOutlineOutlinedIcon /> : <CancelOutlinedIcon />}
              className={`leave-details__save-button ${
                status === "Approved"
                  ? "leave-details__approve-button"
                  : "leave-details__reject-button"
              }`}
              onClick={reviewLeave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
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

      </Paper>
      </> : null}

    </Box>
  );
}

function BalanceCard({
  label,
  value,
  unit,
  icon,
}: {
  label: string;
  value: number;
  unit: string;
  icon: ReactNode;
}) {
  return (
    <Paper className="leave-details__balance-card">
      <Box>
        <Typography className="leave-details__balance-label">
          {label}
        </Typography>
        <Typography className="leave-details__balance-value">
          {value}
        </Typography>
        <Typography className="leave-details__balance-unit">
          {unit}
        </Typography>
      </Box>
      <Box className="leave-details__balance-icon">
        {icon}
      </Box>
    </Paper>
  );
}

export default Details;