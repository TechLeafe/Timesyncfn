
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert, Box, Button, Chip, CircularProgress, IconButton,
  Menu, MenuItem, Paper, Select, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";

import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";

import api from "../../../api/axiosInstance";
import { downloadExcelFile } from "../../../utils/excel";
import "./AdminLeavesPermissions.css";

type RequestStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";
type StatusFilter = "All" | RequestStatus;
type LeaveType = "CL" | "SL" | "COMP_OFF" | "PERMISSION";
type RequestFilterField = "employee" | "requestType" | "date";

interface RequestFilters {
  employee: string;
  requestType: LeaveType | "All";
  date: string;
}

interface LeaveApiData {
  _id: string;
  employeeId?: {
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

export interface AdminLeaveRequest {
  id: string;
  type: "leave" | "permission";
  leaveType: LeaveType;
  employeeId: string;
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
  rejectionReason: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<LeaveType, string> = {
  CL: "Casual Leave",
  SL: "Sick Leave",
  COMP_OFF: "Compensatory Off",
  PERMISSION: "Permission",
};

const getBusinessYear = (date = new Date()) => {
  const year = date.getFullYear();
  return date.getMonth() >= 3
    ? `${year}-${year + 1}`
    : `${year - 1}-${year}`;
};

const getLeaveType = (value: string): LeaveType => {
  if (value === "SL" || value === "COMP_OFF" || value === "PERMISSION") {
    return value;
  }
  return "CL";
};

const toDateOnly = (value?: string | null) => {
  if (!value) return "";
  const match = value.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : value;
};

const formatDate = (value?: string | null) => {
  const datePart = toDateOnly(value);
  if (!datePart) return "-";
  const date = new Date(datePart);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-IN", {
        timeZone: "UTC",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const getApiError = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as { response?: { data?: { message?: string } } }
    ).response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error ? error.message : fallback;
};

const mapApiRequest = (item: LeaveApiData): AdminLeaveRequest => {
  const leaveType = getLeaveType(item.leaveType);
  const isPermission = leaveType === "PERMISSION";

  return {
    id: item._id,
    type: isPermission ? "permission" : "leave",
    leaveType,
    employeeId: item.user_id,
    employeeName: item.employeeId?.name || item.user_id || "Employee",
    date: isPermission ? item.fromDate : undefined,
    startDate: isPermission ? undefined : item.fromDate,
    endDate: isPermission ? undefined : item.toDate ?? undefined,
    startTime: item.fromTime ?? undefined,
    endTime: item.toTime ?? undefined,
    totalDays: Number(item.totalDays) || 0,
    totalHours: Number(item.totalHours) || 0,
    reason: item.reason || "",
    status: item.status,
    rejectionReason: item.rejectionReason,
    createdAt: item.createdAt ?? item.fromDate,
  };
};

const getDuration = (request: AdminLeaveRequest) =>
  request.type === "permission"
    ? `${request.totalHours} hr`
    : `${request.totalDays} day${request.totalDays === 1 ? "" : "s"}`;

function AdminLeavesPermissions() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState<AdminLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [filterAnchor, setFilterAnchor] =
    useState<HTMLElement | null>(null);
  const [filterField, setFilterField] =
    useState<RequestFilterField>("employee");
  const [filterValue, setFilterValue] = useState("");
  const [appliedFilters, setAppliedFilters] =
    useState<RequestFilters>({
      employee: "",
      requestType: "All",
      date: "",
    });

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      // Always fetch the full year so statistics do not
      // change when the table's status filter changes.
      const response = await api.post<LeaveListResponse>(
        "/leave-apply/list",
        {
          status: "",
          businessYear: getBusinessYear(),
        }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to load leave requests."
        );
      }

      const responseData = response.data.data;
      const items = Array.isArray(responseData)
        ? responseData
        : responseData
          ? [responseData]
          : [];

      const isValid = items.every(
        (item) =>
          Boolean(item?._id) &&
          Boolean(item?.user_id) &&
          Boolean(item?.leaveType) &&
          Boolean(item?.fromDate) &&
          Boolean(item?.status)
      );

      if (!isValid) {
        throw new Error(
          "The API did not return valid employee leave requests."
        );
      }

