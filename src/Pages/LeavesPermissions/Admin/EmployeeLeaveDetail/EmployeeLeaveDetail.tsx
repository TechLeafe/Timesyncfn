
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

import {
  Alert, Box, Button, Chip, CircularProgress, Paper,
  Snackbar, TextField, Typography,
} from "@mui/material";

import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import HealthAndSafetyOutlinedIcon from "@mui/icons-material/HealthAndSafetyOutlined";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../../../../api/axiosInstance";
import "./EmployeeLeaveDetail.css";

type RequestStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Cancelled";

type ReviewStatus = "Approved" | "Rejected";

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
  totalHours?: number;
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
  currentCasualLeave: number | null;
  currentSickLeave: number | null;
  currentPermission: number | null;
  leaveType: string;
  rawLeaveType: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  totalDays: number;
  totalHours: number;
  reason: string;
  status: RequestStatus;
  rejectionReason: string | null;
}

const getBusinessYear = (date = new Date()) => {
  const year = date.getFullYear();

  return date.getMonth() >= 3
    ? `${year}-${year + 1}`
    : `${year - 1}-${year}`;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";

  const match = value.match(/^\d{4}-\d{2}-\d{2}/);
  const date = new Date(match?.[0] ?? value);

  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-IN", {
        timeZone: "UTC",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const getLeaveTypeLabel = (value: string) => {
  switch (value) {
    case "SL":
      return "Sick Leave";
    case "COMP_OFF":
      return "Compensatory Off";
    case "PERMISSION":
      return "Permission";
    default:
      return "Casual Leave";
  }
};

const getApiError = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as { response?: { data?: { message?: string } } }
    ).response;
    if (response?.data?.message) return response.data.message;
  }

  return error instanceof Error ? error.message : fallback;
};

const mapRequest = (item: LeaveApiData): LeaveRequest => ({
  id: item._id,
  employeeId: item.user_id,
  employeeName: item.employeeId?.name || item.user_id,
  currentCasualLeave: null,
  currentSickLeave: null,
  currentPermission: null,
  leaveType: getLeaveTypeLabel(item.leaveType),
  rawLeaveType: item.leaveType,
  startDate: formatDate(item.fromDate),
  endDate: formatDate(item.toDate),
  startTime: item.fromTime || "-",
  endTime: item.toTime || "-",
  totalDays: Number(item.totalDays) || 0,
  totalHours: Number(item.totalHours) || 0,
  reason: item.reason || "-",
  status: item.status,
  rejectionReason: item.rejectionReason,
});

