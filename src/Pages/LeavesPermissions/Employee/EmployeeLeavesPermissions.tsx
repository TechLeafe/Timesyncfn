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
type RequestStatus = "Pending" | "Approved" | "Rejected";

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

interface LeaveListResponse {
  success: boolean;
  message: string;
  data: LeaveApiData[] | LeaveApiData;
}

interface LeaveApplyResponse {
  success: boolean;
  message: string;
  data?: LeaveApiData;
}

/*
 * Leave policy returned by:
 *
 * POST /leaves/list
 *
 * Request:
 * {
 *   businessYear: "2026-2027"
 * }
 */
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

export const getBusinessYear = (date = new Date()) => {
  const currentYear = date.getFullYear();
  const month = date.getMonth(); // 0 = January, 3 = April

  // April or later begins the new business year.
  if (month >= 3) {
    return `${currentYear}-${currentYear + 1}`;
  }

  return `${currentYear - 1}-${currentYear}`;
};

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

const formatDate = (value?: string | null) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN");
};

const toInputDate = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const diffDaysInclusive = (start: string, end: string) =>
  Math.round(
    (new Date(`${end}T00:00:00`).getTime() -
      new Date(`${start}T00:00:00`).getTime()) /
      86400000,
  ) + 1;

const getLeaveType = (value: string): LeaveType => {
  switch (value) {
    case "SL":
      return "SL";

    case "COMP_OFF":
      return "COMP_OFF";

    case "PERMISSION":
      return "PERMISSION";

    default:
      return "CL";
  }
};

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
  const [loading, setLoading] = useState(false);

  /*
   * Leave policy state.
   *
   * Values come from:
   * POST /leaves/list
   */
  const [leavePolicy, setLeavePolicy] =
    useState<LeavePolicy | null>(null);

  const [policyLoading, setPolicyLoading] =
    useState(false);

  /*
   * Fetch employee's leave/permission requests.
   */
  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);

      // Fetch the employee's leave requests
      // for the current business year.
      const response =
        await api.post<LeaveListResponse>(
          "/leave-apply/list",
          {
            status: "",
            businessYear: getBusinessYear(),
          },
        );

      if (!response.data.success) {
        setError(
          response.data.message ||
            "Failed to load leave requests.",
        );

        return;
      }

      const apiData = Array.isArray(
        response.data.data,
      )
        ? response.data.data
        : response.data.data
          ? [response.data.data]
          : [];

      const employeeRequests =
        apiData.map((item) =>
          mapApiRequest(
            item,
            currentUser.name,
          ),
        );

      setRequests(employeeRequests);
    } catch (error) {
      console.error(
        "Leave list API error:",
        error,
      );

      setError(
        "Failed to load leave requests.",
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Fetch leave policy.
   *
   * POST /leaves/list
   *
   * Request body:
   * {
   *   businessYear: "2026-2027"
   * }
   *
   * Response:
   * {
   *   casualLeave: 12,
   *   sickLeave: 6,
   *   permissionsPerMonth: 4
   * }
   */
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

  useEffect(() => {
    fetchLeaveRequests();
    fetchLeavePolicy();
  }, [currentUser.id]);

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
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setRequestType(null);
    setError("");
  };

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
  };

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

  const submitRequest = async () => {
    if (!requestType) return;

    setMessage("");
    setError("");

    if (form.leaveType === "PERMISSION") {
      if (
        !form.date ||
        !form.startTime ||
        !form.endTime ||
        !form.reason.trim()
      ) {
        setError(
          "Please enter the permission date, time, and reason.",
        );

        return;
      }

      if (form.endTime <= form.startTime) {
        setError(
          "Permission end time must be after the start time.",
        );

        return;
      }
    } else {
      if (
        !form.startDate ||
        !form.endDate ||
        !form.reason.trim()
      ) {
        setError(
          "Please enter the leave dates and reason.",
        );

        return;
      }

      if (form.endDate < form.startDate) {
        setError(
          "Leave end date must be on or after the start date.",
        );

        return;
      }

      if (
        form.leaveType === "COMP_OFF" &&
        !form.compOffDate
      ) {
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

      // Submit the leave/permission request.
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

      /*
       * The apply API returns the newly created
       * leave request in response.data.data.
       *
       * Show it in the table immediately.
       */
      if (response.data.data) {
        const newRequest =
          mapApiRequest(
            response.data.data,
            currentUser.name,
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
      } else {
        await fetchLeaveRequests();
      }

      // Clear the form after successful submission.
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

  /*
   * Leave policy values from backend.
   *
   * Example API response:
   *
   * casualLeave: 12
   * sickLeave: 6
   * permissionsPerMonth: 4
   */
  const clGranted =
    leavePolicy?.casualLeave ?? 0;

  const slGranted =
    leavePolicy?.sickLeave ?? 0;

  const permissionCount =
    leavePolicy?.permissionsPerMonth ?? 0;

  /*
   * Remaining CL and SL after approved requests.
   */
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

function RequestTable({
  requests,
  loading,
  onView,
}: {
  requests: LeaveRequest[];
  loading: boolean;
  onView: (id: string) => void;
}) {
  return (
    <Paper
      className="requests-card"
      elevation={0}
    >
      <Box className="requests-card-header">
        <Typography className="requests-title">
          My requests
        </Typography>
      </Box>

      {loading ? (
        <Box className="empty-requests">
          <Typography className="empty-requests-text">
            Loading requests...
          </Typography>
        </Box>
      ) : requests.length ? (
        <Box className="requests-table-wrap">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  Employee
                </TableCell>

                <TableCell>
                  Type
                </TableCell>

                <TableCell>
                  Date / Time
                </TableCell>

                <TableCell align="center">
                  Total days
                </TableCell>

                <TableCell>
                  Reason
                </TableCell>

                <TableCell>
                  Status
                </TableCell>

                <TableCell align="center">
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
      ) : (
        <Box className="empty-requests">
          <Typography className="empty-requests-text">
            You have not submitted any
            requests yet.
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

function RequestRow({
  request,
  onView,
}: {
  request: LeaveRequest;
  onView: (id: string) => void;
}) {
  const details =
    request.leaveType ===
    "PERMISSION"
      ? `${formatDate(request.date)} ${
          request.startTime ?? "-"
        } - ${request.endTime ?? "-"}`
      : request.leaveType ===
          "COMP_OFF"
        ? `${formatDate(
            request.startDate,
          )} - ${formatDate(
            request.endDate,
          )}`
        : `${formatDate(
            request.startDate,
          )} - ${formatDate(
            request.endDate,
          )}`;

  const displayType =
    request.leaveType === "CL"
      ? "Casual Leave"
      : request.leaveType === "SL"
        ? "Sick Leave"
        : request.leaveType ===
            "COMP_OFF"
          ? "Comp Off"
          : "Permission";

  return (
    <TableRow>
      <TableCell className="request-cell request-employee-cell">
        {request.employeeName}
      </TableCell>

      <TableCell className="request-cell">
        {displayType}
      </TableCell>

      <TableCell className="request-cell request-nowrap-cell">
        {details}
      </TableCell>

      <TableCell
        className="request-cell request-total-days-cell"
        align="center"
      >
        {request.leaveType === "PERMISSION"
          ? "-"
          : request.totalDays}
      </TableCell>

      <TableCell className="request-cell request-reason-cell">
        {request.reason}
      </TableCell>

      <TableCell>
        <Chip
          label={request.status}
          size="small"
          className={`status-chip status-${request.status.toLowerCase()}`}
        />
      </TableCell>

      <TableCell
        className="request-action-cell"
        align="center"
      >
        <IconButton
          aria-label="View leave details"
          onClick={() =>
            onView(request.id)
          }
        >
          <VisibilityOutlinedIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}

export default EmployeeLeavesPermissions;