      setRequests(items.map(mapApiRequest));
    } catch (error) {
      const status = (
        error as { response?: { status?: number } }
      )?.response?.status;

      if (status === 401) {
        navigate("/login", { replace: true });
        return;
      }

      setLoadError(
        getApiError(error, "Unable to load leave requests.")
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const stats = useMemo(
    () => ({
      total: requests.length,
      approved: requests.filter((r) => r.status === "Approved").length,
      pending: requests.filter((r) => r.status === "Pending").length,
      rejected: requests.filter((r) => r.status === "Rejected").length,
    }),
    [requests]
  );

  const filteredRequests = useMemo(() => {
    const employeeTerm = appliedFilters.employee.trim().toLowerCase();
    const filtered = requests.filter((request) => {
      if (statusFilter !== "All" && request.status !== statusFilter) {
        return false;
      }
      if (
        employeeTerm &&
        !request.employeeName.toLowerCase().includes(employeeTerm) &&
        !request.employeeId.toLowerCase().includes(employeeTerm)
      ) {
        return false;
      }
      if (
        appliedFilters.requestType !== "All" &&
        request.leaveType !== appliedFilters.requestType
      ) {
        return false;
      }
      if (appliedFilters.date) {
        const fromDate = toDateOnly(request.startDate ?? request.date);
        const endDate = toDateOnly(request.endDate ?? request.date ?? fromDate);
        const requestedOn = toDateOnly(request.createdAt);
        const matchesRequestPeriod =
          Boolean(fromDate) &&
          appliedFilters.date >= fromDate &&
          appliedFilters.date <= (endDate || fromDate);
        if (
          !matchesRequestPeriod &&
          requestedOn !== appliedFilters.date
        ) {
          return false;
        }
      }
      return true;
    });

    return [...filtered].sort((a, b) =>
      (b.createdAt || "").localeCompare(a.createdAt || "")
    );
  }, [appliedFilters, requests, statusFilter]);

  const applyRequestFilter = () => {
    setAppliedFilters((current) => {
      if (filterField === "employee") {
        return { ...current, employee: filterValue };
      }
      if (filterField === "date") {
        return { ...current, date: filterValue };
      }
      return {
        ...current,
        requestType: filterValue as LeaveType | "All",
      };
    });
    setFilterAnchor(null);
  };

  const clearRequestFilter = () => {
    setAppliedFilters((current) => ({
      ...current,
      [filterField]: filterField === "requestType" ? "All" : "",
    }));
    setFilterValue("");
    setFilterAnchor(null);
  };

  const downloadRequestsExcel = () => {
    const rows = [
      [
        "Employee",
        "Employee ID",
        "Request Type",
        "Requested On",
        "From",
        "To",
        "Duration",
        "Reason",
        "Status",
      ],
      ...filteredRequests.map((request) => [
        request.employeeName,
        request.employeeId,
        TYPE_LABELS[request.leaveType],
        formatDate(request.createdAt),
        formatDate(request.startDate ?? request.date),
        formatDate(request.endDate ?? request.date),
        getDuration(request),
        request.reason,
        request.status,
      ]),
    ];

    downloadExcelFile({
      rows,
      fileName: "employee-requests.xlsx",
      sheetName: "Employee Requests",
      columnWidths: [24, 18, 24, 18, 18, 18, 14, 36, 16],
    });
  };

  const viewRequest = (request: AdminLeaveRequest) => {
    navigate(
      `/admin-leaves-permissions/employee-Details/${request.id}`,
      { state: { request } }
    );
  };

  return (
    <Box className="admin-leaves-permissions">
      <Box className="admin-leaves-permissions__header">
        <Box className="admin-leaves-permissions__heading">
          <Box className="admin-leaves-permissions__heading-icon">
            <EventNoteOutlinedIcon />
          </Box>
          <Box>
            <Typography component="h2" className="admin-leaves-permissions__title">
              Leaves & Permissions
            </Typography>
            <Typography className="admin-leaves-permissions__subtitle">
              Review and manage employee leave and permission requests.
            </Typography>
          </Box>
        </Box>
      </Box>

      {loadError && (
        <Alert
          severity="error"
          className="admin-leaves-permissions__error"
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshRoundedIcon />}
              disabled={loading}
              onClick={() => void fetchRequests()}
            >
              Retry
            </Button>
          }
        >
          {loadError}
        </Alert>
      )}

      <Box className="admin-leaves-permissions__stats">
        <StatCard
          label="Total Requests"
          value={loading || loadError ? null : stats.total}
          icon={<AssignmentOutlinedIcon />}
          tone="green"
        />
        <StatCard
          label="Approved"
          value={loading || loadError ? null : stats.approved}
          icon={<ThumbUpOutlinedIcon />}
          tone="blue"
        />
        <StatCard
          label="Pending"
          value={loading || loadError ? null : stats.pending}
          icon={<PendingActionsOutlinedIcon />}
          tone="amber"
        />
        <StatCard
          label="Rejected"
          value={loading || loadError ? null : stats.rejected}
          icon={<HighlightOffOutlinedIcon />}
          tone="red"
        />
      </Box>

      <Paper elevation={0} className="admin-leaves-permissions__request-panel">
        <Box className="admin-leaves-permissions__request-heading">
          <Box>
            <Typography className="admin-leaves-permissions__request-title">
              Employee Requests
            </Typography>
            <Typography className="admin-leaves-permissions__request-subtitle">
              Select a request to review its details.
            </Typography>
          </Box>

          <Box className="admin-leaves-permissions__request-actions">
            <Button
              variant="outlined"
              className="admin-leaves-permissions__filter-button"
              startIcon={<FilterListRoundedIcon />}
              aria-haspopup="menu"
              aria-expanded={Boolean(filterAnchor)}
              onClick={(event) => {
                setFilterValue(
                  filterField === "employee"
                    ? appliedFilters.employee
                    : filterField === "date"
                      ? appliedFilters.date
                      : appliedFilters.requestType
                );
                setFilterAnchor(event.currentTarget);
              }}
            >
              Filter
            </Button>
            <Menu
              anchorEl={filterAnchor}
              open={Boolean(filterAnchor)}
              onClose={() => setFilterAnchor(null)}
              slotProps={{ paper: { sx: { minWidth: 250, p: 1 } } }}
            >
              <Typography
                variant="subtitle2"
                sx={{ px: 1.5, py: 1, fontWeight: 700 }}
              >
                Filter By
              </Typography>
              {([
                ["employee", "Employee"],
                ["requestType", "Request Type"],
                ["date", "Date"],
              ] as const).map(([field, label]) => (
                <MenuItem
                  key={field}
                  selected={filterField === field}
                  onClick={() => {
                    setFilterField(field);
                    setFilterValue(
                      field === "employee"
                        ? appliedFilters.employee
                        : field === "date"
                          ? appliedFilters.date
                          : appliedFilters.requestType
                    );
                  }}
                >
                  {label}
                </MenuItem>
              ))}
              <Box
                sx={{ p: 1.5, width: 270 }}
                onKeyDown={(event) => event.stopPropagation()}
              >
                {filterField === "requestType" ? (
                  <Select
                    fullWidth
                    size="small"
                    value={filterValue || "All"}
                    onChange={(event) => setFilterValue(event.target.value)}
                    aria-label="Filter by request type"
                  >
                    <MenuItem value="All">All Request Types</MenuItem>
                    {Object.entries(TYPE_LABELS).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                ) : (
                  <TextField
                    fullWidth
                    size="small"
                    type={filterField === "date" ? "date" : "text"}
                    label={filterField === "date" ? undefined : "Employee name or ID"}
                    value={filterValue}
                    onChange={(event) => setFilterValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") applyRequestFilter();
                    }}
                    slotProps={
                      filterField === "date"
                        ? { inputLabel: { shrink: true } }
                        : undefined
                    }
                  />
                )}
                <Box className="admin-leaves-permissions__filter-actions">
                  <Button
                    variant="outlined"
                    onClick={clearRequestFilter}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="contained"
                    onClick={applyRequestFilter}
                  >
                    Apply
                  </Button>
                </Box>
              </Box>
            </Menu>
            <Button
              variant="outlined"
              className="admin-leaves-permissions__excel-button"
              startIcon={<FileDownloadOutlinedIcon />}
              disabled={loading || Boolean(loadError)}
              onClick={downloadRequestsExcel}
            >
              Download 
            </Button>
            <Select
              size="small"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="admin-leaves-permissions__status-filter"
              aria-label="Filter requests by status"
              MenuProps={{
                classes: { paper: "admin-leaves-permissions__status-menu" },
              }}
            >
              <MenuItem value="All">All Statuses</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
            </Select>
          </Box>
        </Box>

        {!loading && !loadError && (
          <Typography className="admin-leaves-permissions__matching-count">
            {filteredRequests.length} matching request
            {filteredRequests.length === 1 ? "" : "s"}
          </Typography>
        )}

        {loading ? (
          <Box className="admin-leaves-permissions__empty-state">
            <CircularProgress size={25} sx={{ color: "#087b4d" }} />
            <Typography>Loading requests...</Typography>
          </Box>
        ) : loadError ? (
          <Box className="admin-leaves-permissions__empty-state">
            <Typography>Request information is unavailable.</Typography>
          </Box>
        ) : filteredRequests.length === 0 ? (
          <Box className="admin-leaves-permissions__empty-state">
            <AssignmentOutlinedIcon />
            <Typography>No requests match the selected filters.</Typography>
          </Box>
        ) : (
          <>
            <Box className="admin-leaves-permissions__card-list">
              {filteredRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onView={() => viewRequest(request)}
                />
              ))}
            </Box>

            <Box className="admin-leaves-permissions__table-wrapper">
              <Table size="small" className="admin-leaves-permissions__table">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Request Type</TableCell>
                    <TableCell>Requested On</TableCell>
                    <TableCell>From</TableCell>
                    <TableCell>To</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id} hover>
                      <TableCell className="admin-leaves-permissions__employee-id">
                        {request.employeeName}
                      </TableCell>
                      <TableCell>{TYPE_LABELS[request.leaveType]}</TableCell>
                      <TableCell>{formatDate(request.createdAt)}</TableCell>
                      <TableCell>
                        {formatDate(request.startDate ?? request.date)}
                      </TableCell>
                      <TableCell>
                        {formatDate(request.endDate ?? request.date)}
                      </TableCell>
                      <TableCell>{getDuration(request)}</TableCell>
                      <TableCell>
                        <StatusChip status={request.status} />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View request details">
                          <IconButton
                            className="admin-leaves-permissions__view-button"
                            aria-label={`View request from ${request.employeeName}`}
                            onClick={() => viewRequest(request)}
                          >
                            <VisibilityOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}

