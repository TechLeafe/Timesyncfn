import { useEffect, useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Chip,
  Button,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlined";

import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../../../context/UserContext";
import "./EmployeeLeavesPermissions.css";
import api from "../../../api/axiosInstance";

type LeaveType = "CL" | "SL" | "COMP_OFF" | "PERMISSION";
type RequestType = "permission" | "leave";
type RequestStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";

interface LeaveRequest {
  id: string;
  userId: string;
  type: RequestType;
  leaveType: LeaveType;
  employeeName: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  compOffDate?: string;
  startTime?: string;
  endTime?: string;
  totalDays: number;
  totalHours: number;
  reason: string;
  status: RequestStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  apiData?: LeaveApiData;
}

interface RequestForm {
  leaveType: LeaveType;
  date: string;
  startDate: string;
  endDate: string;
  compOffDate: string;
  startTime: string;
  endTime: string;
  reason: string;
}

type FieldErrors = Partial<Record<keyof RequestForm, string>>;

interface LeaveApiData {
  _id: string;
  user_id: string;
  leaveType: string;
  fromDate: string;
  toDate: string | null;
  fromTime: string | null;
  toTime: string | null;
  totalDays: number;
  totalHours: number;
  compensatingDate: string | null;
  reason: string;
  status: RequestStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

interface LeaveApplyResponse {
  success: boolean;
  message: string;
  data?: LeaveApiData;
}

interface LeaveListResponse {
  success: boolean;
  message: string;
  data: LeaveApiData[] | LeaveApiData;
}

interface LeavePolicy {
  _id: string;
  policyName: string;
  businessYear: string;
  casualLeave: number;
  sickLeave: number;
  compensatoryOff: number;
  permissionsPerMonth: number;
  createdAt: string;
  updatedAt: string;
}

interface LeavePolicyResponse {
  success: boolean;
  message: string;
  data: LeavePolicy[];
}

// Calculate current business year
export const getBusinessYear = (date = new Date()) => {
  const currentYear = date.getFullYear();
  const month = date.getMonth();

  if (month >= 3) {
    return `${currentYear}-${currentYear + 1}`;
  }

  return `${currentYear - 1}-${currentYear}`;
};

//leave request form
const EMPTY_FORM: RequestForm = {
  leaveType: "CL",
  date: "",
  startDate: "",
  endDate: "",
  compOffDate: "",
  startTime: "",
  endTime: "",
  reason: "",
};

// Format dates for display
const formatDate = (value?: string | null) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN");
};

// Convert dates for inputs
const toInputDate = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Calculate inclusive leave days
const diffDaysInclusive = (start: string, end: string) =>
  Math.round(
    (new Date(`${end}T00:00:00`).getTime() -
      new Date(`${start}T00:00:00`).getTime()) /
      86400000,) + 1;

// Normalize leave type
const getLeaveType = (value: string): LeaveType => {
  if (["SL", "COMP_OFF", "PERMISSION"].includes(value)) {
    return value as LeaveType;
  }

  return "CL";
};
// Read logged-in employee name
const getLoggedInUserName = (fallback: string) => {
  try {
    const storedUser = localStorage.getItem("loggedInUser");

    if (storedUser) {
      const user = JSON.parse(storedUser) as {
        name?: string;
        email?: string;
      };
      return user.name || user.email || fallback;
    }
  } catch {
    return fallback;
  }
  return fallback;
};

// Map API data for display
const mapApiRequest = (
  item: LeaveApiData,
  employeeName: string,
): LeaveRequest => {
  const leaveType = getLeaveType(item.leaveType);

  return {
    id: item._id,
    userId: item.user_id,
    type:
      leaveType === "PERMISSION"
        ? "permission"
        : "leave",
    leaveType,
    employeeName,
    date:
      leaveType === "PERMISSION"
        ? toInputDate(item.fromDate)
        : undefined,
    startDate:
      leaveType !== "PERMISSION"
        ? toInputDate(item.fromDate)
        : undefined,
    endDate:
      leaveType !== "PERMISSION"
        ? toInputDate(item.toDate)
        : undefined,
    compOffDate: item.compensatingDate
      ? toInputDate(item.compensatingDate)
      : undefined,
    startTime: item.fromTime ?? undefined,
    endTime: item.toTime ?? undefined,
    totalDays: item.totalDays,
    totalHours: item.totalHours,
    reason: item.reason,
    status: item.status,
    reviewedBy: item.reviewedBy,
    reviewedAt: item.reviewedAt,
    rejectionReason: item.rejectionReason,
    apiData: item,
  };
};

function EmployeeLeavesPermissions() {
  const { currentUser } = useCurrentUser();
  const navigate = useNavigate();

  const [requests, setRequests] =
    useState<LeaveRequest[]>([]);

  const [requestType, setRequestType] =
    useState<RequestType | null>(null);

  const [form, setForm] =
    useState<RequestForm>(EMPTY_FORM);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  // Store policy balances
  const [leavePolicy, setLeavePolicy] =
    useState<LeavePolicy | null>(null);

  const [policyLoading, setPolicyLoading] =
    useState(false);
  const [statusFilter, setStatusFilter] =
    useState<"All" | RequestStatus>("All");

  // Load employee requests
  const fetchLeaveRequests = async (
    status: "All" | RequestStatus = statusFilter,
  ) => {
    try {
      setLoading(true);

      const response = await api.post<LeaveListResponse>(
        "/leave-apply/list",
        {
          status: status === "All" ? "" : status,
          businessYear: getBusinessYear(),
        },
      );

      if (!response.data.success) {
        setError(response.data.message || "Failed to load leave requests.");
        return;
      }

      const apiData = Array.isArray(response.data.data)
        ? response.data.data
        : response.data.data
          ? [response.data.data]
          : [];

      setRequests(
        apiData.map((item) =>
          mapApiRequest(item, getLoggedInUserName(currentUser.name)),
        ),
      );
    } catch (error) {
      console.error("Leave list API error:", error);
      setError("Failed to load leave requests.");
    } finally {
      setLoading(false);
    }
  };

  // Load leave policy
  const fetchLeavePolicy = async () => {
    try {
      setPolicyLoading(true);

      const response =
        await api.post<LeavePolicyResponse>(
          "/leaves/list",
          {
            businessYear: getBusinessYear(),
          },
        );

      if (!response.data.success) {
        setError(
          response.data.message ||
            "Failed to load leave policy.",
        );

        return;
      }

      const policies = response.data.data;

      if (policies.length > 0) {
        setLeavePolicy(policies[0]);
      } else {
        setLeavePolicy(null);

        setError(
          "No leave policy found for the current business year.",
        );
      }
    } catch (error) {
      console.error(
        "Leave policy API error:",
        error,
      );

      setError(
        "Failed to load leave policy.",
      );
    } finally {
      setPolicyLoading(false);
    }
  };

  // Load policy on employee change
  useEffect(() => {
    fetchLeaveRequests();
    fetchLeavePolicy();
  }, [currentUser.id]);

  // Update form field
  const updateField = (
    field: keyof RequestForm,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setMessage("");
    setError("");
    setFieldErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  // Reset leave form
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setRequestType(null);
    setError("");
    setFieldErrors({});
  };

  // Open leave application form
  const openForm = (
    type: RequestType,
    leaveType: LeaveType = "CL",
  ) => {
    setRequestType(type);

    setForm({
      ...EMPTY_FORM,
      leaveType,
    });

    setMessage("");
    setError("");
    setFieldErrors({});
  };

  // Build application request
  const createApiRequestBody = () => {
    const businessYear = getBusinessYear();

    if (form.leaveType === "PERMISSION") {
      return {
        leaveType: "PERMISSION",
        fromDate: form.date,
        fromTime: form.startTime,
        toTime: form.endTime,
        reason: form.reason.trim(),
        businessYear,
      };
    }

    const totalDays = diffDaysInclusive(
      form.startDate,
      form.endDate,
    );

    return {
      leaveType: form.leaveType,
      fromDate: form.startDate,
      toDate: form.endDate,
      totalDays,
      ...(form.leaveType === "COMP_OFF" && {
        compensatingDate: form.compOffDate,
      }),
      reason: form.reason.trim(),
      businessYear,
    };
  };

  // Validate and submit leave
  const submitRequest = async () => {
    if (!requestType) return;

    setMessage("");
    setError("");
    setFieldErrors({});

    if (form.leaveType === "PERMISSION") {
      const nextErrors: FieldErrors = {};

      if (!form.date) nextErrors.date = "Permission date is required.";
      if (!form.startTime) nextErrors.startTime = "Start time is required.";
      if (!form.endTime) nextErrors.endTime = "End time is required.";
      if (!form.reason.trim()) nextErrors.reason = "Reason is required.";

      if (Object.keys(nextErrors).length > 0) {
        setFieldErrors(nextErrors);
        setError(
          "Please enter the permission date, time, and reason.",
        );

        return;
      }

      if (form.endTime <= form.startTime) {
        setFieldErrors({
          endTime: "End time must be after start time.",
        });
        setError(
          "Permission end time must be after the start time.",
        );

        return;
      }
    } else {
      const nextErrors: FieldErrors = {};

      if (!form.startDate) nextErrors.startDate = "Start date is required.";
      if (!form.endDate) nextErrors.endDate = "End date is required.";
      if (!form.reason.trim()) nextErrors.reason = "Reason is required.";

      if (Object.keys(nextErrors).length > 0) {
        setFieldErrors(nextErrors);
        setError(
          "Please enter the leave dates and reason.",
        );

        return;
      }

      if (form.endDate < form.startDate) {
        setFieldErrors({
          endDate: "End date must be on or after start date.",
        });
        setError(
          "Leave end date must be on or after the start date.",
        );

        return;
      }

      if (
        form.leaveType === "COMP_OFF" &&
        !form.compOffDate
      ) {
        setFieldErrors({
          compOffDate: "Comp off date is required.",
        });
        setError(
          "Please select the comp off date.",
        );

        return;
      }
    }

    try {
      setLoading(true);

      const requestBody =
        createApiRequestBody();

      // Submit leave request
      const response =
        await api.post<LeaveApplyResponse>(
          "/leave-apply/apply",
          requestBody,
        );

      if (!response.data.success) {
        setError(
          response.data.message ||
            "Failed to submit leave request.",
        );

        return;
      }

      setMessage(
        response.data.message ||
          "Leave request submitted successfully.",
      );

      // Add submitted request
      if (response.data.data) {
        const newRequest =
          mapApiRequest(
            response.data.data,
            getLoggedInUserName(currentUser.name),
          );

        setRequests(
          (currentRequests) => {
            const alreadyExists =
              currentRequests.some(
                (request) =>
                  request.id ===
                  newRequest.id,
              );

            if (alreadyExists) {
              return currentRequests;
            }

            return [
              newRequest,
              ...currentRequests,
            ];
          },
        );
      }

      // Clear submitted form
      resetForm();
    } catch (error) {
      console.error(
        "Leave apply API error:",
        error,
      );

      setError(
        "Failed to submit leave request. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Count used leave days
  const usedDays = (
    leaveType: LeaveType,
  ) =>
    requests
      .filter(
        (request) =>
          request.leaveType === leaveType &&
          request.status !== "Rejected",
      )
      .reduce(
        (sum, request) =>
          sum + request.totalDays,
        0,
      );

  // Count monthly permissions
  const usedPermissionsThisMonth = requests.filter(
    (request) => {
      if (
        request.leaveType !== "PERMISSION" ||
        request.status === "Rejected" ||
        !request.date
      ) {
        return false;
      }

      const permissionDate = new Date(
        `${request.date}T00:00:00`,
      );
      const today = new Date();

      return (
        permissionDate.getFullYear() ===
          today.getFullYear() &&
        permissionDate.getMonth() ===
          today.getMonth()
      );
    },
  ).length;

  // Calculate remaining balances
  const clGranted =
    leavePolicy?.casualLeave ?? 0;

  const slGranted =
    leavePolicy?.sickLeave ?? 0;

  const permissionCount =
    leavePolicy?.permissionsPerMonth ?? 0;

  const clRemaining = Math.max(
    clGranted - usedDays("CL"),
    0,
  );

  const slRemaining = Math.max(
    slGranted - usedDays("SL"),
    0,
  );

  const permissionRemaining = Math.max(
    permissionCount - usedPermissionsThisMonth,
    0,
  );

  // Render employee leave page
  return (
    <Box className="employee-leaves-page">
      <Stack
        className="employee-leaves-header"
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={2}
      >
        <Box>
          <Typography className="page-title">
            Leaves and Permissions
          </Typography>

          <Typography className="page-subtitle">
            Request time away and track your
            approvals.
          </Typography>
        </Box>
      </Stack>

      <Snackbar
        open={Boolean(message)}
        autoHideDuration={3000}
        onClose={() => setMessage("")}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setMessage("")}
        >
          {message}
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={4000}
        onClose={() => setError("")}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      </Snackbar>

      <Box className="balance-grid">
        <SimpleBalanceCard
          label="Casual Leave (CL)"
          value={clRemaining}
          unit={
            policyLoading
              ? "Loading..."
              : "days left"
          }
          icon={
            <EventAvailableOutlinedIcon />
          }
        />

        <SimpleBalanceCard
          label="Sick Leave (SL)"
          value={slRemaining}
          unit={
            policyLoading
              ? "Loading..."
              : "days left"
          }
          icon={
            <AccessTimeOutlinedIcon />
          }
        />

        <SimpleBalanceCard
          label="Permissions"
          value={permissionRemaining}
          unit={
            policyLoading
              ? "Loading..."
              : "left this month"
          }
          icon={
            <FactCheckOutlinedIcon />
          }
        />

        <ApplyCard
          onToggle={() =>
            openForm("leave", "CL")
          }
        />
      </Box>

      {requestType && (
        <Paper
          className="request-form-card"
          elevation={0}
        >
          <Typography className="form-title">
            {form.leaveType === "PERMISSION"
              ? "Permission request"
              : "Leave request"}
          </Typography>

          <Stack
            className="form-fields"
            spacing={2.5}
          >
            <FieldRow
              label="Leave type"
              required
            >
              <FormControl
                fullWidth
                size="small"
              >
                <Select
                  value={form.leaveType}
                  onChange={(event) => {
                    const value =
                      event.target
                        .value as LeaveType;

                    updateField(
                      "leaveType",
                      value,
                    );

                    setRequestType(
                      value === "PERMISSION"
                        ? "permission"
                        : "leave",
                    );
                  }}
                >
                  <MenuItem value="CL">
                    Casual Leave (CL)
                  </MenuItem>

                  <MenuItem value="SL">
                    Sick Leave (SL)
                  </MenuItem>

                  <MenuItem value="PERMISSION">
                    Permission
                  </MenuItem>

                  <MenuItem value="COMP_OFF">
                    Comp Off
                  </MenuItem>
                </Select>
              </FormControl>
            </FieldRow>

            {form.leaveType ===
            "PERMISSION" ? (
              <>
                <FieldRow
                  label="Permission date"
                  required
                >
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={form.date}
                    error={Boolean(fieldErrors.date)}
                    helperText={fieldErrors.date}
                    onChange={(event) =>
                      updateField(
                        "date",
                        event.target.value,
                      )
                    }
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
                    }}
                  />
                </FieldRow>

                <FieldRow
                  label="Start time"
                  required
                >
                  <TextField
                    fullWidth
                    size="small"
                    type="time"
                    value={form.startTime}
                    error={Boolean(fieldErrors.startTime)}
                    helperText={fieldErrors.startTime}
                    onChange={(event) =>
                      updateField(
                        "startTime",
                        event.target.value,
                      )
                    }
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
                    }}
                  />
                </FieldRow>

                <FieldRow
                  label="End time"
                  required
                >
                  <TextField
                    fullWidth
                    size="small"
                    type="time"
                    value={form.endTime}
                    error={Boolean(fieldErrors.endTime)}
                    helperText={fieldErrors.endTime}
                    onChange={(event) =>
                      updateField(
                        "endTime",
                        event.target.value,
                      )
                    }
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
                    }}
                  />
                </FieldRow>

                <FieldRow
                  label="Permission reason"
                  required
                >
                  <TextField
                    fullWidth
                    size="small"
                    value={form.reason}
                    error={Boolean(fieldErrors.reason)}
                    helperText={fieldErrors.reason}
                    onChange={(event) =>
                      updateField(
                        "reason",
                        event.target.value,
                      )
                    }
                  />
                </FieldRow>
              </>
            ) : (
              <>
                <FieldRow
                  label="Start date"
                  required
                >
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={form.startDate}
                    error={Boolean(fieldErrors.startDate)}
                    helperText={fieldErrors.startDate}
                    onChange={(event) =>
                      updateField(
                        "startDate",
                        event.target.value,
                      )
                    }
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
                    }}
                  />
                </FieldRow>

                <FieldRow
                  label="End date"
                  required
                >
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={form.endDate}
                    error={Boolean(fieldErrors.endDate)}
                    helperText={fieldErrors.endDate}
                    onChange={(event) =>
                      updateField(
                        "endDate",
                        event.target.value,
                      )
                    }
                    slotProps={{
                      htmlInput: {
                        min:
                          form.startDate ||
                          undefined,
                      },
                      inputLabel: {
                        shrink: true,
                      },
                    }}
                  />
                </FieldRow>

                {form.leaveType ===
                  "COMP_OFF" && (
                  <FieldRow
                    label="Comp off date"
                    required
                  >
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={
                        form.compOffDate
                      }
                        error={Boolean(fieldErrors.compOffDate)}
                        helperText={fieldErrors.compOffDate}
                      onChange={(event) =>
                        updateField(
                          "compOffDate",
                          event.target.value,
                        )
                      }
                      slotProps={{
                        inputLabel: {
                          shrink: true,
                        },
                      }}
                    />
                  </FieldRow>
                )}

                <FieldRow
                  label="Leave reason"
                  required
                >
                  <TextField
                    fullWidth
                    size="small"
                    value={form.reason}
                    error={Boolean(fieldErrors.reason)}
                    helperText={fieldErrors.reason}
                    onChange={(event) =>
                      updateField(
                        "reason",
                        event.target.value,
                      )
                    }
                  />
                </FieldRow>
              </>
            )}
          </Stack>

          <Stack
            className="form-actions"
            direction="row"
            spacing={1}
          >
            <Button
              className="cancel-button"
              variant="outlined"
              onClick={resetForm}
            >
              Cancel
            </Button>

            <Button
              className="submit-button"
              variant="contained"
              onClick={submitRequest}
              disabled={loading}
            >
              {form.leaveType ===
              "PERMISSION"
                ? "Get permission"
                : "Get leave"}
            </Button>
          </Stack>
        </Paper>
      )}

      <RequestTable
        requests={requests}
        loading={loading}
        statusFilter={statusFilter}
        onStatusChange={(status) => {
          setStatusFilter(status);
          fetchLeaveRequests(status);
        }}
        onView={(id) =>
          navigate(
            `/employee-leaves-permissions/leave-detail/${id}`,
            {
              state: {
                request: requests.find(
                  (item) => item.id === id,
                )?.apiData,
              },
            },
          )
        }
      />
    </Box>
  );
}

