import { useEffect, useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import api from "../../../../api/axiosInstance";
import { useCurrentUser } from "../../../../context/UserContext";
import "./LeaveDetail.css";

type LeaveType = "CL" | "SL" | "COMP_OFF" | "PERMISSION";
type RequestStatus = "Pending" | "Approved" | "Rejected";

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

const toInputDate = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const diffDaysInclusive = (start: string, end: string) => {
  return (
    Math.round(
      (new Date(`${end}T00:00:00`).getTime() -
        new Date(`${start}T00:00:00`).getTime()) /
        86400000,
    ) + 1
  );
};

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const diffHours = (start: string, end: string) => {
  return (timeToMinutes(end) - timeToMinutes(start)) / 60;
};

const getBusinessYear = (date = new Date()) => {
  const year = date.getFullYear();
  return date.getMonth() >= 3
    ? `${year}-${year + 1}`
    : `${year - 1}-${year}`;
};

const mapApiToForm = (item: LeaveApiData): RequestForm => {
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
    compOffDate: item.compensatingDate
      ? toInputDate(item.compensatingDate)
      : "",
    startTime: "",
    endTime: "",
    reason: item.reason ?? "",
  };
};

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

  const [request, setRequest] = useState<LeaveApiData | null>(null);
  const [form, setForm] = useState<RequestForm>(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchLeaveDetail = async () => {
    if (!id) {
      setError("Leave request ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      if (fallbackRequest) {
        setRequest(fallbackRequest);
        setForm(mapApiToForm(fallbackRequest));
      }

      const response = await api.post<LeaveListResponse>(
        "/leave-apply/list",
        {
          status: "",
          businessYear: getBusinessYear(),
        },
      );

      if (!response.data.success) {
        setError(response.data.message || "Failed to load leave request.");
        return;
      }

      const apiData = Array.isArray(response.data.data)
        ? response.data.data
        : response.data.data
          ? [response.data.data]
          : [];

      const foundRequest = apiData.find(
        (item) =>
          item._id === id &&
          (!currentUser.id || item.user_id === currentUser.id),
      );

      if (!foundRequest) {
        if (!fallbackRequest) {
          setError("Leave request not found.");
        }
        return;
      }

      setRequest(foundRequest);
      setForm(mapApiToForm(foundRequest));
    } catch (requestError) {
      console.error("Leave detail API error:", requestError);
      setError("Failed to load leave request.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveDetail();
  }, [id, currentUser.id]);

  const updateField = (
    field: keyof RequestForm,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setError("");
    setMessage("");
  };

  const validateForm = () => {
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
        return false;
      }

      if (form.endTime <= form.startTime) {
        setError(
          "Permission end time must be after the start time.",
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
      setError("Please enter the leave dates and reason.");
      return false;
    }

    if (form.endDate < form.startDate) {
      setError(
        "Leave end date must be on or after the start date.",
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

  const createUpdateBody = () => {
    if (form.leaveType === "PERMISSION") {
      return {
        _id: id,
        leaveType: "PERMISSION",
        fromDate: form.date,
        fromTime: form.startTime,
        toTime: form.endTime,
        totalHours: diffHours(
          form.startTime,
          form.endTime,
        ),
        reason: form.reason.trim(),
      };
    }

    return {
      _id: id,
      leaveType: form.leaveType,
      fromDate: form.startDate,
      toDate: form.endDate,
      totalDays: diffDaysInclusive(
        form.startDate,
        form.endDate,
      ),
      ...(form.leaveType === "COMP_OFF" && {
        compensatingDate: form.compOffDate,
      }),
      reason: form.reason.trim(),
    };
  };

  const handleSave = async () => {
    if (!id || !validateForm()) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response =
        await api.post<LeaveUpdateResponse>(
          "/leave-apply/update",
          createUpdateBody(),
        );

      if (!response.data.success) {
        setError(
          response.data.message ||
            "Failed to update leave request.",
        );
        return;
      }

      setMessage(
        response.data.message ||
          "Leave request updated successfully.",
      );

      if (response.data.data) {
        setRequest(response.data.data);
        setForm(mapApiToForm(response.data.data));
      } else {
        await fetchLeaveDetail();
      }

      setIsEditing(false);
    } catch (requestError) {
      console.error("Leave update API error:", requestError);
      setError(
        "Failed to update leave request. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (request) {
      setForm(mapApiToForm(request));
    }

    setIsEditing(false);
    setError("");
  };

  const displayEmployeeName =
    currentUser.name || "Employee";

  return (
    <Box className="leave-detail-page">
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

      <Stack
        className="leave-detail-header"
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
      >
        <Box>
          <Typography className="leave-detail-title">
            Leave Details
          </Typography>
          <Typography className="leave-detail-subtitle">
            View and update your leave request.
          </Typography>
        </Box>

        <Button
          className="back-button"
          variant="outlined"
          onClick={() =>
              navigate("/employee-leaves-permissions")
          }
        >
          Back
        </Button>
      </Stack>

      {loading ? (
        <Paper
          className="leave-detail-card"
          elevation={0}
        >
          <Typography className="leave-detail-message">
            Loading leave request...
          </Typography>
        </Paper>
      ) : request ? (
        <>
          <Paper
            className="employee-info-card"
            elevation={0}
          >
            <Typography className="section-title">
              Employee Details
            </Typography>

            <Box className="employee-info-grid">
              <InfoItem
                label="Employee Name"
                value={displayEmployeeName}
              />
              <InfoItem
                label="Employee ID"
                value={request.user_id}
              />
              <InfoItem
                label="Request Status"
                value={request.status}
              />
              <InfoItem
                label="Request ID"
                value={request._id}
              />
            </Box>
          </Paper>

          <Paper
            className="leave-detail-card"
            elevation={0}
          >
            <Stack
              className="detail-card-header"
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
            >
              <Typography className="section-title">
                Leave Request
              </Typography>

              {!isEditing && (
                <Button
                  className="edit-button"
                  variant="contained"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
            </Stack>

            <Stack className="form-fields" spacing={2.5}>
              <FieldRow
                label="Leave type"
                required={isEditing}
              >
                <FormControl
                  fullWidth
                  size="small"
                  disabled={!isEditing}
                >
                  <Select
                    value={form.leaveType}
                    onChange={(event) =>
                      updateField(
                        "leaveType",
                        event.target.value as LeaveType,
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

              {form.leaveType === "PERMISSION" ? (
                <>
                  <FieldRow
                    label="Permission date"
                    required={isEditing}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={form.date}
                      disabled={!isEditing}
                      onChange={(event) =>
                        updateField(
                          "date",
                          event.target.value,
                        )
                      }
                      slotProps={{
                        inputLabel: { shrink: true },
                      }}
                    />
                  </FieldRow>

                  <FieldRow
                    label="Start time"
                    required={isEditing}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      type="time"
                      value={form.startTime}
                      disabled={!isEditing}
                      onChange={(event) =>
                        updateField(
                          "startTime",
                          event.target.value,
                        )
                      }
                      slotProps={{
                        inputLabel: { shrink: true },
                      }}
                    />
                  </FieldRow>

                  <FieldRow
                    label="End time"
                    required={isEditing}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      type="time"
                      value={form.endTime}
                      disabled={!isEditing}
                      onChange={(event) =>
                        updateField(
                          "endTime",
                          event.target.value,
                        )
                      }
                      slotProps={{
                        inputLabel: { shrink: true },
                      }}
                    />
                  </FieldRow>

                  <FieldRow
                    label="Permission reason"
                    required={isEditing}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      value={form.reason}
                      disabled={!isEditing}
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
                    required={isEditing}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={form.startDate}
                      disabled={!isEditing}
                      onChange={(event) =>
                        updateField(
                          "startDate",
                          event.target.value,
                        )
                      }
                      slotProps={{
                        inputLabel: { shrink: true },
                      }}
                    />
                  </FieldRow>

                  <FieldRow
                    label="End date"
                    required={isEditing}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={form.endDate}
                      disabled={!isEditing}
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
                        inputLabel: { shrink: true },
                      }}
                    />
                  </FieldRow>

                  {form.leaveType === "COMP_OFF" && (
                    <FieldRow
                      label="Comp off date"
                      required={isEditing}
                    >
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        value={form.compOffDate}
                        disabled={!isEditing}
                        onChange={(event) =>
                          updateField(
                            "compOffDate",
                            event.target.value,
                          )
                        }
                        slotProps={{
                          inputLabel: { shrink: true },
                        }}
                      />
                    </FieldRow>
                  )}

                  <FieldRow
                    label="Leave reason"
                    required={isEditing}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      value={form.reason}
                      disabled={!isEditing}
                      onChange={(event) =>
                        updateField(
                          "reason",
                          event.target.value,
                        )
                      }
                    />
                  </FieldRow>

                  <FieldRow label="Total days">
                    <TextField
                      fullWidth
                      size="small"
                      value={request.totalDays}
                      disabled
                    />
                  </FieldRow>

                </>
              )}

              {form.leaveType === "PERMISSION" && (
                <FieldRow label="Total hours">
                  <TextField
                    fullWidth
                    size="small"
                    value={request.totalHours}
                    disabled
                  />
                </FieldRow>
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
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
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
    <Stack className="field-row">
      <Typography className="field-label">
        {label}
        {required && (
          <span className="required-star">*</span>
        )}
      </Typography>
      {children}
    </Stack>
  );
}

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
        {value}
      </Typography>
    </Box>
  );
}

export default LeaveDetail;
