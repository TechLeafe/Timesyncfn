
import {
  useCallback,
  useEffect,
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
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../../../../api/axiosInstance";
import { useCurrentUser } from "../../../../context/UserContext";

import "./LeaveDetail.css";

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

interface LeaveUpdateResponse {
  success: boolean;
  message: string;
  data?: LeaveApiData;
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

/* ================= HELPERS ================= */

const getLeaveType = (value: string): LeaveType => {
  switch (value) {
    case "SL":
    case "COMP_OFF":
    case "PERMISSION":
      return value;
    default:
      return "CL";
  }
};

const getLeaveTypeLabel = (value: LeaveType) => {
  switch (value) {
    case "CL":
      return "Casual Leave";
    case "SL":
      return "Sick Leave";
    case "COMP_OFF":
      return "Compensatory Off";
    case "PERMISSION":
      return "Permission";
  }
};

const toInputDate = (
  value?: string | null
): string => {
  if (!value) return "";

  // Preserve calendar dates supplied as YYYY-MM-DD
  // or as ISO strings beginning with that date.
  const match = value.match(/^\d{4}-\d{2}-\d{2}/);

  if (match) return match[0];

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(
    2,
    "0"
  );
  const day = String(date.getDate()).padStart(
    2,
    "0"
  );

  return `${year}-${month}-${day}`;
};

const diffDaysInclusive = (
  start: string,
  end: string
): number => {
  if (!start || !end || end < start) return 0;

  const startTime = Date.parse(`${start}T00:00:00Z`);
  const endTime = Date.parse(`${end}T00:00:00Z`);

  if (
    Number.isNaN(startTime) ||
    Number.isNaN(endTime)
  ) {
    return 0;
  }

  return (
    Math.round(
      (endTime - startTime) / 86400000
    ) + 1
  );
};

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return 0;
  }

  return hours * 60 + minutes;
};

const diffHours = (
  start: string,
  end: string
): number => {
  if (!start || !end) return 0;

  return Math.max(
    0,
    (timeToMinutes(end) -
      timeToMinutes(start)) / 60
  );
};

const getBusinessYear = (date = new Date()) => {
  const year = date.getFullYear();

  return date.getMonth() >= 3
    ? `${year}-${year + 1}`
    : `${year - 1}-${year}`;
};

