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

interface EmployeeSummary {
  employeeId: string;
  employeeName: string;
  clApproved: number;
  slApproved: number;
  permissionsApproved: number;
  pendingCount: number;
}

const STORAGE_KEY = "timesync-leave-requests";
const GREEN = "#1B6B33";
const GREEN_MID = "#2E7D32";
const GREEN_PALE = "#E8F5E9";
const BORDER = "#DDE9DF";
const RED = "#B42318";
const FONT = "var(--font-family)";
const LABEL_WIDTH = 125;
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
    return saved ? JSON.parse(saved) as LeaveRequest[] : [];
  } catch {
    return [];
  }
};

const formatDate = (value?: string) => value
  ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN")
  : "-";

// Builds a per-employee summary of leaves/permissions already approved, plus
// how many requests from them are still pending review. Derived entirely
// from the requests already on file — not a separate data source.
const buildEmployeeSummaries = (requests: LeaveRequest[]): EmployeeSummary[] => {
  const byEmployee = new Map<string, EmployeeSummary>();

  requests.forEach((request) => {
    const existing = byEmployee.get(request.employeeId) ?? {
      employeeId: request.employeeId,
      employeeName: request.employeeName,
      clApproved: 0,
      slApproved: 0,
      permissionsApproved: 0,
      pendingCount: 0,
    };

    if (request.status === "Approved") {
      if (request.type === "leave" && request.leaveType === "CL") existing.clApproved += 1;
      if (request.type === "leave" && request.leaveType === "SL") existing.slApproved += 1;
      if (request.type === "permission") existing.permissionsApproved += 1;
    }
    if (request.status === "Pending") existing.pendingCount += 1;

    byEmployee.set(request.employeeId, existing);
  });

  return Array.from(byEmployee.values()).sort((a, b) => a.employeeName.localeCompare(b.employeeName));
};

