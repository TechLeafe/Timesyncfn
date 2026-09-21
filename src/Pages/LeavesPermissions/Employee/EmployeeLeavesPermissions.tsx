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
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlined";
import { useCurrentUser } from "../../../context/UserContext";
import "./EmployeeLeavesPermissions.css";

type RequestType = "permission" | "leave";
type LeaveType = "CL" | "SL" | "COMP_OFF" | "PERMISSION";
type RequestStatus = "Pending" | "Approved" | "Rejected";

interface LeaveRequest {
  id: string;
  type: RequestType;
  leaveType?: LeaveType;
  employeeId: string;
  employeeName: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  compOffDate?: string;
  startTime?: string;
  endTime?: string;
  reason: string;
  status: RequestStatus;
  createdAt: string;
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

const STORAGE_KEY = "timesync-leave-requests";

const CL_GRANTED = 12;
const SL_GRANTED = 12;
const PERMISSION_GRANTED_HOURS = 24;

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

const readRequests = (): LeaveRequest[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) as LeaveRequest[] : [];
    return Array.isArray(parsed)
      ? parsed.map((request) => ({
          ...request,
          createdAt:
            typeof request.createdAt === "string"
              ? request.createdAt
              : new Date().toISOString(),
        }))
      : [];
  } catch {
    return [];
  }
};

const formatDate = (value?: string) =>
  value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN") : "-";

const diffDaysInclusive = (start: string, end: string) =>
  Math.round(
    (new Date(`${end}T00:00:00`).getTime() -
      new Date(`${start}T00:00:00`).getTime()) /
      86400000,
  ) + 1;

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const diffHours = (start: string, end: string) =>
  (timeToMinutes(end) - timeToMinutes(start)) / 60;

