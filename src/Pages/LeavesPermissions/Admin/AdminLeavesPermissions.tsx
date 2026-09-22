import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
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
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import "./AdminLeavesPermissions.css";

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

  // Optional employee leave balances.
  currentCasualLeave?: number;
  currentSickLeave?: number;
  currentPermission?: number;
}

const STORAGE_KEY = "timesync-leave-requests";

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

function AdminLeavesPermissions() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<LeaveRequest[]>(readRequests);
  const [message, setMessage] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  }, [requests]);

  const pendingRequests = requests.filter(
    (request) => request.status === "Pending",
  );

  const updateStatus = (id: string, status: RequestStatus) => {
    setRequests((current) =>
      current.map((request) =>
        request.id === id ? { ...request, status } : request,
      ),
    );
    setMessage(`Request ${status.toLowerCase()}.`);
  };

  const totalCount = requests.length;
  const approvedCount = requests.filter(
    (request) => request.status === "Approved",
  ).length;
  const rejectedCount = requests.filter(
    (request) => request.status === "Rejected",
  ).length;

  const employeeOptions = Array.from(
    new Map(
      requests.map((request) => [request.employeeId, request.employeeName]),
    ).entries(),
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const filteredRequests = requests
    .filter((request) => {
      if (
        filterEmployee !== "all" &&
        request.employeeId !== filterEmployee
      ) {
        return false;
      }

      const primaryDate =
        request.type === "leave" ? request.startDate : request.date;

      if (filterFrom && primaryDate && primaryDate < filterFrom) {
        return false;
      }

      if (filterTo && primaryDate && primaryDate > filterTo) {
        return false;
      }

      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const resetFilters = () => {
    setFilterEmployee("all");
    setFilterFrom("");
    setFilterTo("");
  };

  return (
    <Box
      sx={{
        maxWidth: 1240,
        mx: "auto",
        width: "100%",
        px: { xs: 2, md: 4 },
        py: 4,
      }}
    >
      <Box className="admin-leaves-permissions__header">
        <Typography className="admin-leaves-permissions__title">
          Leaves and Permissions
        </Typography>
        <Typography className="admin-leaves-permissions__subtitle">
          Review employee leave and permission requests.
        </Typography>
      </Box>

      {message && (
        <Box className="admin-leaves-permissions__message">
          <Typography className="admin-leaves-permissions__message-text">
            {message}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard
          label="Total Requests"
          value={totalCount}
          icon={<AssignmentOutlinedIcon />}
        />
        <StatCard
          label="Approved"
          value={approvedCount}
          icon={<ThumbUpOutlinedIcon />}
        />
        <StatCard
          label="Pending"
          value={pendingRequests.length}
          icon={<PendingActionsOutlinedIcon />}
        />
        <StatCard
          label="Rejected"
          value={rejectedCount}
          icon={<HighlightOffOutlinedIcon />}
        />
      </Box>

      <Paper elevation={0} className="admin-leaves-permissions__filters">
        <Stack className="admin-leaves-permissions__filter-row">
          <FilterField label="From">
            <TextField
              fullWidth
              size="small"
              type="date"
              value={filterFrom}
              onChange={(event) => setFilterFrom(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </FilterField>

          <FilterField label="To">
            <TextField
              fullWidth
              size="small"
              type="date"
              value={filterTo}
              onChange={(event) => setFilterTo(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </FilterField>

          <FilterField label="Employee">
            <FormControl fullWidth size="small">
              <Select
                value={filterEmployee}
                onChange={(event) => setFilterEmployee(event.target.value)}
              >
                <MenuItem value="all">All employees</MenuItem>
                {employeeOptions.map(([id, name]) => (
                  <MenuItem key={id} value={id}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </FilterField>

          <Button
            variant="outlined"
            onClick={resetFilters}
            className="admin-leaves-permissions__reset-button"
          >
            Reset filters
          </Button>
        </Stack>
      </Paper>

      <Paper elevation={0} className="admin-leaves-permissions__request-panel">
        <Box className="admin-leaves-permissions__request-heading">
          <Typography className="admin-leaves-permissions__request-title">
            Leave Requests List
          </Typography>
        </Box>

        {filteredRequests.length ? (
          <Box className="admin-leaves-permissions__table-wrapper">
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
                {filteredRequests.map((request) => (
                  <AdminRequestRow
                    key={request.id}
                    request={request}
                    onView={() =>
                      navigate(
                        `employee-Details`,
                      )
                    }
                  />
                ))}
              </TableBody>
            </Table>
          </Box>
        ) : (
          <Box className="admin-leaves-permissions__empty-state">
            <Typography className="admin-leaves-permissions__empty-text">
              No leave or permission requests match these filters.
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}


function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Box className="admin-leaves-permissions__filter-field">
      <Typography className="admin-leaves-permissions__filter-label">
        {label}
      </Typography>
      {children}
    </Box>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <Paper elevation={0} className="admin-leaves-permissions__stat-card">
      <Stack direction="row" spacing={1.5} className="admin-leaves-permissions__stat-content">
        <Box className="admin-leaves-permissions__stat-icon">
          {icon}
        </Box>
        <Box>
          <Typography className="admin-leaves-permissions__stat-value">
            {value}
          </Typography>
          <Typography className="admin-leaves-permissions__stat-label">
            {label}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function StatusChip({ status }: { status: RequestStatus }) {
  return (
    <Chip
      label={status}
      size="small"
      className={`admin-leaves-permissions__status-chip admin-leaves-permissions__status-chip--${status.toLowerCase()}`}
    />
  );
}

function AdminRequestRow({
  request,
  onView,
}: {
  request: LeaveRequest;
  onView: () => void;
}) {
  const leaveTypeLabel =
    request.type === "permission"
      ? "Permission"
      : request.leaveType === "CL"
        ? "Casual Leave"
        : "Sick Leave";

  const fromDate =
    request.type === "leave" ? request.startDate : request.date;
  const toDate = request.type === "leave" ? request.endDate : request.date;

  const duration =
    request.type === "leave"
      ? `${diffDaysInclusive(request.startDate!, request.endDate!)} day(s)`
      : `${request.startTime}–${request.endTime} (${Math.round(diffHours(request.startTime!, request.endTime!) * 10) / 10}h)`;

  return (
    <TableRow hover>
      <TableCell
        className="admin-leaves-permissions__employee-id"
      >
        {request.employeeId}
      </TableCell>
      <TableCell className="admin-leaves-permissions__table-cell">
        {request.employeeName}
      </TableCell>
      <TableCell className="admin-leaves-permissions__table-cell">{leaveTypeLabel}</TableCell>
      <TableCell className="admin-leaves-permissions__table-cell admin-leaves-permissions__table-cell--nowrap">
        {formatDate(request.createdAt.slice(0, 10))}
      </TableCell>
      <TableCell className="admin-leaves-permissions__table-cell admin-leaves-permissions__table-cell--nowrap">
        {formatDate(fromDate)}
      </TableCell>
      <TableCell className="admin-leaves-permissions__table-cell admin-leaves-permissions__table-cell--nowrap">
        {formatDate(toDate)}
      </TableCell>
      <TableCell className="admin-leaves-permissions__table-cell admin-leaves-permissions__table-cell--nowrap">
        {duration}
      </TableCell>
      <TableCell>
        <StatusChip status={request.status} />
      </TableCell>
      <TableCell align="right" className="admin-leaves-permissions__actions-cell">
        <IconButton
          aria-label="View leave details"
          title="View leave details"
          className="admin-leaves-permissions__view-button"
          onClick={onView}
        >
          <VisibilityOutlinedIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}

export default AdminLeavesPermissions;
