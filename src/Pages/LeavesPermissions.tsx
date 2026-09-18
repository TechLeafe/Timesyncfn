import { useEffect, useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
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
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import { useCurrentUser } from "../context/UserContext";

type RequestType = "permission" | "leave";
type LeaveType = "CL" | "SL";
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
  startTime: string;
  endTime: string;
  reason: string;
}

const STORAGE_KEY = "timesync-leave-requests";
const GREEN = "#1B6B33";
const GREEN_MID = "#2E7D32";
const GREEN_PALE = "#E8F5E9";
const BORDER = "#DDE9DF";
const RED = "#B42318";
const RED_PALE = "#FDECEC";
const AMBER = "#9A6700";
const AMBER_PALE = "#FFF7E6";
const FONT = "var(--font-family)";
const LABEL_WIDTH = 125;

// Fixed entitlement values. There is no HR-configured entitlement source yet,
// so these are static totals rather than derived data.
const CL_GRANTED = 12;
const SL_GRANTED = 12;
const PERMISSION_GRANTED_HOURS = 24;

const EMPTY_FORM: RequestForm = {
  leaveType: "CL",
  date: "",
  startDate: "",
  endDate: "",
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
        createdAt: typeof request.createdAt === "string" ? request.createdAt : new Date().toISOString(),
      }))
      : [];
  } catch {
    return [];
  }
};

const formatDate = (value?: string) => value
  ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN")
  : "-";

const diffDaysInclusive = (start: string, end: string) =>
  Math.round((new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()) / 86400000) + 1;

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const diffHours = (start: string, end: string) => (timeToMinutes(end) - timeToMinutes(start)) / 60;