function StatCard({
  label, value, icon, tone,
}: {
  label: string;
  value: number | null;
  icon: ReactNode;
  tone: "green" | "blue" | "amber" | "red";
}) {
  return (
    <Paper
      elevation={0}
      className={`admin-leaves-permissions__stat-card admin-leaves-permissions__stat--${tone}`}
    >
      <Box className="admin-leaves-permissions__stat-content">
        <Box>
          <Typography className="admin-leaves-permissions__stat-label">
            {label}
          </Typography>
          <Typography className="admin-leaves-permissions__stat-value">
            {value ?? "—"}
          </Typography>
        </Box>
        <Box className="admin-leaves-permissions__stat-icon">{icon}</Box>
      </Box>
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

function RequestCard({
  request, onView,
}: {
  request: AdminLeaveRequest;
  onView: () => void;
}) {
  return (
    <Paper elevation={0} className="admin-leaves-permissions__request-card">
      <Box className="admin-leaves-permissions__request-card-header">
        <Box>
          <Typography className="admin-leaves-permissions__employee-id">
            {request.employeeName}
          </Typography>
          <Typography className="admin-leaves-permissions__request-card-type">
            {TYPE_LABELS[request.leaveType]}
          </Typography>
        </Box>
        <Box className="admin-leaves-permissions__request-card-actions">
          <StatusChip status={request.status} />
          <IconButton
            size="small"
            className="admin-leaves-permissions__view-button"
            aria-label="View request details"
            onClick={onView}
          >
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Box className="admin-leaves-permissions__request-card-grid">
        {[
          { label: "Requested", value: formatDate(request.createdAt) },
          { label: "From", value: formatDate(request.startDate ?? request.date) },
          { label: "To", value: formatDate(request.endDate ?? request.date) },
          { label: "Duration", value: getDuration(request) },
        ].map((item) => (
          <Box
            key={item.label}
            className="admin-leaves-permissions__request-card-field"
          >
            <Typography className="admin-leaves-permissions__request-card-label">
              {item.label}
            </Typography>
            <Typography className="admin-leaves-permissions__request-card-value">
              {item.value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

export default AdminLeavesPermissions;
