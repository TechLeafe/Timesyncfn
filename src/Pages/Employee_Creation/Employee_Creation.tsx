
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  FormControlLabel,
  IconButton,
  Paper,
  Radio,
  RadioGroup,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PeopleOutlineRoundedIcon from "@mui/icons-material/PeopleOutlineRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import api from "../../api/axiosInstance";
import "./Employee_Creation.css";

type UserType = 1 | 2 | 3;
type EmployeeStatus = "Active" | "Inactive";

interface Employee {
  _id?: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  status: EmployeeStatus;
  userType: UserType;
}

interface EmployeeApiRecord {
  _id?: string;
  employeeId: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  designation: string;
  status?: EmployeeStatus;
  userType?: UserType;
}

interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

interface EmployeeForm {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  designation: string;
  userType: UserType;
}

type FormErrors = Partial<Record<keyof EmployeeForm, string>>;
type Notice = {
  severity: "success" | "error";
  text: string;
};

const createEmptyForm = (): EmployeeForm => ({
  id: "",
  name: "",
  email: "",
  password: "",
  phone: "",
  designation: "",
  userType: 3,
});

const ROLE_LABELS: Record<UserType, string> = {
  1: "Admin",
  2: "HR",
  3: "Employee",
};

const toEmployee = (record: EmployeeApiRecord): Employee => ({
  _id: record._id,
  id: record.employeeId,
  name: record.name,
  email: record.email,
  phone: record.phone || "-",
  designation: record.designation,
  status: record.status ?? "Active",
  userType:
    record.userType === 1 || record.userType === 2
      ? record.userType
      : 3,
});

const extractApiData = <T,>(
  body: ApiEnvelope<T> | T,
  fallback: string
): T => {
  if (
    typeof body === "object" &&
    body !== null &&
    "success" in body &&
    body.success === false
  ) {
    throw new Error(body.message || fallback);
  }

  if (
    typeof body === "object" &&
    body !== null &&
    "data" in body &&
    body.data !== undefined
  ) {
    return body.data as T;
  }

  return body as T;
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
            error?: string;
          };
        };
      }
    ).response;

    if (response?.data?.message) return response.data.message;
    if (response?.data?.error) return response.data.error;
  }

  return error instanceof Error &&
    !error.message.startsWith("Request failed with status code")
    ? error.message
    : fallback;
};

const validateForm = (
  form: EmployeeForm,
  isEdit: boolean
): FormErrors => {
  const errors: FormErrors = {};

  if (!form.id.trim()) {
    errors.id = "Employee ID is required.";
  } else if (
    !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/.test(form.id.trim())
  ) {
    errors.id = "Use letters and numbers, e.g. EMP003.";
  }

  if (!form.name.trim()) {
    errors.name = "Employee name is required.";
  } else if (!/^[A-Za-z ]+$/.test(form.name.trim())) {
    errors.name = "Use alphabetical characters only.";
  }

  if (!form.email.trim()) {
    errors.email = "Email address is required.";
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
  ) {
    errors.email = "Enter a valid email address.";
  }

  if (!isEdit) {
    if (!form.password) {
      errors.password = "Password is required.";
    } else if (!/^\d{6}$/.test(form.password)) {
      errors.password = "Enter exactly 6 numbers.";
    }
  }

  if (!form.phone.trim()) {
    errors.phone = "Mobile number is required.";
  } else if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
    errors.phone = "Enter a valid 10-digit mobile number.";
  }

  if (!form.designation.trim()) {
    errors.designation = "Designation is required.";
  } else if (!/^[A-Za-z ]+$/.test(form.designation.trim())) {
    errors.designation = "Use alphabetical characters only.";
  }

  return errors;
};