const getLoggedInUserName = (
  fallback: string
): string => {
  try {
    const storedUser =
      localStorage.getItem("loggedInUser");

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

  return fallback;
};

const mapApiToForm = (
  item: LeaveApiData
): RequestForm => {
  const leaveType = getLeaveType(item.leaveType);

  if (leaveType === "PERMISSION") {
    return {
      leaveType,
      date: toInputDate(item.fromDate),
      startDate: "",
      endDate: "",
      compOffDate: "",
      startTime: item.fromTime ?? "",
      endTime: item.toTime ?? "",
      reason: item.reason ?? "",
    };
  }

  return {
    leaveType,
    date: "",
    startDate: toInputDate(item.fromDate),
    endDate: toInputDate(item.toDate),
    compOffDate: toInputDate(
      item.compensatingDate
    ),
    startTime: "",
    endTime: "",
    reason: item.reason ?? "",
  };
};

/* ================= COMPONENT ================= */

function LeaveDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();

  const navigationState = location.state as {
    request?: LeaveApiData;
  } | null;

  const navigationRequest = navigationState?.request;

  const fallbackRequest =
    navigationRequest?._id === id
      ? navigationRequest
      : null;

  const [request, setRequest] =
    useState<LeaveApiData | null>(null);

  const [form, setForm] =
    useState<RequestForm>(EMPTY_FORM);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /* ================= FETCH DETAIL ================= */

  const fetchLeaveDetail = useCallback(
    async () => {
      if (!id) {
        setRequest(null);
        setLoading(false);
        setError("Leave request ID is missing.");
        return;
      }

      setLoading(true);
      setError("");

      if (fallbackRequest) {
        setRequest(fallbackRequest);
        setForm(mapApiToForm(fallbackRequest));
      }

      try {
        const response =
          await api.post<LeaveListResponse>(
            "/leave-apply/list",
            {
              status: "",
              businessYear: getBusinessYear(),
            }
          );

        if (!response.data.success) {
          throw new Error(
            response.data.message ||
              "Failed to load leave request."
          );
        }

        const data = response.data.data;

        const requests = Array.isArray(data)
          ? data
          : data
            ? [data]
            : [];

        const found = requests.find(
          (item) =>
            item._id === id &&
            (!currentUser.id ||
              item.user_id === currentUser.id)
        );

        if (!found) {
          if (!fallbackRequest) {
            setRequest(null);
            setError("Leave request not found.");
          }
          return;
        }

        setRequest(found);
        setForm(mapApiToForm(found));
      } catch (err) {
        if (!fallbackRequest) {
          setRequest(null);
        }

        setError(
          getErrorMessage(
            err,
            "Failed to load leave request."
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [id, currentUser.id, fallbackRequest]
  );

  useEffect(() => {
    void fetchLeaveDetail();
  }, [fetchLeaveDetail]);

  /* ================= EDIT FIELDS ================= */

  const updateField = (
    field: keyof RequestForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  };

  const calculatedDays = diffDaysInclusive(
    form.startDate,
    form.endDate
  );

  const calculatedHours = diffHours(
    form.startTime,
    form.endTime
  );

  const isEditable =
    request?.status === "Pending";

  /* ================= VALIDATION ================= */

  const validateForm = (): boolean => {
    if (form.leaveType === "PERMISSION") {
      if (
        !form.date ||
        !form.startTime ||
        !form.endTime ||
        !form.reason.trim()
      ) {
        setError(
          "Please enter the permission date, time, and reason."
        );
        return false;
      }

      if (
        timeToMinutes(form.endTime) <=
        timeToMinutes(form.startTime)
      ) {
        setError(
          "Permission end time must be after the start time."
        );
        return false;
      }

      return true;
    }

    if (
      !form.startDate ||
      !form.endDate ||
      !form.reason.trim()
    ) {
      setError(
        "Please enter the leave dates and reason."
      );
      return false;
    }

    if (form.endDate < form.startDate) {
      setError(
        "Leave end date must be on or after the start date."
      );
      return false;
    }

    if (
      form.leaveType === "COMP_OFF" &&
      !form.compOffDate
    ) {
      setError("Please select the comp off date.");
      return false;
    }

    return true;
  };

  /* ================= UPDATE BODY ================= */

  const createUpdateBody = () => {
    if (form.leaveType === "PERMISSION") {
      return {
        _id: id,
        leaveType: "PERMISSION",
        fromDate: form.date,
        fromTime: form.startTime,
        toTime: form.endTime,
        totalHours: calculatedHours,
        reason: form.reason.trim(),
      };
    }

    return {
      _id: id,
      leaveType: form.leaveType,
      fromDate: form.startDate,
      toDate: form.endDate,
      totalDays: calculatedDays,
      ...(form.leaveType === "COMP_OFF" && {
        compensatingDate: form.compOffDate,
      }),
      reason: form.reason.trim(),
    };
  };

  /* ================= SAVE ================= */

  const handleSave = async () => {
    if (
      !id ||
      !request ||
      !isEditable ||
      saving ||
      !validateForm()
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response =
        await api.post<LeaveUpdateResponse>(
          "/leave-apply/update",
          createUpdateBody()
        );

      if (!response.data.success) {
        setError(
          response.data.message ||
            "Failed to update leave request."
        );
        return;
      }

      setMessage(
        response.data.message ||
          "Leave request updated successfully."
      );

      if (response.data.data) {
        setRequest(response.data.data);
        setForm(
          mapApiToForm(response.data.data)
        );
      } else {
        await fetchLeaveDetail();
      }

      setIsEditing(false);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Failed to update leave request. Please try again."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  /* ================= CANCEL EDIT ================= */

  const handleCancelEdit = () => {
    if (request) {
      setForm(mapApiToForm(request));
    }

    setIsEditing(false);
    setError("");
  };

  const displayEmployeeName =
    getLoggedInUserName(
      currentUser.name || "Employee"
    );

  const statusClass = request
    ? `leave-detail-status--${request.status.toLowerCase()}`
    : "";

  /* ================= UI ================= */

  return (
    <Box className="leave-detail-page">
      <Snackbar
        open={Boolean(message)}
        autoHideDuration={3500}
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

      {/* HEADER */}

      <Box className="leave-detail-header">
        <Box className="leave-detail-heading">
          <Box className="leave-detail-heading-icon">
            <EventNoteOutlinedIcon />
          </Box>

          <Box className="leave-detail-heading-text">
            <Typography
              component="h2"
              className="leave-detail-title"
            >
              Leave Details
            </Typography>

            <Typography className="leave-detail-subtitle">
              View and manage your leave request.
            </Typography>
          </Box>
        </Box>

        <Button
          className="back-button"
          variant="outlined"
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() =>
            navigate("/employee-leaves-permissions")
          }
        >
          Back to Requests
        </Button>
      </Box>

      {/* ERROR */}

      {error && (
        <Alert
          severity="error"
          className="leave-detail-error"
          onClose={() => setError("")}
          action={
            !isEditing ? (
              <Button
                size="small"
                color="inherit"
                startIcon={<RefreshRoundedIcon />}
                disabled={loading}
                onClick={() =>
                  void fetchLeaveDetail()
                }
              >
                Retry
              </Button>
            ) : undefined
          }
        >
          {error}
        </Alert>
      )}

      {/* LOADING */}

      {loading && !request ? (
        <Paper
          className="leave-detail-card leave-detail-loading"
          elevation={0}
        >
          <CircularProgress
            size={26}
            sx={{ color: "#087b4d" }}
          />
          <Typography>
            Loading leave request...
          </Typography>
        </Paper>
      ) : request ? (
        <>
          {/* EMPLOYEE DETAILS */}

          <Paper
            className="employee-info-card"
            elevation={0}
          >
            <Box className="leave-detail-section-heading">
              <Box className="leave-detail-section-icon">
                <PersonOutlineOutlinedIcon />
              </Box>

              <Box>
                <Typography className="section-title">
                  Employee Details
                </Typography>

                <Typography className="section-subtitle">
                  Request owner and approval status
                </Typography>
              </Box>
            </Box>

            <Box className="employee-info-grid">
              <InfoItem
                label="Employee Name"
                value={displayEmployeeName}
              />

              <InfoItem
                label="Employee ID"
                value={request.user_id}
              />

              <Box className="info-item">
                <Typography className="info-label">
                  Request Status
                </Typography>

                <Chip
                  label={request.status}
                  size="small"
                  className={`leave-detail-status ${statusClass}`}
                />
              </Box>
            </Box>

            {request.status === "Rejected" &&
              request.rejectionReason && (
                <Alert
                  severity="error"
                  className="leave-detail-rejection"
                >
                  {request.rejectionReason}
                </Alert>
              )}
          </Paper>

          {/* LEAVE REQUEST */}

          <Paper
            className="leave-detail-card"
            elevation={0}
          >
            <Box className="detail-card-header">
              <Box className="leave-detail-section-heading">
                <Box className="leave-detail-section-icon">
                  <CalendarTodayOutlinedIcon />
                </Box>

                <Box>
                  <Typography className="section-title">
                    Leave Request
                  </Typography>

                  <Typography className="section-subtitle">
                    {getLeaveTypeLabel(
                      form.leaveType
                    )}{" "}
                    request information
                  </Typography>
                </Box>
              </Box>

              {!isEditing && (
                <Button
                  className="edit-button"
                  variant="contained"
                  startIcon={<EditOutlinedIcon />}
                  disabled={!isEditable || loading}
                  onClick={() =>
                    setIsEditing(true)
                  }
                  title={
                    !isEditable
                      ? "Only pending requests can be edited"
                      : "Edit leave request"
                  }
                >
                  Edit Request
                </Button>
              )}
            </Box>

            <Stack
              className="form-fields"
              spacing={0}
            >
              <FieldRow
                label="Leave Type"
                required={isEditing}
              >
                <FormControl
                  fullWidth
                  size="small"
                  disabled={!isEditing || saving}
                >
                  <Select
                    value={form.leaveType}
                    onChange={(event) =>
                      updateField(
                        "leaveType",
                        event.target.value as LeaveType
                      )
                    }
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
                    label="Permission Date"
                    required={isEditing}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={form.date}
                      disabled={
                        !isEditing || saving
                      }
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
                    required={isEditing}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      type="time"
                      value={form.startTime}
                      disabled={
                        !isEditing || saving
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
                    required={isEditing}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      type="time"
                      value={form.endTime}
                      disabled={
                        !isEditing || saving
                      }
                      onChange={(event) =>
                        updateField(
                          "endTime",
                          event.target.value
                        )
                      }
                    />
                  </FieldRow>

                  <FieldRow
                    label="Permission Reason"
                    required={isEditing}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      minRows={2}
                      value={form.reason}
                      disabled={
                        !isEditing || saving
                      }
                      onChange={(event) =>
                        updateField(
                          "reason",
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
                        isEditing
                          ? calculatedHours
                          : request.totalHours
                      }
                      disabled
                    />
                  </FieldRow>
                </>
              ) : (
                <>
                  <FieldRow
                    label="Start Date"
                    required={isEditing}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={form.startDate}
                      disabled={
                        !isEditing || saving
                      }
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
                    required={isEditing}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={form.endDate}
                      disabled={
                        !isEditing || saving
                      }
                      onChange={(event) =>
                        updateField(
                          "endDate",
                          event.target.value
                        )
                      }
                      slotProps={{
                        htmlInput: {
                          min:
                            form.startDate ||
                            undefined,
                        },
                      }}
                    />
                  </FieldRow>

                  {form.leaveType ===
                    "COMP_OFF" && (
                    <FieldRow
                      label="Comp Off Date"
                      required={isEditing}
                    >
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        value={
                          form.compOffDate
                        }
                        disabled={
                          !isEditing || saving
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

                  <FieldRow
                    label="Leave Reason"
                    required={isEditing}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      minRows={2}
                      value={form.reason}
                      disabled={
                        !isEditing || saving
                      }
                      onChange={(event) =>
                        updateField(
                          "reason",
                          event.target.value
                        )
                      }
                    />
                  </FieldRow>

                  <FieldRow label="Total Days">
                    <TextField
                      fullWidth
                      size="small"
                      value={
                        isEditing
                          ? calculatedDays
                          : request.totalDays
                      }
                      disabled
                    />
                  </FieldRow>
                </>
              )}
            </Stack>

            {isEditing && (
              <Stack
                className="form-actions"
                direction="row"
                spacing={1}
              >
                <Button
                  className="cancel-button"
                  variant="outlined"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Cancel
                </Button>

                <Button
                  className="save-button"
                  variant="contained"
                  startIcon={
                    saving ? (
                      <CircularProgress
                        size={16}
                        color="inherit"
                      />
                    ) : (
                      <SaveOutlinedIcon />
                    )
                  }
                  onClick={() =>
                    void handleSave()
                  }
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </Button>
              </Stack>
            )}
          </Paper>
        </>
      ) : (
        <Paper
          className="leave-detail-card"
          elevation={0}
        >
          <Typography className="leave-detail-message">
            Leave request could not be found.
          </Typography>
        </Paper>
      )}
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

/* ================= INFO ITEM ================= */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Box className="info-item">
      <Typography className="info-label">
        {label}
      </Typography>

      <Typography className="info-value">
        {value || "-"}
      </Typography>
    </Box>
  );
}

export default LeaveDetail;