function LeavesPermissions() {
  const { currentUser } = useCurrentUser();
  const isHr = currentUser.role === "HR Manager" || currentUser.role === "Admin";
  const [requests, setRequests] = useState<LeaveRequest[]>(readRequests);
  const [requestType, setRequestType] = useState<RequestType | null>(null);
  const [form, setForm] = useState<RequestForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  }, [requests]);

  const employeeRequests = requests.filter((request) => request.employeeId === currentUser.id);
  const pendingRequests = requests.filter((request) => request.status === "Pending");
  const employeeSummaries = buildEmployeeSummaries(requests);

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

  const selectCard = (type: RequestType) => {
    if (editingId) return; // don't switch cards mid-edit
    setRequestType(type);
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

  // Balances (12 CL, 12 SL, 24 permission hours) are fixed display values only —
  // approving or rejecting a request does not deduct from them.
  const updateStatus = (id: string, status: RequestStatus) => {
    setRequests((current) => current.map((request) => request.id === id ? { ...request, status } : request));
    setMessage(`Request ${status.toLowerCase()}.`);
  };

  return (
    <Box sx={{ maxWidth: 1240, mx: "auto", width: "100%", px: { xs: 2, md: 4 }, py: 4 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography sx={{ color: GREEN, fontFamily: FONT, fontSize: { xs: 28, md: 36 }, fontWeight: 800 }}>Leaves and Permissions</Typography>
          <Typography sx={{ color: "#66756A", fontFamily: FONT, mt: 0.5 }}>{isHr ? "Review employee leave and permission requests." : "Request time away and track your approvals."}</Typography>
        </Box>
        <Chip label={isHr ? `${pendingRequests.length} pending request${pendingRequests.length === 1 ? "" : "s"}` : "Employee self-service"} sx={{ alignSelf: { xs: "flex-start", sm: "center" }, backgroundColor: GREEN_PALE, color: GREEN, fontFamily: FONT, fontWeight: 600 }} />
      </Stack>

      {!isHr && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2, mb: 3 }}>
          <BalanceCard label="Casual Leave (CL)" value="12" unit="Days available" icon={<EventAvailableOutlinedIcon />} />
          <BalanceCard label="Sick Leave (SL)" value="12" unit="Days available" icon={<AccessTimeOutlinedIcon />} />
          <BalanceCard label="Permissions" value="24" unit="Hours available today" icon={<FactCheckOutlinedIcon />} />
        </Box>
      )}

      {message && <Alert severity="success" onClose={() => setMessage("")} sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}

      {!isHr && <>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2, mb: 3 }}>
          <RequestTypeCard
            title="Get Permission"
            description="Step out during the day for a few hours."
            icon={<AccessTimeOutlinedIcon />}
            selected={requestType === "permission"}
            onClick={() => selectCard("permission")}
          />
          <RequestTypeCard
            title="Get Leave"
            description="Request one or more full days off."
            icon={<EventAvailableOutlinedIcon />}
            selected={requestType === "leave"}
            onClick={() => selectCard("leave")}
          />
        </Box>

        {requestType && (
          <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 2, mb: 3, p: { xs: 2, md: 3 } }}>
            <Typography sx={{ color: GREEN, fontFamily: FONT, fontSize: 20, fontWeight: 700, mb: 2 }}>{editingId ? "Edit request" : requestType === "permission" ? "Permission request" : "Leave request"}</Typography>

            {requestType === "permission" ? (
              <Stack spacing={2.5}>
                <FieldRow label="Date">
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={form.date}
                    onChange={(event) => updateField("date", event.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </FieldRow>
                <FieldRow label="Start time">
                  <TextField
                    fullWidth
                    size="small"
                    type="time"
                    value={form.startTime}
                    onChange={(event) => updateField("startTime", event.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </FieldRow>
                <FieldRow label="End time">
                  <TextField
                    fullWidth
                    size="small"
                    type="time"
                    value={form.endTime}
                    onChange={(event) => updateField("endTime", event.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
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
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={form.startDate}
                    onChange={(event) => updateField("startDate", event.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </FieldRow>
                <FieldRow label="End date">
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={form.endDate}
                    onChange={(event) => updateField("endDate", event.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
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

      {isHr && <>
        <EmployeeSummaryTable summaries={employeeSummaries} />
        <Box sx={{ mt: 3 }}>
          <HrRequestTable requests={pendingRequests} onStatusChange={updateStatus} />
        </Box>
      </>}
    </Box>
  );
}

function RequestTypeCard({ title, description, icon, selected, onClick }: { title: string; description: string; icon: ReactNode; selected: boolean; onClick: () => void }) {
  return (
    <Paper
      component="button"
      onClick={onClick}
      elevation={0}
      sx={{
        alignItems: "flex-start",
        backgroundColor: selected ? GREEN_PALE : "#FFFFFF",
        border: `2px solid ${selected ? GREEN : BORDER}`,
        borderRadius: 2,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        fontFamily: FONT,
        gap: 1,
        p: 2.5,
        textAlign: "left",
        transition: "border-color 0.15s ease, background-color 0.15s ease",
        "&:hover": { borderColor: GREEN },
      }}
    >
      <Box sx={{ alignItems: "center", backgroundColor: selected ? "#FFFFFF" : GREEN_PALE, borderRadius: "50%", color: GREEN_MID, display: "flex", height: 40, justifyContent: "center", width: 40 }}>{icon}</Box>
      <Typography sx={{ color: GREEN, fontFamily: FONT, fontSize: 18, fontWeight: 700 }}>{title}</Typography>
      <Typography sx={{ color: "#66756A", fontFamily: FONT, fontSize: 14 }}>{description}</Typography>
    </Paper>
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

function BalanceCard({ label, value, unit, icon }: { label: string; value: string; unit: string; icon: ReactNode }) {
  return <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 2, p: 2.5 }}><Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}><Box><Typography sx={{ color: "#66756A", fontFamily: FONT, fontSize: 14 }}>{label}</Typography><Typography sx={{ color: GREEN, fontFamily: FONT, fontSize: 32, fontWeight: 800, lineHeight: 1.2 }}>{value}</Typography><Typography sx={{ color: "#8A978D", fontFamily: FONT, fontSize: 12 }}>{unit}</Typography></Box><Box sx={{ alignItems: "center", backgroundColor: GREEN_PALE, borderRadius: "50%", color: GREEN_MID, display: "flex", height: 44, justifyContent: "center", width: 44 }}>{icon}</Box></Stack></Paper>;
}

function EmployeeSummaryTable({ summaries }: { summaries: EmployeeSummary[] }) {
  return (
    <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 2, overflow: "hidden" }}>
      <Box sx={{ backgroundColor: GREEN_PALE, px: 2.5, py: 1.75 }}>
        <Typography sx={{ color: GREEN, fontFamily: FONT, fontSize: 18, fontWeight: 700 }}>Employee leave summary</Typography>
      </Box>
      {summaries.length ? (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell align="right">CL taken</TableCell>
                <TableCell align="right">SL taken</TableCell>
                <TableCell align="right">Permissions taken</TableCell>
                <TableCell align="right">Pending requests</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summaries.map((summary) => (
                <TableRow key={summary.employeeId}>
                  <TableCell sx={{ fontFamily: FONT, fontWeight: 600 }}>{summary.employeeName}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: FONT }}>{summary.clApproved}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: FONT }}>{summary.slApproved}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: FONT }}>{summary.permissionsApproved}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: FONT }}>
                    {summary.pendingCount > 0
                      ? <Chip label={summary.pendingCount} size="small" sx={{ backgroundColor: "#FFF7E6", color: "#9A6700", fontWeight: 700 }} />
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      ) : (
        <Box sx={{ alignItems: "center", display: "flex", minHeight: 120, justifyContent: "center", px: 2, textAlign: "center" }}>
          <Typography sx={{ color: "#66756A", fontFamily: FONT }}>No employee requests on file yet.</Typography>
        </Box>
      )}
    </Paper>
  );
}

function RequestTable({ requests, onEdit, onDelete }: { requests: LeaveRequest[]; onEdit: (request: LeaveRequest) => void; onDelete: (id: string) => void }) {
  return <RequestTableFrame title="My requests" empty="You have not submitted any requests yet.">{requests.map((request) => <RequestRow key={request.id} request={request} actions={request.status === "Pending" ? <><IconButton aria-label="Edit request" onClick={() => onEdit(request)}><EditOutlinedIcon /></IconButton><IconButton aria-label="Delete request" onClick={() => onDelete(request.id)}><DeleteOutlineIcon /></IconButton></> : undefined} />)}</RequestTableFrame>;
}

function HrRequestTable({ requests, onStatusChange }: { requests: LeaveRequest[]; onStatusChange: (id: string, status: RequestStatus) => void }) {
  return <RequestTableFrame title="Requests for HR review" empty="No pending leave or permission requests.">{requests.map((request) => <RequestRow key={request.id} request={request} actions={<><IconButton aria-label="Approve request" sx={{ color: GREEN }} onClick={() => onStatusChange(request.id, "Approved")}><CheckCircleOutlineIcon /></IconButton><IconButton aria-label="Reject request" sx={{ color: RED }} onClick={() => onStatusChange(request.id, "Rejected")}><CancelOutlinedIcon /></IconButton></>} />)}</RequestTableFrame>;
}

function RequestTableFrame({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  const rows = Array.isArray(children) ? children : children ? [children] : [];
  return <Paper elevation={0} sx={{ border: `1px solid ${BORDER}`, borderRadius: 2, overflow: "hidden" }}><Box sx={{ backgroundColor: GREEN_PALE, px: 2.5, py: 1.75 }}><Typography sx={{ color: GREEN, fontFamily: FONT, fontSize: 18, fontWeight: 700 }}>{title}</Typography></Box>{rows.length ? <Box sx={{ overflowX: "auto" }}><Table size="small"><TableHead><TableRow><TableCell>Employee</TableCell><TableCell>Type</TableCell><TableCell>Date / time</TableCell><TableCell>Reason</TableCell><TableCell>Status</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead><TableBody>{children}</TableBody></Table></Box> : <Box sx={{ alignItems: "center", display: "flex", minHeight: 150, justifyContent: "center", px: 2, textAlign: "center" }}><Typography sx={{ color: "#66756A", fontFamily: FONT }}>{empty}</Typography></Box>}</Paper>;
}

function RequestRow({ request, actions }: { request: LeaveRequest; actions?: ReactNode }) {
  const details = request.type === "permission" ? `${formatDate(request.date)} ${request.startTime}-${request.endTime}` : `${formatDate(request.startDate)} - ${formatDate(request.endDate)}`;
  return <TableRow><TableCell sx={{ fontFamily: FONT, fontWeight: 600 }}>{request.employeeName}</TableCell><TableCell sx={{ fontFamily: FONT }}>{request.type === "permission" ? "Permission" : request.leaveType}</TableCell><TableCell sx={{ fontFamily: FONT, whiteSpace: "nowrap" }}>{details}</TableCell><TableCell sx={{ fontFamily: FONT, minWidth: 180 }}>{request.reason}</TableCell><TableCell><Chip label={request.status} size="small" sx={{ backgroundColor: request.status === "Pending" ? "#FFF7E6" : request.status === "Approved" ? GREEN_PALE : "#FDECEC", color: request.status === "Pending" ? "#9A6700" : request.status === "Approved" ? GREEN : RED, fontWeight: 600 }} /></TableCell><TableCell align="right" sx={{ whiteSpace: "nowrap" }}>{actions}</TableCell></TableRow>;
}

const buttonSx = (contained: boolean) => ({ backgroundColor: contained ? GREEN : "transparent", borderColor: GREEN, color: contained ? "#FFFFFF" : GREEN, fontFamily: FONT, fontWeight: 700, "&:hover": { backgroundColor: contained ? GREEN_MID : GREEN_PALE } });

export default LeavesPermissions;