
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import HealthAndSafetyOutlinedIcon from "@mui/icons-material/HealthAndSafetyOutlined";
import WorkHistoryOutlinedIcon from "@mui/icons-material/WorkHistoryOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";

import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../../../context/UserContext";
import api from "../../../api/axiosInstance";

import "./EmployeeLeavesPermissions.css";

/* ================= TYPES ================= */

type LeaveType =
  | "CL"
  | "SL"
  | "COMP_OFF"
  | "PERMISSION";

type RequestStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Cancelled";

type StatusFilter = "All" | RequestStatus;

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

interface LeaveRequest {
  id: string;
  userId: string;
  leaveType: LeaveType;
  employeeName: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  totalDays: number;
  totalHours: number;
  reason: string;
  status: RequestStatus;
  apiData: LeaveApiData;
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

type FieldErrors = Partial<
  Record<keyof RequestForm, string>
>;

interface LeavePolicy {
  _id: string;
  policyName: string;
  businessYear: string;
  casualLeave: number;
  sickLeave: number;
  compensatoryOff: number;
  permissionsPerMonth: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

type Notice = {
  severity: "success" | "error";
  text: string;
};

/* ================= CONSTANTS ================= */

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

const TYPE_LABELS: Record<LeaveType, string> = {
  CL: "Casual Leave",
  SL: "Sick Leave",
  COMP_OFF: "Compensatory Off",
  PERMISSION: "Permission",
};

const LEAVE_TYPE_OPTIONS: {
  value: LeaveType;
  label: string;
}[] = [
  { value: "CL", label: "Casual Leave (CL)" },
  { value: "SL", label: "Sick Leave (SL)" },
  { value: "COMP_OFF", label: "Compensatory Off" },
];

const PERMISSION_TYPE_OPTIONS: {
  value: LeaveType;
  label: string;
}[] = [
  { value: "PERMISSION", label: "Permission" },
];

/* ================= HELPERS ================= */

export const getBusinessYear = (
  date = new Date()
): string => {
  const year = date.getFullYear();

  return date.getMonth() >= 3
    ? `${year}-${year + 1}`
    : `${year - 1}-${year}`;
};

const getLeaveType = (
  value: string
): LeaveType => {
  if (
    value === "SL" ||
    value === "COMP_OFF" ||
    value === "PERMISSION"
  ) {
    return value;
  }

  return "CL";
};

const toInputDate = (
  value?: string | null
): string => {
  if (!value) return "";

  const match = value.match(/^\d{4}-\d{2}-\d{2}/);

  if (match) return match[0];

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (
  value?: string | null
): string => {
  const datePart = toInputDate(value);

  if (!datePart) return "-";

  const [year, month, day] =
    datePart.split("-").map(Number);

  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const diffDaysInclusive = (
  start: string,
  end: string
): number => {
  if (!start || !end || end < start) {
    return 0;
  }

  const startValue = Date.parse(
    `${start}T00:00:00Z`
  );

  const endValue = Date.parse(
    `${end}T00:00:00Z`
  );

  if (
    !Number.isFinite(startValue) ||
    !Number.isFinite(endValue)
  ) {
    return 0;
  }

  return (
    Math.round(
      (endValue - startValue) / 86400000
    ) + 1
  );
};

const timeToMinutes = (
  value: string
): number => {
  const [hours, minutes] =
    value.split(":").map(Number);

  return hours * 60 + minutes;
};

const diffHours = (
  start: string,
  end: string
): number => {
  if (!start || !end || end <= start) {
    return 0;
  }

  return Math.max(
    0,
    (timeToMinutes(end) -
      timeToMinutes(start)) / 60
  );
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

const getLoggedInUserName = (
  fallback: string
): string => {
  try {
    const stored =
      localStorage.getItem("loggedInUser");

    if (!stored) return fallback;

    const user = JSON.parse(stored) as {
      name?: string;
      email?: string;
    };

    return user.name || user.email || fallback;
  } catch {
    return fallback;
  }
};

const mapApiRequest = (
  item: LeaveApiData,
  employeeName: string
): LeaveRequest => {
  const leaveType = getLeaveType(item.leaveType);

  return {
    id: item._id,
    userId: item.user_id,
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
    startTime: item.fromTime ?? undefined,
    endTime: item.toTime ?? undefined,
    totalDays: Number(item.totalDays) || 0,
    totalHours: Number(item.totalHours) || 0,
    reason: item.reason,
    status: item.status,
    apiData: item,
  };
};

const isCountedRequest = (
  request: LeaveRequest
): boolean =>
  request.status === "Pending" ||
  request.status === "Approved";

const getDuration = (
  request: LeaveRequest
): string =>
  request.leaveType === "PERMISSION"
    ? `${request.totalHours} hr`
    : `${request.totalDays} day${
        request.totalDays === 1 ? "" : "s"
      }`;

/* ================= MAIN PAGE ================= */

function EmployeeLeavesPermissions() {
  const { currentUser } = useCurrentUser();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<
    LeaveRequest[]
  >([]);

  const [requestType, setRequestType] =
    useState<"leave" | "permission" | null>(null);

  const [form, setForm] =
    useState<RequestForm>({ ...EMPTY_FORM });

  const [fieldErrors, setFieldErrors] =
    useState<FieldErrors>({});

  const [notice, setNotice] =
    useState<Notice | null>(null);

  const [listError, setListError] = useState("");
  const [policyError, setPolicyError] = useState("");
  const [formError, setFormError] = useState("");

  const [listLoading, setListLoading] =
    useState(true);

  const [policyLoading, setPolicyLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [leavePolicy, setLeavePolicy] =
    useState<LeavePolicy | null>(null);

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All");

  const employeeName = getLoggedInUserName(
    currentUser.name || "Employee"
  );

  const businessYear = getBusinessYear();

  /* ================= LOAD REQUESTS ================= */

  const fetchLeaveRequests = useCallback(
    async (backgroundRefresh = false) => {
      if (!backgroundRefresh) {
        setListLoading(true);
        setListError("");
      }

      try {
        const response = await api.post<
          ApiResponse<LeaveApiData[] | LeaveApiData>
        >("/leave-apply/list", {
          status: "",
          businessYear: getBusinessYear(),
        });

        if (!response.data.success) {
          throw new Error(
            response.data.message ||
              "Failed to load leave requests."
          );
        }

        const data = response.data.data;

        const records = Array.isArray(data)
          ? data
          : data
            ? [data]
            : [];

        setRequests(
          records.map((item) =>
            mapApiRequest(item, employeeName)
          )
        );
      } catch (error) {
        setListError(
          getErrorMessage(
            error,
            "Failed to load leave requests."
          )
        );
      } finally {
        if (!backgroundRefresh) {
          setListLoading(false);
        }
      }
    },
    [employeeName]
  );

  /* ================= LOAD POLICY ================= */

  const fetchLeavePolicy = useCallback(
    async () => {
      setPolicyLoading(true);
      setPolicyError("");

      try {
        const response = await api.post<
          ApiResponse<LeavePolicy[]>
        >("/leaves/list", {
          businessYear: getBusinessYear(),
        });

        if (!response.data.success) {
          throw new Error(
            response.data.message ||
              "Failed to load leave policy."
          );
        }

        const policies = response.data.data;

        if (!Array.isArray(policies)) {
          throw new Error(
            "Invalid leave policy response."
          );
        }

        const matchingPolicy =
          policies.find(
            (policy) =>
              policy.businessYear ===
              getBusinessYear()
          ) ?? null;

        setLeavePolicy(matchingPolicy);

        if (!matchingPolicy) {
          setPolicyError(
            "No leave policy found for the current business year."
          );
        }
      } catch (error) {
        setLeavePolicy(null);
        setPolicyError(
          getErrorMessage(
            error,
            "Failed to load leave policy."
          )
        );
      } finally {
        setPolicyLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void fetchLeaveRequests();
    void fetchLeavePolicy();
  }, [fetchLeaveRequests, fetchLeavePolicy]);

  useEffect(() => {
    const refreshRequests = () => {
      if (document.visibilityState === "visible") {
        void fetchLeaveRequests(true);
      }
    };

    document.addEventListener(
      "visibilitychange",
      refreshRequests
    );
    window.addEventListener("focus", refreshRequests);
    const refreshInterval = window.setInterval(
      refreshRequests,
      30_000
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        refreshRequests
      );
      window.removeEventListener("focus", refreshRequests);
      window.clearInterval(refreshInterval);
    };
  }, [fetchLeaveRequests]);

  /* ================= FILTERED REQUESTS ================= */

  const filteredRequests = useMemo(
    () =>
      statusFilter === "All"
        ? requests
        : requests.filter(
            (item) =>
              item.status === statusFilter
          ),
    [requests, statusFilter]
  );

  /* ================= BALANCES ================= */

  const usedDays = useCallback(
    (leaveType: LeaveType): number =>
      requests
        .filter(
          (request) =>
            request.leaveType === leaveType &&
            isCountedRequest(request)
        )
        .reduce(
          (total, request) =>
            total + request.totalDays,
          0
        ),
    [requests]
  );

  const today = new Date();

  const usedPermissionsThisMonth =
    requests.filter((request) => {
      if (
        request.leaveType !== "PERMISSION" ||
        !isCountedRequest(request) ||
        !request.date
      ) {
        return false;
      }

      const [year, month] =
        request.date.split("-").map(Number);

      return (
        year === today.getFullYear() &&
        month === today.getMonth() + 1
      );
    }).length;

  const remaining = (
    allocation: number | undefined,
    usage: number
  ): number | null => {
    if (!leavePolicy) return null;

    return Math.max(
      0,
      Number(allocation ?? 0) - usage
    );
  };

  const clRemaining = remaining(
    leavePolicy?.casualLeave,
    usedDays("CL")
  );

  const slRemaining = remaining(
    leavePolicy?.sickLeave,
    usedDays("SL")
  );

  const compOffRemaining = remaining(
    leavePolicy?.compensatoryOff,
    usedDays("COMP_OFF")
  );

  const permissionRemaining = remaining(
    leavePolicy?.permissionsPerMonth,
    usedPermissionsThisMonth
  );

  /* ================= FORM ================= */

  const openForm = (
    leaveType: LeaveType
  ) => {
    setRequestType(
      leaveType === "PERMISSION"
        ? "permission"
        : "leave"
    );

    setForm({
      ...EMPTY_FORM,
      leaveType,
    });

    setFieldErrors({});
    setFormError("");
  };

  const resetForm = () => {
    setRequestType(null);
    setForm({ ...EMPTY_FORM });
    setFieldErrors({});
    setFormError("");
  };

  const updateField = (
    field: keyof RequestForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setFieldErrors((current) => ({
      ...current,
      [field]: undefined,
    }));

    setFormError("");
  };

  const totalDays = diffDaysInclusive(
    form.startDate,
    form.endDate
  );

  const totalHours = diffHours(
    form.startTime,
    form.endTime
  );

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    if (form.leaveType === "PERMISSION") {
      if (!form.date) {
        errors.date =
          "Permission date is required.";
      }

      if (!form.startTime) {
        errors.startTime =
          "Start time is required.";
      }

      if (!form.endTime) {
        errors.endTime =
          "End time is required.";
      }

      if (
        form.startTime &&
        form.endTime &&
        form.endTime <= form.startTime
      ) {
        errors.endTime =
          "End time must be after start time.";
      }
    } else {
      if (!form.startDate) {
        errors.startDate =
          "Start date is required.";
      }

      if (!form.endDate) {
        errors.endDate =
          "End date is required.";
      }

      if (
        form.startDate &&
        form.endDate &&
        form.endDate < form.startDate
      ) {
        errors.endDate =
          "End date cannot precede start date.";
      }

      if (
        form.leaveType === "COMP_OFF" &&
        !form.compOffDate
      ) {
        errors.compOffDate =
          "Comp off date is required.";
      }
    }

    if (!form.reason.trim()) {
      errors.reason = "Reason is required.";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFormError(
        "Please complete all required fields correctly."
      );
      return false;
    }

    return true;
  };

  /* ================= SUBMIT ================= */

  const submitRequest = async () => {
    if (
      !requestType ||
      submitting ||
      !validateForm()
    ) {
      return;
    }

    setSubmitting(true);
    setFormError("");

    const payload =
      form.leaveType === "PERMISSION"
        ? {
            leaveType: "PERMISSION",
            fromDate: form.date,
            fromTime: form.startTime,
            toTime: form.endTime,
            reason: form.reason.trim(),
            businessYear: getBusinessYear(),
          }
        : {
            leaveType: form.leaveType,
            fromDate: form.startDate,
            toDate: form.endDate,
            totalDays,
            ...(form.leaveType === "COMP_OFF" && {
              compensatingDate:
                form.compOffDate,
            }),
            reason: form.reason.trim(),
            businessYear: getBusinessYear(),
          };

    try {
      const response = await api.post<
        ApiResponse<LeaveApiData>
      >("/leave-apply/apply", payload);

      if (!response.data.success) {
        throw new Error(
          response.data.message ||
            "Failed to submit request."
        );
      }

      resetForm();

      setNotice({
        severity: "success",
        text:
          response.data.message ||
          "Request submitted successfully.",
      });

      await fetchLeaveRequests();
    } catch (error) {
      setFormError(
        getErrorMessage(
          error,
          "Failed to submit your request."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= VIEW DETAILS ================= */

  const viewRequest = (id: string) => {
    const selected = requests.find(
      (request) => request.id === id
    );

    navigate(
      `/employee-leaves-permissions/leave-detail/${id}`,
      {
        state: {
          request: selected?.apiData,
        },
      }
    );
  };

  /* ================= RENDER ================= */

  return (
    <Box className="employee-leaves-page">
      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={4000}
        onClose={() => setNotice(null)}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        {notice ? (
          <Alert
            severity={notice.severity}
            variant="filled"
            onClose={() => setNotice(null)}
          >
            {notice.text}
          </Alert>
        ) : undefined}
      </Snackbar>

      {/* PAGE HEADER */}

      <Box className="employee-leaves-header">
        <Box className="employee-leaves-heading">
          <Box className="employee-leaves-heading-icon">
            <EventAvailableOutlinedIcon />
          </Box>

          <Box>
            <Typography
              component="h2"
              className="page-title"
            >
              Leaves & Permissions
            </Typography>

            <Typography className="page-subtitle">
              Apply for time off and track your
              requests.
            </Typography>
          </Box>
        </Box>

        <Chip
          label={`Business Year ${businessYear}`}
          className="employee-leaves-year-chip"
        />
      </Box>

      {/* BALANCE CARDS */}

      <Box className="balance-grid">
        <SimpleBalanceCard
          label="Casual Leave"
          value={clRemaining}
          unit="estimated days remaining"
          icon={<EventAvailableOutlinedIcon />}
          loading={policyLoading || listLoading}
        />

        <SimpleBalanceCard
          label="Sick Leave"
          value={slRemaining}
          unit="estimated days remaining"
          icon={<HealthAndSafetyOutlinedIcon />}
          loading={policyLoading || listLoading}
        />

        <SimpleBalanceCard
          label="Compensatory Off"
          value={compOffRemaining}
          unit="estimated days remaining"
          icon={<WorkHistoryOutlinedIcon />}
          loading={policyLoading || listLoading}
        />

        <SimpleBalanceCard
          label="Permissions"
          value={permissionRemaining}
          unit="estimated remaining this month"
          icon={<FactCheckOutlinedIcon />}
          loading={policyLoading || listLoading}
        />
      </Box>

      {(policyError || listError) && (
        <Alert
          severity="warning"
          className="employee-leaves-warning"
          action={
            <Button
              size="small"
              color="inherit"
              startIcon={<RefreshRoundedIcon />}
              onClick={() => {
                void fetchLeavePolicy();
                void fetchLeaveRequests();
              }}
            >
              Retry
            </Button>
          }
        >
          {policyError || listError}
        </Alert>
      )}

      {/* APPLICATION SECTION */}

      <Paper
        className="apply-card"
        elevation={0}
      >
        <Box className="apply-card-content">
          <Box className="apply-card-icon">
            <AddCircleOutlinedIcon />
          </Box>

          <Box>
            <Typography className="apply-card-title">
              Need time away?
            </Typography>

            <Typography className="apply-card-description">
              Submit a leave application or request
              a short permission.
            </Typography>
          </Box>
        </Box>

        <Box className="apply-card-actions">
          <Button
            variant="contained"
            className="apply-button"
            startIcon={<EventAvailableOutlinedIcon />}
            onClick={() => openForm("CL")}
            disabled={submitting}
          >
            Apply Leave
          </Button>

          <Button
            variant="outlined"
            className="apply-permission-button"
            startIcon={<AccessTimeOutlinedIcon />}
            onClick={() => openForm("PERMISSION")}
            disabled={submitting}
          >
            Apply Permission
          </Button>
        </Box>
      </Paper>

      {/* APPLICATION FORM */}

      {requestType && (
        <Paper
          className="request-form-card"
          elevation={0}
        >
          <Box className="request-form-header">
            <Box className="request-form-heading">
              <Box className="request-form-icon">
                <DescriptionOutlinedIcon />
              </Box>

              <Box>
                <Typography className="form-title">
                  {requestType === "permission"
                    ? "Permission Application"
                    : "Leave Application"}
                </Typography>

                <Typography className="form-subtitle">
                  Enter your request information below.
                </Typography>
              </Box>
            </Box>

            <IconButton
              aria-label="Close application"
              onClick={resetForm}
              disabled={submitting}
              className="request-form-close"
            >
              <CloseRoundedIcon />
            </IconButton>
          </Box>

          {formError && (
            <Alert
              severity="error"
              className="request-form-error"
            >
              {formError}
            </Alert>
          )}

          <Box className="form-fields">
            <FieldRow label="Leave Type" required>
              <FormControl
                fullWidth
                size="small"
              >
                <Select
                  value={form.leaveType}
                  disabled={submitting}
                  onChange={(event) => {
                    const value =
                      event.target.value as LeaveType;

                    updateField("leaveType", value);
                  }}
                >
                  {(requestType === "permission"
                    ? PERMISSION_TYPE_OPTIONS
                    : LEAVE_TYPE_OPTIONS
                  ).map(({ value, label }) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </FieldRow>

            {form.leaveType === "PERMISSION" ? (
              <>
                <FieldRow
                  label="Permission Date"
                  required
                >
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={form.date}
                    disabled={submitting}
                    error={Boolean(fieldErrors.date)}
                    helperText={fieldErrors.date}
                    onChange={(event) =>
                      updateField(
                        "date",
                        event.target.value
                      )
                    }
                  />
                </FieldRow>

                <FieldRow
                  label="Start Time"
                  required
                >
                  <TextField
                    fullWidth
                    size="small"
                    type="time"
                    value={form.startTime}
                    disabled={submitting}
                    error={Boolean(
                      fieldErrors.startTime
                    )}
                    helperText={
                      fieldErrors.startTime
                    }
                    onChange={(event) =>
                      updateField(
                        "startTime",
                        event.target.value
                      )
                    }
                  />
                </FieldRow>

                <FieldRow
                  label="End Time"
                  required
                >
                  <TextField
                    fullWidth
                    size="small"
                    type="time"
                    value={form.endTime}
                    disabled={submitting}
                    error={Boolean(
                      fieldErrors.endTime
                    )}
                    helperText={fieldErrors.endTime}
                    onChange={(event) =>
                      updateField(
                        "endTime",
                        event.target.value
                      )
                    }
                  />
                </FieldRow>

                <FieldRow label="Total Hours">
                  <TextField
                    fullWidth
                    size="small"
                    value={
                      form.startTime && form.endTime
                        ? totalHours
                        : ""
                    }
                    disabled
                  />
                </FieldRow>
              </>
            ) : (
              <>
                <FieldRow
                  label="Start Date"
                  required
                >
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={form.startDate}
                    disabled={submitting}
                    error={Boolean(
                      fieldErrors.startDate
                    )}
                    helperText={fieldErrors.startDate}
                    onChange={(event) =>
                      updateField(
                        "startDate",
                        event.target.value
                      )
                    }
                  />
                </FieldRow>

                <FieldRow
                  label="End Date"
                  required
                >
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={form.endDate}
                    disabled={submitting}
                    error={Boolean(
                      fieldErrors.endDate
                    )}
                    helperText={fieldErrors.endDate}
                    onChange={(event) =>
                      updateField(
                        "endDate",
                        event.target.value
                      )
                    }
                    slotProps={{
                      htmlInput: {
                        min:
                          form.startDate || undefined,
                      },
                    }}
                  />
                </FieldRow>

                {form.leaveType === "COMP_OFF" && (
                  <FieldRow
                    label="Comp Off Date"
                    required
                  >
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={form.compOffDate}
                      disabled={submitting}
                      error={Boolean(
                        fieldErrors.compOffDate
                      )}
                      helperText={
                        fieldErrors.compOffDate
                      }
                      onChange={(event) =>
                        updateField(
                          "compOffDate",
                          event.target.value
                        )
                      }
                    />
                  </FieldRow>
                )}

                <FieldRow label="Total Days">
                  <TextField
                    fullWidth
                    size="small"
                    value={
                      form.startDate && form.endDate
                        ? totalDays
                        : ""
                    }
                    disabled
                  />
                </FieldRow>
              </>
            )}

            <FieldRow label="Reason" required>
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={3}
                value={form.reason}
                disabled={submitting}
                error={Boolean(fieldErrors.reason)}
                helperText={fieldErrors.reason}
                placeholder="Briefly explain your request"
                onChange={(event) =>
                  updateField(
                    "reason",
                    event.target.value
                  )
                }
              />
            </FieldRow>
          </Box>

          <Box className="form-actions">
            <Button
              variant="outlined"
              className="cancel-button"
              onClick={resetForm}
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              className="submit-button"
              disabled={submitting}
              onClick={() => void submitRequest()}
              startIcon={
                submitting ? (
                  <CircularProgress
                    size={16}
                    color="inherit"
                  />
                ) : (
                  <SendOutlinedIcon />
                )
              }
            >
              {submitting
                ? "Submitting..."
                : "Submit Request"}
            </Button>
          </Box>
        </Paper>
      )}

      {/* REQUEST HISTORY */}

      <RequestTable
        requests={filteredRequests}
        loading={listLoading}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onView={viewRequest}
      />
    </Box>
  );
}

/* ================= FIELD ROW ================= */

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
    <Box className="field-row">
      <Typography className="field-label">
        {label}
        {required && (
          <span className="required-star">
            *
          </span>
        )}
      </Typography>
      {children}
    </Box>
  );
}

/* ================= BALANCE CARD ================= */

function SimpleBalanceCard({
  label,
  value,
  unit,
  icon,
  loading,
}: {
  label: string;
  value: number | null;
  unit: string;
  icon: ReactNode;
  loading: boolean;
}) {
  return (
    <Paper className="balance-card" elevation={0}>
      <Box className="balance-card-content">
        <Box className="balance-card-text">
          <Typography className="balance-label">
            {label}
          </Typography>

          <Typography className="balance-value">
            {loading
              ? "..."
              : value === null
                ? "—"
                : value}
          </Typography>

          <Typography className="balance-unit">
            {unit}
          </Typography>
        </Box>

        <Box className="balance-icon">{icon}</Box>
      </Box>
    </Paper>
  );
}

/* ================= REQUEST TABLE ================= */

function RequestTable({
  requests,
  loading,
  statusFilter,
  onStatusChange,
  onView,
}: {
  requests: LeaveRequest[];
  loading: boolean;
  statusFilter: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  onView: (id: string) => void;
}) {
  return (
    <Paper className="requests-card" elevation={0}>
      <Box className="requests-card-header">
        <Box className="requests-card-heading">
          <Typography className="requests-title">
            Leave Request History
          </Typography>

          <Typography className="requests-subtitle">
            View and track your applications
          </Typography>
        </Box>

        <FormControl size="small">
          <Select
            value={statusFilter}
            onChange={(event) =>
              onStatusChange(
                event.target.value as StatusFilter
              )
            }
            className="requests-status-filter"
            MenuProps={{
              classes: {
                paper: "requests-status-menu",
              },
            }}
            aria-label="Filter leave requests by status"
          >
            <MenuItem value="All">
              All Statuses
            </MenuItem>
            <MenuItem value="Pending">
              Pending
            </MenuItem>
            <MenuItem value="Approved">
              Approved
            </MenuItem>
            <MenuItem value="Rejected">
              Rejected
            </MenuItem>
            <MenuItem value="Cancelled">
              Cancelled
            </MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box className="empty-requests">
          <CircularProgress
            size={24}
            sx={{ color: "#087b4d" }}
          />
          <Typography className="empty-requests-text">
            Loading requests...
          </Typography>
        </Box>
      ) : requests.length === 0 ? (
        <Box className="empty-requests">
          <DescriptionOutlinedIcon className="empty-requests-icon" />
          <Typography className="empty-requests-title">
            No requests found
          </Typography>
          <Typography className="empty-requests-text">
            No leave or permission requests
            match this status.
          </Typography>
        </Box>
      ) : (
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
            <Table
              className="requests-table"
              size="small"
            >
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Leave Type</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
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
      )}
    </Paper>
  );
}

/* ================= MOBILE REQUEST CARD ================= */

function RequestCard({
  request,
  onView,
}: {
  request: LeaveRequest;
  onView: (id: string) => void;
}) {
  return (
    <Paper
      className="request-card"
      elevation={0}
    >
      <Box className="request-card-header">
        <Box className="request-card-heading">
          <Typography className="request-card-name">
            {TYPE_LABELS[request.leaveType]}
          </Typography>

          <Typography className="request-card-type">
            {request.employeeName}
          </Typography>
        </Box>

        <Box className="request-card-actions">
          <Chip
            label={request.status}
            size="small"
            className={`status-chip status-${request.status.toLowerCase()}`}
          />

          <Tooltip title="View details">
            <IconButton
              size="small"
              aria-label="View leave details"
              onClick={() =>
                onView(request.id)
              }
            >
              <VisibilityOutlinedIcon
                fontSize="small"
              />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box className="request-card-grid">
        <RequestCardField
          label="From"
          value={formatDate(
            request.startDate ?? request.date
          )}
        />

        <RequestCardField
          label="To"
          value={formatDate(
            request.endDate ?? request.date
          )}
        />

        <RequestCardField
          label="Duration"
          value={getDuration(request)}
        />
      </Box>
    </Paper>
  );
}

/* ================= CARD FIELD ================= */

function RequestCardField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Box className="request-card-field">
      <Typography className="request-card-label">
        {label}
      </Typography>

      <Typography className="request-card-value">
        {value}
      </Typography>
    </Box>
  );
}

/* ================= DESKTOP REQUEST ROW ================= */

function RequestRow({
  request,
  onView,
}: {
  request: LeaveRequest;
  onView: (id: string) => void;
}) {
  return (
    <TableRow hover>
      <TableCell className="request-cell request-employee-cell">
        {request.employeeName}
      </TableCell>

      <TableCell className="request-cell">
        {TYPE_LABELS[request.leaveType]}
      </TableCell>

      <TableCell className="request-cell request-nowrap-cell">
        {formatDate(
          request.startDate ?? request.date
        )}
      </TableCell>

      <TableCell className="request-cell request-nowrap-cell">
        {formatDate(
          request.endDate ?? request.date
        )}
      </TableCell>

      <TableCell className="request-cell request-total-days-cell">
        {getDuration(request)}
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
        align="right"
      >
        <Tooltip title="View Details">
          <IconButton
            aria-label="View leave details"
            onClick={() =>
              onView(request.id)
            }
          >
            <VisibilityOutlinedIcon />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

export default EmployeeLeavesPermissions;