function EmployeeLeavesPermissions() {
  const { currentUser } = useCurrentUser();
  const [requests, setRequests] = useState<LeaveRequest[]>(readRequests);
  const [requestType, setRequestType] = useState<RequestType | null>(null);
  const [form, setForm] = useState<RequestForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  }, [requests]);

  const employeeRequests = requests.filter(
    (request) => request.employeeId === currentUser.id,
  );

  const updateField = (field: keyof RequestForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage("");
    setError("");
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setRequestType(null);
    setError("");
  };

  const openForm = (type: RequestType, leaveType?: LeaveType) => {
    setRequestType(type);
    setForm((current) => ({
      ...current,
      leaveType: leaveType ?? current.leaveType,
    }));
    setError("");
  };

  const submitRequest = () => {
    if (!requestType) return;

    const isPermission = form.leaveType === "PERMISSION";
    const activeRequestType: RequestType = isPermission ? "permission" : "leave";

    setMessage("");
    setError("");

    if (activeRequestType === "permission") {
      if (
        !form.date ||
        !form.startTime ||
        !form.endTime ||
        !form.reason.trim()
      ) {
        setError("Please enter the permission date, time, and reason.");
        return;
      }

      if (form.endTime <= form.startTime) {
        setError("Permission end time must be after the start time.");
        return;
      }
    } else {
      if (
        !form.startDate ||
        !form.endDate ||
        !form.reason.trim() ||
        (form.leaveType === "COMP_OFF" && !form.compOffDate)
      ) {
        setError(
          form.leaveType === "COMP_OFF"
            ? "Please enter the leave dates, comp off date, and reason."
            : "Please enter the leave dates and reason.",
        );
        return;
      }

      if (form.endDate < form.startDate) {
        setError("Leave end date must be on or after the start date.");
        return;
      }
    }

    const original = editingId
      ? requests.find((request) => request.id === editingId)
      : undefined;

    const nextRequest: LeaveRequest = {
      id: editingId ?? crypto.randomUUID(),
      type: activeRequestType,
      leaveType:
        activeRequestType === "leave" ? form.leaveType : undefined,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      date: activeRequestType === "permission" ? form.date : undefined,
      startDate: activeRequestType === "leave" ? form.startDate : undefined,
      endDate: activeRequestType === "leave" ? form.endDate : undefined,
      compOffDate:
        activeRequestType === "leave" && form.leaveType === "COMP_OFF"
          ? form.compOffDate
          : undefined,
      startTime:
        activeRequestType === "permission" ? form.startTime : undefined,
      endTime:
        activeRequestType === "permission" ? form.endTime : undefined,
      reason: form.reason.trim(),
      status: "Pending",
      createdAt: original?.createdAt ?? new Date().toISOString(),
    };

    setRequests((current) =>
      editingId
        ? current.map((request) =>
            request.id === editingId ? nextRequest : request,
          )
        : [nextRequest, ...current],
    );

    setMessage(
      editingId
        ? "Request updated and sent to HR."
        : "Request sent to HR for review.",
    );
    resetForm();
  };

  const editRequest = (request: LeaveRequest) => {
    setRequestType(request.type);
    setEditingId(request.id);
    setForm({
      leaveType:
        request.type === "permission"
          ? "PERMISSION"
          : request.leaveType ?? "CL",
      date: request.date ?? "",
      startDate: request.startDate ?? "",
      endDate: request.endDate ?? "",
      compOffDate: request.compOffDate ?? "",
      startTime: request.startTime ?? "",
      endTime: request.endTime ?? "",
      reason: request.reason,
    });
    setMessage("");
    setError("");
  };

  const deleteRequest = (id: string) => {
    setRequests((current) => current.filter((request) => request.id !== id));
    setMessage("Request deleted.");
  };

  const approvedDays = (leaveType: LeaveType) =>
    employeeRequests
      .filter(
        (request) =>
          request.type === "leave" &&
          request.leaveType === leaveType &&
          request.status === "Approved",
      )
      .reduce(
        (sum, request) =>
          sum + diffDaysInclusive(request.startDate!, request.endDate!),
        0,
      );

  const approvedPermissionHours = employeeRequests
    .filter(
      (request) =>
        request.type === "permission" && request.status === "Approved",
    )
    .reduce(
      (sum, request) =>
        sum + diffHours(request.startTime!, request.endTime!),
      0,
    );

  const clRemaining = Math.max(CL_GRANTED - approvedDays("CL"), 0);
  const slRemaining = Math.max(SL_GRANTED - approvedDays("SL"), 0);
  const permissionRemaining = Math.max(
    Math.round((PERMISSION_GRANTED_HOURS - approvedPermissionHours) * 10) / 10,
    0,
  );

  return (
    <Box className="employee-leaves-page">
    
      <Stack className="employee-leaves-header" direction={{ xs: "column", sm: "row" }} spacing={2}>
      
        <Box>
          <Typography className="page-title">
          
            Leaves and Permissions
          </Typography>
          <Typography className="page-subtitle">
            Request time away and track your approvals.
          </Typography>
        </Box>
      </Stack>

      {message && (
        <Alert
          severity="success"
          onClose={() => setMessage("")}
        >
          {message}
        </Alert>
      )}

      {error && (
        <Alert className="feedback-alert" severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Box className="balance-grid">
      
        <SimpleBalanceCard
          label="Casual Leave (CL)"
          value={clRemaining}
          unit="days left"
          icon={<EventAvailableOutlinedIcon />}
        />
        <SimpleBalanceCard
          label="Sick Leave (SL)"
          value={slRemaining}
          unit="days left"
          icon={<AccessTimeOutlinedIcon />}
        />
        <SimpleBalanceCard
          label="Permissions"
          value={permissionRemaining}
          unit="hrs left"
          icon={<FactCheckOutlinedIcon />}
        />
        <ApplyCard
          onToggle={() => openForm("leave", "CL")}
        />
      </Box>

      {requestType && (
        <Paper className="request-form-card" elevation={0}>
        
          <Typography className="form-title">
          
            {editingId
              ? "Edit request"
              : form.leaveType === "PERMISSION"
                ? "Permission request"
                : "Leave request"}
          </Typography>

          <Stack className="form-fields" spacing={2.5}>
            <FieldRow label="Leave type">
              <FormControl fullWidth size="small">
                <Select
                  value={form.leaveType}
                  onChange={(event) => {
                    const value = event.target.value as LeaveType;
                    updateField("leaveType", value);
                    setRequestType(value === "PERMISSION" ? "permission" : "leave");
                  }}
                >
                  <MenuItem value="CL">Casual Leave (CL)</MenuItem>
                  <MenuItem value="SL">Sick Leave (SL)</MenuItem>
                  <MenuItem value="PERMISSION">Permission</MenuItem>
                  <MenuItem value="COMP_OFF">Comp Off</MenuItem>
                </Select>
              </FormControl>
            </FieldRow>

            {form.leaveType === "PERMISSION" ? (
              <>
                <FieldRow label="Permission date">
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      updateField("date", event.target.value)
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </FieldRow>

                <FieldRow label="Start time">
                  <TextField
                    fullWidth
                    size="small"
                    type="time"
                    value={form.startTime}
                    onChange={(event) =>
                      updateField("startTime", event.target.value)
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </FieldRow>

                <FieldRow label="End time">
                  <TextField
                    fullWidth
                    size="small"
                    type="time"
                    value={form.endTime}
                    onChange={(event) =>
                      updateField("endTime", event.target.value)
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </FieldRow>

                <FieldRow label="Permission reason">
                  <TextField
                    fullWidth
                    size="small"
                    value={form.reason}
                    onChange={(event) =>
                      updateField("reason", event.target.value)
                    }
                  />
                </FieldRow>
              </>
            ) : (
              <>
                <FieldRow label="Start date">
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={form.startDate}
                    onChange={(event) =>
                      updateField("startDate", event.target.value)
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </FieldRow>

                <FieldRow label="End date">
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={form.endDate}
                    onChange={(event) =>
                      updateField("endDate", event.target.value)
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </FieldRow>

                {form.leaveType === "COMP_OFF" && (
                  <FieldRow label="Comp off date">
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={form.compOffDate}
                      onChange={(event) =>
                        updateField("compOffDate", event.target.value)
                      }
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </FieldRow>
                )}

                <FieldRow label="Leave reason">
                  <TextField
                    fullWidth
                    size="small"
                    value={form.reason}
                    onChange={(event) =>
                      updateField("reason", event.target.value)
                    }
                  />
                </FieldRow>
              </>
            )}
          </Stack>

          <Stack className="form-actions" direction="row" spacing={1}>
          
            <Button className="cancel-button" variant="outlined" onClick={resetForm}>
            
              Cancel
            </Button>
            <Button className="submit-button" variant="contained" onClick={submitRequest}
            >
              {editingId
                ? "Update request"
                : form.leaveType === "PERMISSION"
                  ? "Get permission"
                  : "Get leave"}
            </Button>
          </Stack>
        </Paper>
      )}

      <RequestTable
        requests={employeeRequests}
        onEdit={editRequest}
        onDelete={deleteRequest}
      />
    </Box>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Stack className="field-row" direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 1.5 }}>
    
      <Typography className="field-label">
      
        {label}
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
    <Paper className="balance-card" elevation={0}>
    
      <Stack className="balance-card-content" direction="row">
      
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
    <Paper className="apply-card" elevation={0}>
      <Button
        className="apply-button"
        onClick={onToggle}
        startIcon={<AddCircleOutlineIcon />}
      >
        Apply
      </Button>
    </Paper>
  );
}

function RequestTable({
  requests,
  onEdit,
  onDelete,
}: {
  requests: LeaveRequest[];
  onEdit: (request: LeaveRequest) => void;
  onDelete: (id: string) => void;
}) {
  const rows = requests.map((request) => (
    <RequestRow
      key={request.id}
      request={request}
      actions={
        request.status === "Pending" ? (
          <>
            <IconButton
              aria-label="Edit request"
              onClick={() => onEdit(request)}
            >
              <EditOutlinedIcon />
            </IconButton>
            <IconButton
              aria-label="Delete request"
              onClick={() => onDelete(request.id)}
            >
              <DeleteOutlineIcon />
            </IconButton>
          </>
        ) : undefined
      }
    />
  ));

  return (
    <Paper className="requests-card" elevation={0}>
    
      <Box className="requests-card-header">
        <Typography className="requests-title">
        
          My requests
        </Typography>
      </Box>

      {rows.length ? (
        <Box className="requests-table-wrap">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Date / time</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{rows}</TableBody>
          </Table>
        </Box>
      ) : (
        <Box className="empty-requests">
        
          <Typography className="empty-requests-text">
            You have not submitted any requests yet.
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

function RequestRow({
  request,
  actions,
}: {
  request: LeaveRequest;
  actions?: ReactNode;
}) {
  const details =
    request.type === "permission"
      ? `${formatDate(request.date)} ${request.startTime}-${request.endTime}`
      : request.leaveType === "COMP_OFF"
        ? `${formatDate(request.startDate)} - ${formatDate(request.endDate)} | Comp Off: ${formatDate(request.compOffDate)}`
        : `${formatDate(request.startDate)} - ${formatDate(request.endDate)}`;

  return (
    <TableRow>
      <TableCell className="request-cell request-employee-cell">
        {request.employeeName}
      </TableCell>
      <TableCell className="request-cell">
        {request.type === "permission" ? "Permission" : request.leaveType}
      </TableCell>
      <TableCell className="request-cell request-nowrap-cell">
        {details}
      </TableCell>
      <TableCell className="request-cell request-reason-cell">
        {request.reason}
      </TableCell>
      <TableCell>
        <StatusChip status={request.status} />
      </TableCell>
      <TableCell className="request-action-cell" align="right">
        {actions}
      </TableCell>
    </TableRow>
  );
}

function StatusChip({ status }: { status: RequestStatus }) {

  return (
    <Chip label={status} size="small" className={`status-chip status-${status.toLowerCase()}`} />
  );
}


export default EmployeeLeavesPermissions;