// Render labeled form field
function FieldRow({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <Stack
      className="field-row"
      direction={{
        xs: "column",
        sm: "row",
      }}
      spacing={{
        xs: 0.5,
        sm: 1.5,
      }}
    >
      <Typography className="field-label">
        {label}

        {required && (
          <span className="required-star">
            *
          </span>
        )}
      </Typography>

      {children}
    </Stack>
  );
}

// Render leave balance card
function SimpleBalanceCard({
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
    <Paper
      className="balance-card"
      elevation={0}
    >
      <Stack
        className="balance-card-content"
        direction="row"
      >
        <Box>
          <Typography className="balance-label">
            {label}
          </Typography>

          <Typography className="balance-value">
            {value}
          </Typography>

          <Typography className="balance-unit">
            {unit}
          </Typography>
        </Box>

        <Box className="balance-icon">
          {icon}
        </Box>
      </Stack>
    </Paper>
  );
}

// Render leave application card
function ApplyCard({
  onToggle,
}: {
  onToggle: () => void;
}) {
  return (
    <Paper
      className="apply-card"
      elevation={0}
    >
      <Button
        className="apply-button"
        onClick={onToggle}
        startIcon={
          <AddCircleOutlineIcon />
        }
      >
        Apply
      </Button>
    </Paper>
  );
}