function Employee_Creation() {
  const navigate = useNavigate();
  const location = useLocation();

  const normalizedPath =
    location.pathname.replace(/\/$/, "");

  const isCreate =
    normalizedPath === "/employee-creation/create";
  const isEdit =
    normalizedPath === "/employee-creation/edit";
  const drawerOpen = isCreate || isEdit;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState<EmployeeForm>(createEmptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const [selectedEmployee, setSelectedEmployee] =
    useState<Employee | null>(null);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] =
    useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [notice, setNotice] = useState<Notice | null>(null);

  /* ================= EMPLOYEE LIST ================= */

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const response = await api.get<
        ApiEnvelope<EmployeeApiRecord[]> | EmployeeApiRecord[]
      >("/employees/list");

      const records = extractApiData(
        response.data,
        "Unable to load employees."
      );

      if (!Array.isArray(records)) {
        throw new Error("Invalid employee list response.");
      }

      setEmployees(records.map(toEmployee));
    } catch (error) {
      setLoadError(
        getErrorMessage(error, "Unable to load employees.")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();

    return employees.filter((employee) =>
      [
        employee.id,
        employee.name,
        employee.email,
        employee.designation,
        ROLE_LABELS[employee.userType],
      ].some((value) => value.toLowerCase().includes(term))
    );
  }, [employees, search]);

  const activeCount = employees.filter(
    (employee) => employee.status === "Active"
  ).length;

  /* ================= DRAWER ================= */

  const openCreateDrawer = () => {
    setSelectedEmployee(null);
    setForm(createEmptyForm());
    setErrors({});
    setFormError("");
    navigate("/employee-creation/create");
  };

  const openEditDrawer = async (employee: Employee) => {
    setSelectedEmployee(employee);

    setForm({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      password: "",
      phone:
        employee.phone === "-"
          ? ""
          : employee.phone.replace(/^\+1/, ""),
      designation: employee.designation,
      userType: employee.userType,
    });

    setErrors({});
    setFormError("");
    navigate("/employee-creation/edit");

    try {
      const response = await api.get<
        ApiEnvelope<EmployeeApiRecord> | EmployeeApiRecord
      >(
        `/employees/view/${encodeURIComponent(employee.id)}`
      );

      const record = extractApiData(
        response.data,
        "Unable to load employee details."
      );

      setForm((current) => ({
        ...current,
        id: record.employeeId,
        name: record.name,
        email: record.email,
        phone:
          record.phone?.replace(/^\+1/, "") || "",
        designation: record.designation,
        userType:
          record.userType === 1 || record.userType === 2
            ? record.userType
            : 3,
      }));
    } catch (error) {
      setFormError(
        getErrorMessage(
          error,
          "Unable to load full employee details."
        )
      );
    }
  };

  const closeDrawer = () => {
    if (saving) return;

    setSelectedEmployee(null);
    setForm(createEmptyForm());
    setErrors({});
    setFormError("");
    navigate("/employee-creation");
  };

  const updateField = <K extends keyof EmployeeForm>(
    field: K,
    value: EmployeeForm[K]
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));

    setFormError("");
  };

  /* ================= SAVE ================= */

  const saveEmployee = async () => {
    if (saving) return;

    const validationErrors = validateForm(form, isEdit);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    if (isEdit && !selectedEmployee) {
      setFormError("No employee selected for editing.");
      return;
    }

    setSaving(true);
    setFormError("");

    const payload = {
      ...(isEdit && selectedEmployee?._id
        ? { _id: selectedEmployee._id }
        : {}),
      employeeId: form.id.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      userType: form.userType,
      phone: form.phone.trim(),
      designation: form.designation.trim(),
      ...(isCreate
        ? { password: form.password }
        : { password: form.password }),
      ...(isEdit
        ? { status: selectedEmployee?.status ?? "Active" }
        : {}),
    };

    try {
      const response = isEdit
        ? await api.post("/employees/update", payload)
        : await api.post("/employees/create", payload);

      extractApiData(
        response.data as ApiEnvelope<unknown>,
        isEdit
          ? "Unable to update employee."
          : "Unable to create employee."
      );

      setNotice({
        severity: "success",
        text: isEdit
          ? "Employee updated successfully."
          : "Employee created successfully.",
      });

      closeDrawerAfterSave();
      await loadEmployees();
    } catch (error) {
      setFormError(
        getErrorMessage(
          error,
          isEdit
            ? "Unable to update employee."
            : "Unable to create employee."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const closeDrawerAfterSave = () => {
    setSelectedEmployee(null);
    setForm(createEmptyForm());
    setErrors({});
    setFormError("");
    navigate("/employee-creation");
  };

  /* ================= DELETE ================= */

  const openDeleteDialog = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setDeleteError("");
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete || deleting) return;

    if (!employeeToDelete._id) {
      setDeleteError("This employee is missing its database ID and cannot be deleted.");
      return;
    }

    setDeleting(true);
    setDeleteError("");

    try {
      const response = await api.post<ApiEnvelope<unknown>>(
        "/employees/delete",
        { _id: employeeToDelete._id }
      );

      extractApiData(response.data, "Unable to delete employee.");

      setEmployees((current) =>
        current.filter(
          (employee) => employee._id !== employeeToDelete._id
        )
      );
      setDeleteOpen(false);
      setEmployeeToDelete(null);
      setNotice({
        severity: "success",
        text: "Employee deleted successfully.",
      });
    } catch (error) {
      setDeleteError(
        getErrorMessage(error, "Unable to delete employee.")
      );
    } finally {
      setDeleting(false);
    }
  };

  /* ================= PAGE ================= */

  return (
    <Box className="employee-creation-page">
      <Snackbar
        className="employee-creation-toast"
        open={Boolean(notice)}
        autoHideDuration={4500}
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

      <Box className="employee-creation-header">
        <Box className="employee-creation-heading">
          <Box className="employee-creation-heading-icon">
            <PeopleOutlineRoundedIcon />
          </Box>

          <Box>
            <Typography
              component="h2"
              className="employee-creation-title"
            >
              Employee Creation
            </Typography>

            <Typography className="employee-creation-subtitle">
              Manage employee profiles, roles, and workplace details.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          className="employee-creation-create-button"
          startIcon={<AddRoundedIcon />}
          onClick={openCreateDrawer}
          disabled={loading}
        >
          Create Employee
        </Button>
      </Box>

      <Box className="employee-creation-overview">
        <Box className="employee-creation-overview-icon">
          <PeopleOutlineRoundedIcon />
        </Box>

        <Box className="employee-creation-overview-content">
          <Typography className="employee-creation-overview-label">
            Total Employees
          </Typography>

          <Typography className="employee-creation-overview-value">
            {loading || loadError ? "—" : employees.length}
          </Typography>
        </Box>

        <Box className="employee-creation-overview-active">
          <span className="employee-creation-online-dot" />
          {loading || loadError
            ? "Status unavailable"
            : `${activeCount} Active`}
        </Box>
      </Box>

      {loadError && (
        <Alert
          severity="error"
          className="employee-creation-alert"
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshRoundedIcon />}
              onClick={() => void loadEmployees()}
            >
              Retry
            </Button>
          }
        >
          {loadError}
        </Alert>
      )}

      <Paper
        elevation={0}
        className="employee-creation-list-card"
      >
        <Box className="employee-creation-list-header">
          <Box>
            <Typography className="employee-creation-section-title">
              Employee Directory
            </Typography>

            <Typography className="employee-creation-section-subtitle">
              View and manage your registered employees
            </Typography>
          </Box>

          <Box className="employee-creation-search">
            <SearchRoundedIcon />
            <input
              type="search"
              placeholder="Search employees..."
              aria-label="Search employees"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </Box>
        </Box>

        {loading || loadError || filteredEmployees.length === 0 ? (
          <Box className="employee-creation-empty">
            {loading && (
              <CircularProgress
                size={25}
                sx={{ color: "#087b4d" }}
              />
            )}

            <Typography>
              {loading
                ? "Loading employees..."
                : loadError
                  ? "Employee information is unavailable."
                  : search
                    ? "No employees match your search."
                    : "No employees found. Create your first employee."}
            </Typography>
          </Box>
        ) : (
          <>
            {/* DESKTOP TABLE */}

            <TableContainer className="employee-creation-table-wrap">
              <Table
                size="small"
                className="employee-creation-table"
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Employee ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Designation</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id} hover>
                      <TableCell className="employee-creation-id">
                        {employee.id}
                      </TableCell>

                      <TableCell className="employee-creation-name">
                        {employee.name}
                      </TableCell>

                      <TableCell>
                        {employee.email}
                      </TableCell>

                      <TableCell>
                        {employee.phone}
                      </TableCell>

                      <TableCell>
                        {employee.designation}
                      </TableCell>

                      <TableCell>
                        {ROLE_LABELS[employee.userType]}
                      </TableCell>

                      <TableCell>
                        <EmployeeStatusChip
                          status={employee.status}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <EmployeeActions
                          employee={employee}
                          onEdit={() =>
                            void openEditDrawer(employee)
                          }
                          onDelete={() =>
                            openDeleteDialog(employee)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* MOBILE EMPLOYEE CARDS */}

            <Box className="employee-creation-mobile-list">
              {filteredEmployees.map((employee) => (
                <Paper
                  elevation={0}
                  key={employee.id}
                  className="employee-creation-mobile-card"
                >
                  <Box className="employee-creation-mobile-header">
                    <Box className="employee-creation-mobile-person">
                      <Box className="employee-creation-avatar">
                        {employee.name
                          .trim()
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")
                          .toUpperCase() || "E"}
                      </Box>

                      <Box>
                        <Typography className="employee-creation-mobile-name">
                          {employee.name}
                        </Typography>

                        <Typography className="employee-creation-mobile-id">
                          {employee.id}
                        </Typography>
                      </Box>
                    </Box>

                    <EmployeeStatusChip
                      status={employee.status}
                    />
                  </Box>

                  <Box className="employee-creation-mobile-fields">
                    {[
                      { label: "Email", value: employee.email },
                      { label: "Phone", value: employee.phone },
                      {
                        label: "Designation",
                        value: employee.designation,
                      },
                      {
                        label: "Role",
                        value: ROLE_LABELS[employee.userType],
                      },
                    ].map((item) => (
                      <Box
                        key={item.label}
                        className="employee-creation-mobile-field"
                      >
                        <Typography>{item.label}</Typography>
                        <strong>{item.value}</strong>
                      </Box>
                    ))}
                  </Box>

                  <Box className="employee-creation-mobile-actions">
                    <Button
                      variant="outlined"
                      startIcon={<EditOutlinedIcon />}
                      onClick={() =>
                        void openEditDrawer(employee)
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteOutlineRoundedIcon />}
                      onClick={() => openDeleteDialog(employee)}
                    >
                      Remove
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Box>
          </>
        )}
      </Paper>

      {/* CREATE / EDIT DRAWER */}

      <Drawer
        anchor="right"
        open={drawerOpen}
        className="employee-creation-drawer"
        onClose={(_event, reason) => {
          if (
            saving ||
            reason === "backdropClick" ||
            reason === "escapeKeyDown"
          ) {
            return;
          }

          closeDrawer();
        }}
      >
        <Box className="employee-creation-drawer-body">
          <Box className="employee-creation-drawer-header">
            <Box className="employee-creation-drawer-title-row">
              <Box className="employee-creation-drawer-icon">
                <PersonAddAltOutlinedIcon />
              </Box>

              <Box>
                <Typography className="employee-creation-drawer-title">
                  {isEdit
                    ? "Edit Employee"
                    : "Create Employee"}
                </Typography>

                <Typography className="employee-creation-drawer-subtitle">
                  {isEdit
                    ? "Update employee information."
                    : "Add a new employee to the organization."}
                </Typography>
              </Box>
            </Box>

            <IconButton
              aria-label="Close employee form"
              onClick={closeDrawer}
              disabled={saving}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Box>

          <Box className="employee-creation-drawer-content">
            {formError && (
              <Alert
                severity="error"
                onClose={() => setFormError("")}
              >
                {formError}
              </Alert>
            )}

            <Typography className="employee-creation-form-section">
              Basic Information
            </Typography>

            <Box className="employee-creation-form-grid">
              <TextField
                label="Employee ID"
                value={form.id}
                onChange={(event) =>
                  updateField("id", event.target.value)
                }
                error={Boolean(errors.id)}
                helperText={errors.id}
                required
                fullWidth
                size="small"
              />

              <TextField
                label="Full Name"
                value={form.name}
                onChange={(event) =>
                  updateField("name", event.target.value)
                }
                error={Boolean(errors.name)}
                helperText={errors.name}
                required
                fullWidth
                size="small"
              />

              <TextField
                label="Email Address"
                type="email"
                value={form.email}
                onChange={(event) =>
                  updateField("email", event.target.value)
                }
                error={Boolean(errors.email)}
                helperText={errors.email}
                required
                fullWidth
                size="small"
              />

              {isCreate && (
                <TextField
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    updateField(
                      "password",
                      event.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  error={Boolean(errors.password)}
                  helperText={
                    errors.password || "Enter exactly 6 digits"
                  }
                  slotProps={{
                    htmlInput: {
                      inputMode: "numeric",
                      maxLength: 6,
                    },
                  }}
                  required
                  fullWidth
                  size="small"
                />
              )}

              <TextField
                label="Mobile Number"
                value={form.phone}
                onChange={(event) =>
                  updateField(
                    "phone",
                    event.target.value.replace(/\D/g, "").slice(0, 10)
                  )
                }
                error={Boolean(errors.phone)}
                helperText={errors.phone}
                slotProps={{
                  htmlInput: {
                    inputMode: "numeric",
                    maxLength: 10,
                  },
                }}
                required
                fullWidth
                size="small"
              />

              <TextField
                label="Designation"
                value={form.designation}
                onChange={(event) =>
                  updateField("designation", event.target.value)
                }
                error={Boolean(errors.designation)}
                helperText={errors.designation}
                required
                fullWidth
                size="small"
              />
            </Box>

            <Typography className="employee-creation-form-section">
              Role & Permissions
            </Typography>

            <RadioGroup
              row
              className="employee-creation-role-options"
              value={String(form.userType)}
              onChange={(event) =>
                updateField(
                  "userType",
                  Number(event.target.value) as UserType
                )
              }
            >
              <FormControlLabel
                value="1"
                control={<Radio />}
                label="Admin"
              />
              <FormControlLabel
                value="2"
                control={<Radio />}
                label="HR"
              />
              <FormControlLabel
                value="3"
                control={<Radio />}
                label="Employee"
              />
            </RadioGroup>
          </Box>

          <Box className="employee-creation-drawer-actions">
            <Button
              variant="outlined"
              className="employee-creation-cancel"
              onClick={closeDrawer}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              className="employee-creation-save"
              onClick={() => void saveEmployee()}
              disabled={saving}
              startIcon={
                saving ? (
                  <CircularProgress size={16} color="inherit" />
                ) : undefined
              }
            >
              {saving
                ? "Saving..."
                : isEdit
                  ? "Update Employee"
                  : "Create Employee"}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* REMOVE CONFIRMATION */}

      <Dialog
        open={deleteOpen}
        onClose={() => {
          if (deleting) return;
          setDeleteOpen(false);
          setEmployeeToDelete(null);
          setDeleteError("");
        }}
        maxWidth="xs"
        fullWidth
        className="employee-creation-dialog"
      >
        <DialogTitle>
          Delete Employee?
        </DialogTitle>

        <DialogContent>
          <Typography>
            Remove <strong>{employeeToDelete?.name}</strong>{" "}
            permanently from the employee records? This action cannot be undone.
          </Typography>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            variant="outlined"
            disabled={deleting}
            onClick={() => {
              setDeleteOpen(false);
              setEmployeeToDelete(null);
              setDeleteError("");
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="error"
            disabled={deleting}
            startIcon={
              deleting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <DeleteOutlineRoundedIcon />
              )
            }
            onClick={confirmDelete}
          >
            {deleting ? "Deleting..." : "Delete Employee"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function EmployeeStatusChip({
  status,
}: {
  status: EmployeeStatus;
}) {
  return (
    <span
      className={`employee-creation-status employee-creation-status--${status.toLowerCase()}`}
    >
      <span />
      {status}
    </span>
  );
}

function EmployeeActions({
  employee,
  onEdit,
  onDelete,
}: {
  employee: Employee;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Box className="employee-creation-actions">
      <Tooltip title="Edit employee">
        <IconButton
          aria-label={`Edit ${employee.name}`}
          onClick={onEdit}
        >
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Remove from current view">
        <IconButton
          aria-label={`Remove ${employee.name}`}
          onClick={onDelete}
        >
          <DeleteOutlineRoundedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export default Employee_Creation;
