import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Chip,
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
  Typography,
} from "@mui/material";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import api from "../../../api/axiosInstance";
import "./AdminLeavesPermissions.css";

type RequestType = "permission" | "leave";
type LeaveType = "CL" | "SL" | "COMP_OFF" | "PERMISSION";
type RequestStatus = "Pending" | "Approved" | "Rejected" ;

interface LeaveApiData {
  _id: string;
  employeeId: {
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
  totalHours: number;
  reason: string;
  status: RequestStatus;
  rejectionReason: string | null;
  createdAt?: string;
}

interface LeaveListResponse {
  success: boolean;
  message: string;
  data: LeaveApiData[] | LeaveApiData;
}

const isLeaveRequest = (value: LeaveApiData) =>
  Boolean(
    value &&
      value._id &&
      value.user_id &&
      value.leaveType &&
      value.fromDate &&
      value.status,
  );

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
  totalDays: number;
  reason: string;
  status: RequestStatus;
  createdAt: string;

  // Optional employee leave balances.
  currentCasualLeave?: number;
  currentSickLeave?: number;
  currentPermission?: number;
}

const getBusinessYear = (date = new Date()) => {
  const year = date.getFullYear();
  return date.getMonth() >= 3
    ? `${year}-${year + 1}`
    : `${year - 1}-${year}`;
};

const getLeaveType = (value: string): LeaveType => {
  if (["SL", "COMP_OFF", "PERMISSION"].includes(value)) {
    return value as LeaveType;
  }

  return "CL";
};

const mapApiRequest = (item: LeaveApiData): LeaveRequest => {
  const leaveType = getLeaveType(item.leaveType);
  const isPermission = leaveType === "PERMISSION";

  return {
    id: item._id,
    type: isPermission ? "permission" : "leave",
    leaveType,
    employeeId: item.user_id,
    employeeName: item.employeeId.name,
    date: isPermission ? item.fromDate : undefined,
    startDate: isPermission ? undefined : item.fromDate,
    endDate: isPermission ? undefined : item.toDate ?? undefined,
    startTime: item.fromTime ?? undefined,
    endTime: item.toTime ?? undefined,
    totalDays: item.totalDays,
    reason: item.reason,
    status: item.status,
    createdAt: item.createdAt ?? item.fromDate,
  };
};

const formatDate = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-IN");
};

function AdminLeavesPermissions() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | RequestStatus>("All");

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const response = await api.post<LeaveListResponse>(
          "/leave-apply/list",
          {
            status: statusFilter === "All" ? "" : statusFilter,
            businessYear: getBusinessYear(),
          },
        );

        if (!response.data.success) {
          setMessage(response.data.message || "Failed to load leave requests.");
          return;
        }

        const apiData = Array.isArray(response.data.data)
          ? response.data.data
          : response.data.data
            ? [response.data.data]
            : [];

        if (!apiData.every(isLeaveRequest)) {
          setRequests([]);
          setMessage(
            "The leave request API returned leave policy data. Please configure /leave-apply/list to return employee leave requests.",
          );
          return;
        }

        setRequests(apiData.map(mapApiRequest));
      } catch (error) {
        console.error("Admin leave list API error:", error);

        const responseStatus =
          typeof error === "object" &&
          error !== null &&
          "response" in error
            ? (
                error as {
                  response?: { status?: number };
                }
              ).response?.status
            : undefined;

        if (responseStatus === 401) {
          navigate("/login", { replace: true });
          return;
        }

        const responseMessage =
          typeof error === "object" &&
          error !== null &&
          "response" in error
            ? (
                error as {
                  response?: { data?: { message?: string } };
                }
              ).response?.data?.message
            : undefined;

        setMessage(
          responseMessage || "Failed to load leave requests.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [navigate, statusFilter]);

  const pendingRequests = requests.filter(
    (request) => request.status === "Pending",
  );

  const totalCount = requests.length;
  const approvedCount = requests.filter(
    (request) => request.status === "Approved",
  ).length;
  const rejectedCount = requests.filter(
    (request) => request.status === "Rejected",
  ).length;

  const sortedRequests = [...requests]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

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

      <Paper elevation={0} className="admin-leaves-permissions__request-panel">
        <Box
          className="admin-leaves-permissions__request-heading"
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Typography className="admin-leaves-permissions__request-title">
            Leave Requests List
          </Typography>
          <Select
            size="small"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "All" | RequestStatus)
            }
            className="admin-leaves-permissions__status-filter"
            MenuProps={{
              classes: {
                paper: "admin-leaves-permissions__status-menu",
              },
            }}
            sx={{ minWidth: 160}}
            aria-label="Filter leave requests by status"
          >
            <MenuItem value="All">All status</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Approved">Approved</MenuItem>
            <MenuItem value="Rejected">Rejected</MenuItem>
          </Select>
        </Box>

        {loading ? (
          <Box className="admin-leaves-permissions__empty-state">
            <Typography className="admin-leaves-permissions__empty-text">
              Loading leave requests...
            </Typography>
          </Box>
        ) : sortedRequests.length ? (
          <Box className="admin-leaves-permissions__table-wrapper">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
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
                {sortedRequests.map((request) => (
                  <AdminRequestRow
                    key={request.id}
                    request={request}
                    onView={() =>
                      navigate(
                        `/admin-leaves-permissions/employee-Details/${request.id}`,
                        { state: { request } },
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
              No leave or permission requests match this status.
            </Typography>
          </Box>
        )}
      </Paper>
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
  const leaveTypeLabel = request.leaveType ?? "-";

  const fromDate =
    request.type === "leave" ? request.startDate : request.date;
  const toDate = request.type === "leave" ? request.endDate : request.date;

  const duration = `${request.totalDays} day(s)`;

  return (
    <TableRow hover>
      <TableCell
        className="admin-leaves-permissions__employee-id"
      >
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