// Render employee requests table
function RequestTable({
  requests,
  loading,
  statusFilter,
  onStatusChange,
  onView,
}: {
  requests: LeaveRequest[];
  loading: boolean;
  statusFilter: "All" | RequestStatus;
  onStatusChange: (status: "All" | RequestStatus) => void;
  onView: (id: string) => void;
}) {
  return (
    <Paper
      className="requests-card"
      elevation={0}
    >
      <Box className="requests-card-header">
        <Typography className="requests-title">
          Leave Requests List
        </Typography>
        <Select
          size="small"
          value={statusFilter}
          onChange={(event) =>
            onStatusChange(event.target.value as "All" | RequestStatus)
          }
          className="requests-status-filter"
          MenuProps={{
            classes: {
              paper: "requests-status-menu",
            },
          }}
          aria-label="Filter leave requests by status"
        >
          <MenuItem value="All">All status</MenuItem>
          <MenuItem value="Pending">Pending</MenuItem>
          <MenuItem value="Approved">Approved</MenuItem>
          <MenuItem value="Rejected">Rejected</MenuItem>
        </Select>
      </Box>

      {loading ? (
        <Box className="empty-requests">
          <Typography className="empty-requests-text">
            Loading requests...
          </Typography>
        </Box>
      ) : requests.length ? (
        <>
          <Box className="requests-card-list">
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onView={onView}
              />
            ))}
          </Box>

          <Box className="requests-table-wrap">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    Name
                  </TableCell>

                  <TableCell>
                    Leave Type
                  </TableCell>

                  <TableCell>
                    From
                  </TableCell>

                  <TableCell>
                    To
                  </TableCell>

                  <TableCell>
                    Duration
                  </TableCell>

                  <TableCell>
                    Status
                  </TableCell>

                  <TableCell align="right">
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {requests.map((request) => (
                  <RequestRow
                    key={request.id}
                    request={request}
                    onView={onView}
                  />
                ))}
              </TableBody>
            </Table>
          </Box>
        </>
      ) : (
        <Box className="empty-requests">
          <Typography className="empty-requests-text">
            No leave requests match this status.
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

// Render one request as a stacked card (mobile / tablet)
function RequestCard({
  request,
  onView,
}: {
  request: LeaveRequest;
  onView: (id: string) => void;
}) {
  return (
    <Paper className="request-card" elevation={0}>
      <Box className="request-card-header">
        <Box className="request-card-heading">
          <Typography className="request-card-name">
            {request.employeeName}
          </Typography>
          <Typography className="request-card-type">
            {request.leaveType}
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={0.5}
          className="request-card-actions"
          sx={{ alignItems: "center" }}
        >
          <Chip
            label={request.status}
            size="small"
            className={`status-chip status-${request.status.toLowerCase()}`}
          />

          <IconButton
            aria-label="View leave details"
            size="small"
            onClick={() => onView(request.id)}
          >
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      <Box className="request-card-grid">
        <Box className="request-card-field">
          <Typography className="request-card-label">From</Typography>
          <Typography className="request-card-value">
            {formatDate(request.startDate ?? request.date)}
          </Typography>
        </Box>

        <Box className="request-card-field">
          <Typography className="request-card-label">To</Typography>
          <Typography className="request-card-value">
            {formatDate(request.endDate ?? request.date)}
          </Typography>
        </Box>

        <Box className="request-card-field">
          <Typography className="request-card-label">Duration</Typography>
          <Typography className="request-card-value">
            {request.leaveType === "PERMISSION" ? "-" : `${request.totalDays} day(s)`}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

// Render one request row
function RequestRow({
  request,
  onView,
}: {
  request: LeaveRequest;
  onView: (id: string) => void;
}) {
  return (
    <TableRow>
      <TableCell className="request-cell request-employee-cell">
        {request.employeeName}
      </TableCell>

      <TableCell className="request-cell">
        {request.leaveType}
      </TableCell>

      <TableCell className="request-cell request-nowrap-cell">
        {formatDate(request.startDate ?? request.date)}
      </TableCell>

      <TableCell className="request-cell request-nowrap-cell">
        {formatDate(request.endDate ?? request.date)}
      </TableCell>

      <TableCell className="request-cell request-total-days-cell">
        {request.leaveType === "PERMISSION" ? "-" : `${request.totalDays} day(s)`}
      </TableCell>

      <TableCell>
        <Chip
          label={request.status}
          size="small"
          className={`status-chip status-${request.status.toLowerCase()}`}
        />
      </TableCell>

      <TableCell className="request-action-cell">
        <IconButton
          aria-label="View leave details"
          onClick={() => onView(request.id)}>
          <VisibilityOutlinedIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}

export default EmployeeLeavesPermissions;