function Details() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [request, setRequest] =
    useState<LeaveRequest | null>(null);

  const [reviewStatus, setReviewStatus] =
    useState<ReviewStatus | null>(null);

  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchRequest = useCallback(async () => {
    if (!id) {
      setError("Leave request ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post<LeaveListResponse>(
        "/leave-apply/list",
        {
          status: "",
          businessYear: getBusinessYear(),
        }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Unable to load leave request."
        );
      }

      const data = response.data.data;
      const records = Array.isArray(data)
        ? data
        : data
          ? [data]
          : [];

      const found = records.find((item) => item._id === id);

      if (!found) {
        setRequest(null);
        setError("Leave request not found.");
        return;
      }

      const mapped = mapRequest(found);

      // Optional policy calculation. If policy lookup
      // fails, the request still remains viewable.
      try {
        const policyResponse =
          await api.post<LeavePolicyResponse>(
            "/leaves/list",
            { businessYear: getBusinessYear() }
          );

        if (
          policyResponse.data.success &&
          Array.isArray(policyResponse.data.data)
        ) {
          const policy = policyResponse.data.data[0];

          if (policy) {
            const employeeRequests = records.filter(
              (item) => item.user_id === found.user_id
            );

            const approvedDays = (type: string) =>
              employeeRequests
                .filter(
                  (item) =>
                    item.leaveType === type &&
                    item.status === "Approved"
                )
                .reduce(
                  (total, item) =>
                    total + (Number(item.totalDays) || 0),
                  0
                );

            const permissionDate = new Date();
            const currentMonth = permissionDate.getMonth() + 1;
            const currentYear = permissionDate.getFullYear();

            const approvedPermissions =
              employeeRequests.filter((item) => {
                const date = item.fromDate.slice(0, 10);
                const year = Number(date.slice(0, 4));
                const month = Number(date.slice(5, 7));

                return (
                  item.leaveType === "PERMISSION" &&
                  item.status === "Approved" &&
                  year === currentYear &&
                  month === currentMonth
                );
              }).length;

            mapped.currentCasualLeave = Math.max(
              0,
              (Number(policy.casualLeave) || 0) -
                approvedDays("CL")
            );

            mapped.currentSickLeave = Math.max(
              0,
              (Number(policy.sickLeave) || 0) -
                approvedDays("SL")
            );

            mapped.currentPermission = Math.max(
              0,
              (Number(policy.permissionsPerMonth) || 0) -
                approvedPermissions
            );
          }
        }
      } catch {
        // Display request without unavailable policy balances.
      }

      setRequest(mapped);
      setReviewStatus(null);
      setRejectionReason(mapped.rejectionReason ?? "");
    } catch (err) {
      setError(
        getApiError(err, "Failed to load leave request.")
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchRequest();
  }, [fetchRequest]);

  const reviewLeave = async () => {
    if (
      !id ||
      !request ||
      request.status !== "Pending" ||
      !reviewStatus ||
      saving
    ) {
      return;
    }

    if (
      reviewStatus === "Rejected" &&
      !rejectionReason.trim()
    ) {
      setError("Please enter a reason for rejecting this request.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await api.post<LeaveReviewResponse>(
        "/leave-apply/review",
        {
          leaveId: id,
          status: reviewStatus,
          ...(reviewStatus === "Rejected"
            ? { rejectionReason: rejectionReason.trim() }
            : {}),
        }
      );

      if (response.data.success === false) {
        throw new Error(
          response.data.message || "Unable to review request."
        );
      }

      setMessage(
        response.data.message ||
          `Leave request ${reviewStatus.toLowerCase()} successfully.`
      );

      /*
       * Refresh after review so balances and final
       * status come from the backend, not assumptions.
       */
      await fetchRequest();
    } catch (err) {
      setError(
        getApiError(err, "Failed to review leave request.")
      );
    } finally {
      setSaving(false);
    }
  };

  const canReview = request?.status === "Pending";

  return (
    <Box className="leave-details">
      <Snackbar
        open={Boolean(message)}
        autoHideDuration={3500}
        onClose={() => setMessage("")}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setMessage("")}
        >
          {message}
        </Alert>
      </Snackbar>

      <Box className="leave-details__page-header">
        <Box className="leave-details__page-heading">
          <Box className="leave-details__heading-icon">
            <EventNoteOutlinedIcon />
          </Box>
          <Box>
            <Typography component="h2" className="leave-details__title">
              Leave Request Details
            </Typography>
            <Typography className="leave-details__subtitle">
              Review employee information and respond to requests.
            </Typography>
          </Box>
        </Box>

        <Button
          className="leave-details__back-button"
          variant="outlined"
          startIcon={<ArrowBackOutlinedIcon />}
          onClick={() => navigate("/admin-leaves-permissions")}
        >
          Back to Requests
        </Button>
      </Box>

      {error && (
        <Alert
          severity="error"
          className="leave-details__error"
          action={
            <Button
              size="small"
              color="inherit"
              startIcon={<RefreshRoundedIcon />}
              disabled={loading || saving}
              onClick={() => void fetchRequest()}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading && !request ? (
        <Paper elevation={0} className="leave-details__empty">
          <CircularProgress size={26} sx={{ color: "#087b4d" }} />
          <Typography>Loading leave request...</Typography>
        </Paper>
      ) : request ? (
        <>
          <Box className="leave-details__balance-cards">
            <BalanceCard
              label="Employee Name"
              value={request.employeeName}
              unit={request.employeeId}
              icon={<EventNoteOutlinedIcon />}
              textValue
            />
            <BalanceCard
              label="Casual Leave"
              value={request.currentCasualLeave}
              unit="estimated days left"
              icon={<EventAvailableOutlinedIcon />}
            />
            <BalanceCard
              label="Sick Leave"
              value={request.currentSickLeave}
              unit="estimated days left"
              icon={<HealthAndSafetyOutlinedIcon />}
            />
            <BalanceCard
              label="Permissions"
              value={request.currentPermission}
              unit="estimated left this month"
              icon={<FactCheckOutlinedIcon />}
            />
          </Box>

          <Paper
            elevation={0}
            className="leave-details__request-card"
          >
            <Box className="leave-details__request-heading">
              <Box>
                <Typography className="leave-details__request-title">
                  Request Information
                </Typography>
                <Typography className="leave-details__request-subtitle">
                  Details submitted by the employee
                </Typography>
              </Box>
              <StatusChip status={request.status} />
            </Box>

            <Box className="leave-details__form">
              <ReadonlyField
                label="Request Type"
                value={request.leaveType}
              />
              <ReadonlyField
                label={request.rawLeaveType === "PERMISSION"
                  ? "Permission Date"
                  : "Start Date"}
                value={request.startDate}
              />
              {request.rawLeaveType !== "PERMISSION" && (
                <ReadonlyField
                  label="End Date"
                  value={request.endDate}
                />
              )}
              {request.rawLeaveType === "PERMISSION" ? (
                <>
                  <ReadonlyField
                    label="Start Time"
                    value={request.startTime}
                  />
                  <ReadonlyField
                    label="End Time"
                    value={request.endTime}
                  />
                  <ReadonlyField
                    label="Total Hours"
                    value={`${request.totalHours} hr`}
                  />
                </>
              ) : (
                <ReadonlyField
                  label="Total Days"
                  value={`${request.totalDays} days`}
                />
              )}
              <ReadonlyField
                label="Reason"
                value={request.reason}
                full
              />
              {request.status === "Rejected" &&
                request.rejectionReason && (
                  <ReadonlyField
                    label="Rejection Reason"
                    value={request.rejectionReason}
                    full
                  />
                )}
            </Box>

            {canReview ? (
              <Box className="leave-details__review-section">
                <Typography className="leave-details__review-title">
                  Review Decision
                </Typography>

                <Typography className="leave-details__review-subtitle">
                  Select whether to approve or reject this request.
                </Typography>

                <Box className="leave-details__status-actions">
                  <Button
                    variant={
                      reviewStatus === "Approved"
                        ? "contained"
                        : "outlined"
                    }
                    startIcon={<CheckCircleOutlineOutlinedIcon />}
                    className="leave-details__approve-button"
                    disabled={saving}
                    onClick={() => {
                      setReviewStatus("Approved");
                      setError("");
                    }}
                  >
                    Approve
                  </Button>

                  <Button
                    variant={
                      reviewStatus === "Rejected"
                        ? "contained"
                        : "outlined"
                    }
                    startIcon={<CancelOutlinedIcon />}
                    className="leave-details__reject-button"
                    disabled={saving}
                    onClick={() => {
                      setReviewStatus("Rejected");
                      setError("");
                    }}
                  >
                    Reject
                  </Button>
                </Box>

                {reviewStatus === "Rejected" && (
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="Rejection Reason"
                    placeholder="Explain why this request is being rejected"
                    value={rejectionReason}
                    onChange={(event) =>
                      setRejectionReason(event.target.value)
                    }
                    disabled={saving}
                    required
                  />
                )}

                <Box className="leave-details__actions">
                  <Button
                    variant="contained"
                    disabled={!reviewStatus || saving}
                    className="leave-details__save-button"
                    startIcon={
                      saving ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <CheckCircleOutlineOutlinedIcon />
                      )
                    }
                    onClick={() => void reviewLeave()}
                  >
                    {saving ? "Saving..." : "Submit Decision"}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box className="leave-details__completed">
                This request has already been reviewed or closed.
              </Box>
            )}
          </Paper>
        </>
      ) : (
        <Paper elevation={0} className="leave-details__empty">
          <Typography>
            Leave request could not be found.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

function ReadonlyField({
  label, value, full = false,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <Box className={`leave-details__form-field ${
      full ? "leave-details__form-field--full" : ""
    }`}>
      <Typography className="leave-details__form-label">
        {label}
      </Typography>
      <Box className={`leave-details__readonly-field ${
        full ? "leave-details__readonly-field--reason" : ""
      }`}>
        <Typography>{value || "-"}</Typography>
      </Box>
    </Box>
  );
}

function BalanceCard({
  label, value, unit, icon, textValue = false,
}: {
  label: string;
  value: string | number | null;
  unit: string;
  icon: ReactNode;
  textValue?: boolean;
}) {
  return (
    <Paper elevation={0} className="leave-details__balance-card">
      <Box className="leave-details__balance-body">
        <Typography className="leave-details__balance-label">
          {label}
        </Typography>
        <Typography
          className={`leave-details__balance-value ${
            textValue ? "leave-details__balance-value--name" : ""
          }`}
        >
          {value ?? "—"}
        </Typography>
        <Typography className="leave-details__balance-unit">
          {unit}
        </Typography>
      </Box>
      <Box className="leave-details__balance-icon">{icon}</Box>
    </Paper>
  );
}

function StatusChip({ status }: { status: RequestStatus }) {
  return (
    <Chip
      label={status}
      size="small"
      className={`leave-details__status-chip leave-details__status-chip--${status.toLowerCase()}`}
    />
  );
}

export default Details;