function LeavesPermissions() {
  const { currentUser } = useCurrentUser();
  const isHr = currentUser.role === "HR Manager" || currentUser.role === "Admin";
  const [requests, setRequests] = useState<LeaveRequest[]>(readRequests);
  const [requestType, setRequestType] = useState<RequestType | null>(null);
  const [showApplyOptions, setShowApplyOptions] = useState(false);
  const [form, setForm] = useState<RequestForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  }, [requests]);

  const employeeRequests = requests.filter((request) => request.employeeId === currentUser.id);
  const pendingRequests = requests.filter((request) => request.status === "Pending");

  const updateField = (field: keyof RequestForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage("");
    setError("");
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setRequestType(null);
    setShowApplyOptions(false);
    setError("");
  };

  const openForm = (type: RequestType, leaveType?: LeaveType) => {
    setRequestType(type);
    setShowApplyOptions(false);
    setForm((current) => ({ ...current, leaveType: leaveType ?? current.leaveType }));
    setError("");
  };

  const submitRequest = () => {
    if (!requestType) return;
    setMessage("");
    setError("");

    if (requestType === "permission") {
      if (!form.date || !form.startTime || !form.endTime || !form.reason.trim()) {
        setError("Please enter the permission date, time, and reason.");
        return;
      }
      if (form.endTime <= form.startTime) {
        setError("Permission end time must be after the start time.");
        return;
      }
    } else {
      if (!form.startDate || !form.endDate || !form.reason.trim()) {
        setError("Please enter the leave dates and reason.");
        return;
      }
      if (form.endDate < form.startDate) {
        setError("Leave end date must be on or after the start date.");
        return;
      }
    }

    const original = editingId ? requests.find((request) => request.id === editingId) : undefined;

    const nextRequest: LeaveRequest = {
      id: editingId ?? crypto.randomUUID(),
      type: requestType,
      leaveType: requestType === "leave" ? form.leaveType : undefined,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      date: requestType === "permission" ? form.date : undefined,
      startDate: requestType === "leave" ? form.startDate : undefined,
      endDate: requestType === "leave" ? form.endDate : undefined,
      startTime: requestType === "permission" ? form.startTime : undefined,
      endTime: requestType === "permission" ? form.endTime : undefined,
      reason: form.reason.trim(),
      status: "Pending",
      createdAt: original?.createdAt ?? new Date().toISOString(),
    };

    setRequests((current) => editingId
      ? current.map((request) => request.id === editingId ? nextRequest : request)
      : [nextRequest, ...current]);
    setMessage(editingId ? "Request updated and sent to HR." : "Request sent to HR for review.");
    resetForm();
  };

  const editRequest = (request: LeaveRequest) => {
    setRequestType(request.type);
    setEditingId(request.id);
    setShowApplyOptions(false);
    setForm({
      leaveType: request.leaveType ?? "CL",
      date: request.date ?? "",
      startDate: request.startDate ?? "",
      endDate: request.endDate ?? "",
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

  const updateStatus = (id: string, status: RequestStatus) => {
    setRequests((current) => current.map((request) => request.id === id ? { ...request, status } : request));
    setMessage(`Request ${status.toLowerCase()}.`);
  };

  // Balances are computed live from approved requests, so approving or
  // rejecting a request immediately changes what these totals show —
  // there is no separate counter to keep in sync.
  const approvedDays = (leaveType: LeaveType) => employeeRequests
    .filter((request) => request.type === "leave" && request.leaveType === leaveType && request.status === "Approved")
    .reduce((sum, request) => sum + diffDaysInclusive(request.startDate!, request.endDate!), 0);

  const approvedPermissionHours = employeeRequests
    .filter((request) => request.type === "permission" && request.status === "Approved")
    .reduce((sum, request) => sum + diffHours(request.startTime!, request.endTime!), 0);

  const clRemaining = Math.max(CL_GRANTED - approvedDays("CL"), 0);
  const slRemaining = Math.max(SL_GRANTED - approvedDays("SL"), 0);
  const permissionRemaining = Math.max(Math.round((PERMISSION_GRANTED_HOURS - approvedPermissionHours) * 10) / 10, 0);

  return (
    <Box sx={{ maxWidth: 1240, mx: "auto", width: "100%", px: { xs: 2, md: 4 }, py: 4 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography sx={{ color: GREEN, fontFamily: FONT, fontSize: { xs: 28, md: 36 }, fontWeight: 800 }}>Leaves and Permissions</Typography>
          <Typography sx={{ color: "#66756A", fontFamily: FONT, mt: 0.5 }}>{isHr ? "Review employee leave and permission requests." : "Request time away and track your approvals."}</Typography>
        </Box>
        {!isHr && (
          <Chip label="Employee self-service" sx={{ alignSelf: { xs: "flex-start", sm: "center" }, backgroundColor: GREEN_PALE, color: GREEN, fontFamily: FONT, fontWeight: 600 }} />
        )}
      </Stack>

      {message && <Alert severity="success" onClose={() => setMessage("")} sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}

      {!isHr && <>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
          <SimpleBalanceCard label="Casual Leave (CL)" value={clRemaining} unit="days left" icon={<EventAvailableOutlinedIcon />} />
          <SimpleBalanceCard label="Sick Leave (SL)" value={slRemaining} unit="days left" icon={<AccessTimeOutlinedIcon />} />
          <SimpleBalanceCard label="Permissions" value={permissionRemaining} unit="hrs left" icon={<FactCheckOutlinedIcon />} />
          <ApplyCard
            expanded={showApplyOptions}
            onToggle={() => setShowApplyOptions((current) => !current)}
            onPick={(type, leaveType) => openForm(type, leaveType)}
          />
        </Box>

        {requestType && (
          <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 2, mb: 3, p: { xs: 2, md: 3 } }}>
            <Typography sx={{ color: GREEN, fontFamily: FONT, fontSize: 20, fontWeight: 700, mb: 2 }}>{editingId ? "Edit request" : requestType === "permission" ? "Permission request" : "Leave request"}</Typography>

            {requestType === "permission" ? (
              <Stack spacing={2.5}>
                <FieldRow label="Date">
                  <TextField fullWidth size="small" type="date" value={form.date} onChange={(event) => updateField("date", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                </FieldRow>
                <FieldRow label="Start time">
                  <TextField fullWidth size="small" type="time" value={form.startTime} onChange={(event) => updateField("startTime", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                </FieldRow>
                <FieldRow label="End time">
                  <TextField fullWidth size="small" type="time" value={form.endTime} onChange={(event) => updateField("endTime", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                </FieldRow>
                <FieldRow label="Reason">
                  <TextField fullWidth size="small" value={form.reason} onChange={(event) => updateField("reason", event.target.value)} />
                </FieldRow>
              </Stack>
            ) : (
              <Stack spacing={2.5}>
                <FieldRow label="Leave type">
                  <FormControl fullWidth size="small">
                    <Select value={form.leaveType} onChange={(event) => updateField("leaveType", event.target.value)}>
                      <MenuItem value="CL">Casual Leave (CL)</MenuItem>
                      <MenuItem value="SL">Sick Leave (SL)</MenuItem>
                    </Select>
                  </FormControl>
                </FieldRow>
                <FieldRow label="Start date">
                  <TextField fullWidth size="small" type="date" value={form.startDate} onChange={(event) => updateField("startDate", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                </FieldRow>
                <FieldRow label="End date">
                  <TextField fullWidth size="small" type="date" value={form.endDate} onChange={(event) => updateField("endDate", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                </FieldRow>
                <FieldRow label="Reason">
                  <TextField fullWidth size="small" value={form.reason} onChange={(event) => updateField("reason", event.target.value)} />
                </FieldRow>
              </Stack>
            )}

            <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", mt: 3 }}>
              <Button variant="outlined" onClick={resetForm} sx={{ color: GREEN, borderColor: "#bbe6c8", fontWeight: 700 }}>Cancel</Button>
              <Button variant="contained" onClick={submitRequest} sx={buttonSx(true)}>{editingId ? "Update request" : requestType === "permission" ? "Get permission" : "Get leave"}</Button>
            </Stack>
          </Paper>
        )}

        <RequestTable requests={employeeRequests} onEdit={editRequest} onDelete={deleteRequest} />
      </>}

      {isHr && <AdminLeaveDashboard requests={requests} pendingCount={pendingRequests.length} onStatusChange={updateStatus} />}
    </Box>
  );
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 1.5 }} sx={{ alignItems: { sm: "center" } }}>
      <Typography sx={{ width: { sm: LABEL_WIDTH }, flexShrink: 0, fontWeight: 700, color: "#000000", fontFamily: FONT, fontSize: { xs: 14, sm: 16 } }}>{label}</Typography>
      {children}
    </Stack>
  );
}

function SimpleBalanceCard({ label, value, unit, icon }: { label: string; value: number; unit: string; icon: ReactNode }) {
  return (
    <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 2, p: 2.5 }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography sx={{ color: "#66756A", fontFamily: FONT, fontSize: 14 }}>{label}</Typography>
          <Typography sx={{ color: GREEN, fontFamily: FONT, fontSize: 32, fontWeight: 800, lineHeight: 1.2 }}>{value}</Typography>
          <Typography sx={{ color: "#8A978D", fontFamily: FONT, fontSize: 12 }}>{unit}</Typography>
        </Box>
        <Box sx={{ alignItems: "center", backgroundColor: GREEN_PALE, borderRadius: "50%", color: GREEN_MID, display: "flex", height: 44, justifyContent: "center", width: 44, flexShrink: 0 }}>{icon}</Box>
      </Stack>
    </Paper>
  );
}

function ApplyCard({ expanded, onToggle, onPick }: { expanded: boolean; onToggle: () => void; onPick: (type: RequestType, leaveType?: LeaveType) => void }) {
  return (
    <Paper elevation={0} sx={{ border: `1px dashed ${GREEN}`, borderRadius: 2, p: 2.5, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 1.5 }}>
      {!expanded ? (
        <Button
          onClick={onToggle}
          startIcon={<AddCircleOutlineIcon />}
          sx={{ color: GREEN, fontFamily: FONT, fontWeight: 700, textTransform: "none", fontSize: 16 }}
        >
          Apply
        </Button>
      ) : (
        <Stack spacing={1} sx={{ width: "100%" }}>
          <Typography sx={{ color: GREEN, fontFamily: FONT, fontSize: 13, fontWeight: 700, mb: 0.5 }}>What do you need?</Typography>
          <Button fullWidth size="small" variant="outlined" onClick={() => onPick("leave", "CL")} sx={{ color: GREEN, borderColor: "#bbe6c8", fontWeight: 700, justifyContent: "flex-start" }}>Casual Leave (CL)</Button>
          <Button fullWidth size="small" variant="outlined" onClick={() => onPick("leave", "SL")} sx={{ color: GREEN, borderColor: "#bbe6c8", fontWeight: 700, justifyContent: "flex-start" }}>Sick Leave (SL)</Button>
          <Button fullWidth size="small" variant="outlined" onClick={() => onPick("permission")} sx={{ color: GREEN, borderColor: "#bbe6c8", fontWeight: 700, justifyContent: "flex-start" }}>Permission</Button>
        </Stack>
      )}
    </Paper>
  );
}

function RequestTable({ requests, onEdit, onDelete }: { requests: LeaveRequest[]; onEdit: (request: LeaveRequest) => void; onDelete: (id: string) => void }) {
  const rows = requests.map((request) => <RequestRow key={request.id} request={request} actions={request.status === "Pending" ? <><IconButton aria-label="Edit request" onClick={() => onEdit(request)}><EditOutlinedIcon /></IconButton><IconButton aria-label="Delete request" onClick={() => onDelete(request.id)}><DeleteOutlineIcon /></IconButton></> : undefined} />);
  return (
    <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 2, overflow: "hidden" }}>
      <Box sx={{ backgroundColor: GREEN_PALE, px: 2.5, py: 1.75 }}>
        <Typography sx={{ color: GREEN, fontFamily: FONT, fontSize: 18, fontWeight: 700 }}>My requests</Typography>
      </Box>
      {rows.length ? (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead><TableRow><TableCell>Employee</TableCell><TableCell>Type</TableCell><TableCell>Date / time</TableCell><TableCell>Reason</TableCell><TableCell>Status</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead>
            <TableBody>{rows}</TableBody>
          </Table>
        </Box>
      ) : (
        <Box sx={{ alignItems: "center", display: "flex", minHeight: 150, justifyContent: "center", px: 2, textAlign: "center" }}>
          <Typography sx={{ color: "#66756A", fontFamily: FONT }}>You have not submitted any requests yet.</Typography>
        </Box>
      )}
    </Paper>
  );
}

function RequestRow({ request, actions }: { request: LeaveRequest; actions?: ReactNode }) {
  const details = request.type === "permission" ? `${formatDate(request.date)} ${request.startTime}-${request.endTime}` : `${formatDate(request.startDate)} - ${formatDate(request.endDate)}`;
  return <TableRow><TableCell sx={{ fontFamily: FONT, fontWeight: 600 }}>{request.employeeName}</TableCell><TableCell sx={{ fontFamily: FONT }}>{request.type === "permission" ? "Permission" : request.leaveType}</TableCell><TableCell sx={{ fontFamily: FONT, whiteSpace: "nowrap" }}>{details}</TableCell><TableCell sx={{ fontFamily: FONT, minWidth: 180 }}>{request.reason}</TableCell><TableCell><StatusChip status={request.status} /></TableCell><TableCell align="right" sx={{ whiteSpace: "nowrap" }}>{actions}</TableCell></TableRow>;
}

function StatusChip({ status }: { status: RequestStatus }) {
  const palette = status === "Pending"
    ? { bg: AMBER_PALE, color: AMBER }
    : status === "Approved"
      ? { bg: GREEN_PALE, color: GREEN }
      : { bg: RED_PALE, color: RED };
  return <Chip label={status} size="small" sx={{ backgroundColor: palette.bg, color: palette.color, fontWeight: 600 }} />;
}

// --- Admin / HR dashboard -------------------------------------------------

function AdminLeaveDashboard({ requests, pendingCount, onStatusChange }: { requests: LeaveRequest[]; pendingCount: number; onStatusChange: (id: string, status: RequestStatus) => void }) {
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const totalCount = requests.length;
  const approvedCount = requests.filter((request) => request.status === "Approved").length;
  const rejectedCount = requests.filter((request) => request.status === "Rejected").length;

  const employeeOptions = Array.from(
    new Map(requests.map((request) => [request.employeeId, request.employeeName])).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const filteredRequests = requests
    .filter((request) => {
      if (filterEmployee !== "all" && request.employeeId !== filterEmployee) return false;
      const primaryDate = request.type === "leave" ? request.startDate : request.date;
      if (filterFrom && primaryDate && primaryDate < filterFrom) return false;
      if (filterTo && primaryDate && primaryDate > filterTo) return false;
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const resetFilters = () => {
    setFilterEmployee("all");
    setFilterFrom("");
    setFilterTo("");
  };

  return (
    <>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
        <StatCard label="Total Requests" value={totalCount} icon={<AssignmentOutlinedIcon />} color={GREEN} bg={GREEN_PALE} />
        <StatCard label="Approved" value={approvedCount} icon={<ThumbUpOutlinedIcon />} color={GREEN} bg={GREEN_PALE} />
        <StatCard label="Pending" value={pendingCount} icon={<PendingActionsOutlinedIcon />} color={AMBER} bg={AMBER_PALE} />
        <StatCard label="Rejected" value={rejectedCount} icon={<HighlightOffOutlinedIcon />} color={RED} bg={RED_PALE} />
      </Box>

      <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 2, mb: 3, p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "flex-end" } }}>
          <FilterField label="From">
            <TextField fullWidth size="small" type="date" value={filterFrom} onChange={(event) => setFilterFrom(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          </FilterField>
          <FilterField label="To">
            <TextField fullWidth size="small" type="date" value={filterTo} onChange={(event) => setFilterTo(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          </FilterField>
          <FilterField label="Employee">
            <FormControl fullWidth size="small">
              <Select value={filterEmployee} onChange={(event) => setFilterEmployee(event.target.value)}>
                <MenuItem value="all">All employees</MenuItem>
                {employeeOptions.map(([id, name]) => <MenuItem key={id} value={id}>{name}</MenuItem>)}
              </Select>
            </FormControl>
          </FilterField>
          <Button variant="outlined" onClick={resetFilters} sx={{ color: GREEN, borderColor: "#bbe6c8", fontWeight: 700, whiteSpace: "nowrap" }}>Reset filters</Button>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 2, overflow: "hidden" }}>
        <Box sx={{ backgroundColor: GREEN_PALE, px: 2.5, py: 1.75 }}>
          <Typography sx={{ color: GREEN, fontFamily: FONT, fontSize: 18, fontWeight: 700 }}>Leave Requests List</Typography>
        </Box>
        {filteredRequests.length ? (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Emp Code</TableCell>
                  <TableCell>Employee Name</TableCell>
                  <TableCell>Leave Type</TableCell>
                  <TableCell>Request Date</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.map((request) => <AdminRequestRow key={request.id} request={request} onStatusChange={onStatusChange} />)}
              </TableBody>
            </Table>
          </Box>
        ) : (
          <Box sx={{ alignItems: "center", display: "flex", minHeight: 150, justifyContent: "center", px: 2, textAlign: "center" }}>
            <Typography sx={{ color: "#66756A", fontFamily: FONT }}>No leave or permission requests match these filters.</Typography>
          </Box>
        )}
      </Paper>
    </>
  );
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ color: "#66756A", fontFamily: FONT, fontSize: 13, fontWeight: 600, mb: 0.5 }}>{label}</Typography>
      {children}
    </Box>
  );
}

function StatCard({ label, value, icon, color, bg }: { label: string; value: number; icon: ReactNode; color: string; bg: string }) {
  return (
    <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 2, p: 2.5 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Box sx={{ alignItems: "center", backgroundColor: bg, borderRadius: "50%", color, display: "flex", height: 40, justifyContent: "center", width: 40, flexShrink: 0 }}>{icon}</Box>
        <Box>
          <Typography sx={{ color, fontFamily: FONT, fontSize: 26, fontWeight: 800, lineHeight: 1.1 }}>{value}</Typography>
          <Typography sx={{ color: "#66756A", fontFamily: FONT, fontSize: 13 }}>{label}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function AdminRequestRow({ request, onStatusChange }: { request: LeaveRequest; onStatusChange: (id: string, status: RequestStatus) => void }) {
  const leaveTypeLabel = request.type === "permission"
    ? "Permission"
    : request.leaveType === "CL" ? "Casual Leave" : "Sick Leave";

  const fromDate = request.type === "leave" ? request.startDate : request.date;
  const toDate = request.type === "leave" ? request.endDate : request.date;

  const duration = request.type === "leave"
    ? `${diffDaysInclusive(request.startDate!, request.endDate!)} day(s)`
    : `${request.startTime}\u2013${request.endTime} (${Math.round(diffHours(request.startTime!, request.endTime!) * 10) / 10}h)`;

  return (
    <TableRow hover>
      <TableCell sx={{ fontFamily: FONT, fontWeight: 700, color: GREEN }}>{request.employeeId}</TableCell>
      <TableCell sx={{ fontFamily: FONT }}>{request.employeeName}</TableCell>
      <TableCell sx={{ fontFamily: FONT }}>{leaveTypeLabel}</TableCell>
      <TableCell sx={{ fontFamily: FONT, whiteSpace: "nowrap" }}>{formatDate(request.createdAt.slice(0, 10))}</TableCell>
      <TableCell sx={{ fontFamily: FONT, whiteSpace: "nowrap" }}>{formatDate(fromDate)}</TableCell>
      <TableCell sx={{ fontFamily: FONT, whiteSpace: "nowrap" }}>{formatDate(toDate)}</TableCell>
      <TableCell sx={{ fontFamily: FONT, whiteSpace: "nowrap" }}>{duration}</TableCell>
      <TableCell><StatusChip status={request.status} /></TableCell>
      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
        {request.status === "Pending" ? (
          <>
            <IconButton aria-label="Approve request" sx={{ color: GREEN }} onClick={() => onStatusChange(request.id, "Approved")}><CheckCircleOutlineIcon /></IconButton>
            <IconButton aria-label="Reject request" sx={{ color: RED }} onClick={() => onStatusChange(request.id, "Rejected")}><CancelOutlinedIcon /></IconButton>
          </>
        ) : "\u2014"}
      </TableCell>
    </TableRow>
  );
}

const buttonSx = (contained: boolean) => ({ backgroundColor: contained ? GREEN : "transparent", borderColor: GREEN, color: contained ? "#FFFFFF" : GREEN, fontFamily: FONT, fontWeight: 700, "&:hover": { backgroundColor: contained ? GREEN_MID : GREEN_PALE } });

export default LeavesPermissions;