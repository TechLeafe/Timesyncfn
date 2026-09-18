import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
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
  Stack,
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
import api from "../../api/axiosInstance";
import "./Employee_Creation.css";

const PRIMARY_GREEN = "#35753B";
const formFieldSx = {
  "& .MuiOutlinedInput-root.Mui-focused fieldset": { borderColor: PRIMARY_GREEN },
  "& .MuiInputLabel-root.Mui-focused": { color: PRIMARY_GREEN },
};

type UserType = 1 | 2 | 3;

type Employee = {
  _id?: string;
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  designation: string;
  status: "Active" | "Inactive";
  userType?: UserType;
};

type EmployeeApiRecord = {
  _id?: string;
  employeeId: string;
  name: string;
  email: string;
  password?: string;
  userType?: UserType;
  phone?: string;
  designation: string;
  status?: "Active" | "Inactive";
};

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

const initialEmployees: Employee[] = [];

const toEmployee = (record: EmployeeApiRecord): Employee => ({
  _id: record._id,
  id: record.employeeId,
  name: record.name,
  email: record.email,
  password: record.password ?? "",
  phone: record.phone ? record.phone.replace(/^\+91/, "") : "-",
  designation: record.designation,
  status: record.status ?? "Active",
  userType: record.userType === 1 || record.userType === 2 ? record.userType : 3,
});

const apiPhone = (phone: string) => phone.trim().replace(/^\+91/, "");

const getApiData = <T,>(body: ApiEnvelope<T> | T, fallback: string): T => {
  if (typeof body === "object" && body !== null && "success" in body && body.success === false) {
    throw new Error((body as ApiEnvelope<T>).message ?? fallback);
  }

  if (typeof body === "object" && body !== null && "data" in body && body.data !== undefined) {
    return (body as ApiEnvelope<T>).data as T;
  }

  return body as T;
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string; error?: string; data?: { message?: string } } } }).response;
    if (response?.data?.message) return response.data.message;
    if (response?.data?.error) return response.data.error;
    if (response?.data?.data?.message) return response.data.data.message;
  }
  if (error instanceof Error && error.message && !error.message.startsWith("Request failed with status code")) return error.message;
  return fallback;
};

const isTimeoutError = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error && error.code === "ECONNABORTED";

const emptyForm = { id: "", name: "", email: "", password: "", phone: "", designation: "", userType: 3 as UserType };
type FormErrors = Partial<Record<keyof typeof emptyForm, string>>;

const validateForm = (form: typeof emptyForm, isEdit = false): FormErrors => {
  const errors: FormErrors = {};
  const id = form.id.trim();
  const name = form.name.trim();
  const email = form.email.trim();
  const phone = form.phone.trim();
  const designation = form.designation.trim();

  if (!id) errors.id = "Please fill the Employee ID.";
  else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/.test(id)) errors.id = "Employee ID must contain letters and numbers only.";
  if (!name) errors.name = "Please fill the name.";
  else if (!/^[A-Za-z ]+$/.test(name)) errors.name = "Name must contain alphabetical characters only.";
  if (!email) errors.email = "Please fill the email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid email address.";
  if (!isEdit && !form.password) errors.password = "Please fill the password.";
  else if (!isEdit && !/^\d{6}$/.test(form.password)) errors.password = "Password must be exactly 6 numbers.";
  if (!phone) errors.phone = "Please fill the mobile number.";
  else if (!/^[6-9]\d{9}$/.test(phone)) errors.phone = "Enter 10 digits starting with 6, 7, 8, or 9.";
  if (!designation) errors.designation = "Please fill the designation.";
  else if (!/^[A-Za-z ]+$/.test(designation)) errors.designation = "Designation must contain alphabetical characters only.";

  return errors;
};

function Employee_Creation() {
  const location = useLocation();
  const navigate = useNavigate();
  const normalizedPath = location.pathname.replace(/\/$/, "");
  const isCreate = normalizedPath === "/employee-creation/create";
  const isEdit = normalizedPath === "/employee-creation/edit";
  const drawerOpen = isCreate || isEdit;
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [message, setMessage] = useState("");
  const [messageSeverity, setMessageSeverity] = useState<"success" | "error">("success");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const updateField = (field: keyof typeof emptyForm, value: string) => {
    const nextForm = { ...form, [field]: field === "userType" ? Number(value) as UserType : value };
    setForm(nextForm);
    if (errors[field]) setErrors((current) => ({ ...current, [field]: validateForm(nextForm)[field] }));
  };

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get("/employees/list");
      const records = getApiData<EmployeeApiRecord[]>(response.data, "Unable to load employees.");
      if (!Array.isArray(records)) throw new Error("Invalid employee list response");
      setEmployees(records.map(toEmployee));
    } catch (error) {
      if (isTimeoutError(error)) return;
      setMessage(getApiErrorMessage(error, "Unable to load employees."));
      setMessageSeverity("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEmployees();
  }, []);

  const openCreateDrawer = () => {
    setEditingId(null);
    setSelectedEmployee(null);
    setForm(emptyForm);
    setMessage("");
    setErrors({});
    navigate("/employee-creation/create");
  };

  const openEditDrawer = async (employee: Employee) => {
    setEditingId(employee.id);
    setSelectedEmployee(employee);
    setForm({ ...emptyForm, ...employee, phone: employee.phone === "-" ? "" : employee.phone.replace(/^\+91/, "") });
    setMessage("");
    setErrors({});
    navigate("/employee-creation/edit");

    if (!employee.id) return;
    try {
      const response = await api.get(`/employees/view/${encodeURIComponent(employee.id)}`);
      const record = getApiData<EmployeeApiRecord>(response.data, "Unable to load employee details.");
      if (record) {
        setForm((current) => ({
          ...current,
          id: record.employeeId,
          name: record.name,
          email: record.email,
          password: record.password ?? current.password,
          phone: record.phone ? record.phone.replace(/^\+91/, "") : "",
          designation: record.designation,
        }));
      }
    } catch (error) {
      if (isTimeoutError(error)) return;
      setMessage(getApiErrorMessage(error, "Unable to load employee details."));
      setMessageSeverity("error");
    }
  };

  const closeDrawer = () => {
    setEditingId(null);
    setSelectedEmployee(null);
    setForm(emptyForm);
    setErrors({});
    navigate("/employee-creation");
  };

  const saveEmployee = async () => {

    const validationErrors = validateForm(form, isEdit);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;
    const selectedEmployeeRecord = selectedEmployee ?? employees.find((employee) => employee.id === editingId);
    const payload = {

      ...(editingId && selectedEmployeeRecord?._id ? { _id: selectedEmployeeRecord._id } : {}),
      ...(editingId ? { employeeId: form.id.trim() } : { employeeId: form.id.trim() }),
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      userType: form.userType,
      phone: apiPhone(form.phone),
      designation: form.designation.trim(),
      ...(editingId ? { status: selectedEmployeeRecord?.status ?? "Active" } : {}),
    };

    try {

      if (editingId)
         {
        const response = await api.post("/employees/update", payload);
        getApiData(response.data, "Unable to update employee.");
        setSuccessMessage("Employee details updated successfully.");
      }

       else {
        const response = await api.post("/employees/create", payload);
        getApiData<EmployeeApiRecord>(response.data, "Unable to create employee.");
        setSuccessMessage("Employee created successfully.");
      }
      await loadEmployees();
    } catch (error) 
    {
      if (isTimeoutError(error)) return;
      setMessage(getApiErrorMessage(error, editingId ? "Unable to update employee." : "Unable to create employee."));
      setMessageSeverity("error");
      return;
    }
    setEditingId(null);
    setSelectedEmployee(null);
    setForm(emptyForm);
    setErrors({});
    setSuccessDialogOpen(true);
    navigate("/employee-creation");
  };

  const openDeleteDialog = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  const cancelDelete = () => {
    setEmployeeToDelete(null);
    setDeleteDialogOpen(false);
  };

  const confirmDelete = () => {
    if (!employeeToDelete) return;
    setEmployees((current) => current.filter((employee) => employee.id !== employeeToDelete.id));
    setDeleteDialogOpen(false);
    setEmployeeToDelete(null);
    setMessage("Employee deleted successfully");
    setMessageSeverity("success");
  };

  return (
    <Box className="employee-creation-page" sx={{ width: "100%", minWidth: 0, overflowX: "hidden" }}>
      {message && <Alert severity={messageSeverity} onClose={() => setMessage("")} sx={{ mb: 2 }}>{message}</Alert>}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" } }}>
        <Box sx={{ minWidth: 0 }}><Typography variant="h4" sx={{ color: PRIMARY_GREEN, fontWeight: 800, fontSize: { xs: "2rem", sm: "2.125rem" } }}>Employees</Typography><Typography sx={{ color: "#5b7280", mt: 0.5 }}>Manage your employee records in one place.</Typography></Box>
        <Button variant="contained" size="large" startIcon={<AddRoundedIcon />} onClick={openCreateDrawer} disabled={loading} sx={{ width: { xs: "100%", sm: "auto" }, px: 3, py: 1.35, bgcolor: PRIMARY_GREEN, fontWeight: 800, "&:hover": { bgcolor: "#285c2f" } }}>Create</Button>
      </Stack>
      <TableContainer component={Paper} sx={{ width: "100%", border: "1px solid #d7f0df", overflowX: "auto" }}>
        <Table sx={{ minWidth: 780 }}>
          <TableHead sx={{ bgcolor: "#e8f7ee" }}><TableRow>{["Employee ID", "Name", "Email", "Phone", "Designation", "Status", "Action"].map((heading) => <TableCell key={heading} sx={{ color: "#14532d", fontWeight: 800, whiteSpace: "nowrap" }}>{heading}</TableCell>)}</TableRow></TableHead>
          <TableBody>{employees.length === 0 ? <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: "#78909c" }}>No employees found. Click "Create Employee" to add one.</TableCell></TableRow> : employees.map((employee) => <TableRow key={employee.id} hover>
            <TableCell sx={{ fontWeight: 700, color: "#15803d" }}>{employee.id}</TableCell><TableCell>{employee.name}</TableCell><TableCell>{employee.email}</TableCell><TableCell>{employee.phone}</TableCell><TableCell>{employee.designation}</TableCell>
            <TableCell><Box component="span" sx={{ px: 1.5, py: 0.6, borderRadius: 10, bgcolor: "#dff5e9", color: "#167044", fontWeight: 700, fontSize: 13 }}>{employee.status}</Box></TableCell>
            <TableCell><Stack direction="row" spacing={0.5}><Tooltip title="Edit employee"><IconButton aria-label={`Edit ${employee.name}`} onClick={() => openEditDrawer(employee)} sx={{ color: "#16a34a", bgcolor: "#e8f7ee", "&:hover": { bgcolor: "#d7f0df" } }}><EditOutlinedIcon /></IconButton></Tooltip><Tooltip title="Delete employee"><IconButton aria-label={`Delete ${employee.name}`} onClick={() => openDeleteDialog(employee)} sx={{ color: "#d14343", bgcolor: "#fff0f0", "&:hover": { bgcolor: "#ffe0e0" } }}><DeleteOutlineRoundedIcon /></IconButton></Tooltip></Stack></TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </TableContainer>

      <Drawer anchor="right" open={drawerOpen} onClose={closeDrawer}>
        <Box sx={{ width: { xs: "100vw", sm: 500 }, maxWidth: "100%", minHeight: "100vh", boxSizing: "border-box", overflowY: "auto", display: "flex", flexDirection: "column", p: { xs: 1.5, sm: 3 } }}>
          <Typography variant="h5" sx={{ color: PRIMARY_GREEN, fontWeight: 800, fontSize: { xs: "1.5rem", sm: "1.75rem" }, mb: 1.5 }}>{isEdit ? "Edit Employee" : "Create Employee"}</Typography>
          {messageSeverity === "error" && message && <Alert severity="error" onClose={() => setMessage("")} sx={{ mb: 2 }}>{message}</Alert>}
          <Stack spacing={4}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 1.5 }} sx={{ alignItems: { sm: "center" } }}>
              <Typography sx={{ width: { sm: 125 }, flexShrink: 0, fontWeight: 700, color: "#000000", fontSize: { xs: 14, sm: 16 } }}>Employee ID</Typography>
              <TextField fullWidth size="small" value={form.id} onChange={(event) => updateField("id", event.target.value)} error={Boolean(errors.id)} helperText={errors.id} required sx={formFieldSx} />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 1.5 }} sx={{ alignItems: { sm: "center" } }}>
              <Typography sx={{ width: { sm: 125 }, flexShrink: 0, fontWeight: 700, color: "#000000", fontSize: { xs: 14, sm: 16 } }}>Name</Typography>
              <TextField fullWidth size="small" value={form.name} onChange={(event) => updateField("name", event.target.value)} error={Boolean(errors.name)} helperText={errors.name} required sx={formFieldSx} />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 1.5 }} sx={{ alignItems: { sm: "center" } }}>
              <Typography sx={{ width: { sm: 125 }, flexShrink: 0, fontWeight: 700, color: "#000000", fontSize: { xs: 14, sm: 16 } }}>Email</Typography>
              <TextField fullWidth size="small" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} error={Boolean(errors.email)} helperText={errors.email} required sx={formFieldSx} />
            </Stack>
            {isCreate && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 1.5 }} sx={{ alignItems: { sm: "center" } }}>
                <Typography sx={{ width: { sm: 125 }, flexShrink: 0, fontWeight: 700, color: "#000000", fontSize: { xs: 14, sm: 16 } }}>Password</Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="password"
                  value={form.password}
                  slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 6 } }}
                  onChange={(event) => updateField("password", event.target.value.replace(/\D/g, "").slice(0, 6))}
                  error={Boolean(errors.password)}
                  helperText={errors.password}
                  sx={formFieldSx}
                  required
                />
              </Stack>
            )}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 1.5 }} sx={{ alignItems: { sm: "center" } }}>
              <Typography sx={{ width: { sm: 125 }, flexShrink: 0, fontWeight: 700, color: "#000000", fontSize: { xs: 14, sm: 16 } }}>Phone</Typography>
              <TextField fullWidth size="small" value={form.phone} onChange={(event) => updateField("phone", event.target.value.replace(/\D/g, "").slice(0, 10))} error={Boolean(errors.phone)} helperText={errors.phone} placeholder="10-digit mobile number" required sx={formFieldSx} />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 1.5 }} sx={{ alignItems: { sm: "center" } }}>
              <Typography sx={{ width: { sm: 125 }, flexShrink: 0, fontWeight: 700, color: "#000000", fontSize: { xs: 14, sm: 16 } }}>Designation</Typography>
              <TextField fullWidth size="small" value={form.designation} onChange={(event) => updateField("designation", event.target.value)} error={Boolean(errors.designation)} helperText={errors.designation} required sx={formFieldSx} />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 1.5 }} sx={{ alignItems: { sm: "center" } }}>
              <Typography sx={{ width: { sm: 125 }, flexShrink: 0, fontWeight: 700, color: "#000000", fontSize: { xs: 14, sm: 16 } }}>Role</Typography>
              <RadioGroup
                row
                value={String(form.userType)}
                onChange={(event) => updateField("userType", event.target.value)}
                sx={{ color: PRIMARY_GREEN, flexWrap: "wrap" }}
              >
                <FormControlLabel value="1" control={<Radio sx={{ color: PRIMARY_GREEN, "&.Mui-checked": { color: PRIMARY_GREEN } }} />} label="Admin" />
                <FormControlLabel value="2" control={<Radio sx={{ color: PRIMARY_GREEN, "&.Mui-checked": { color: PRIMARY_GREEN } }} />} label="HR" />
                <FormControlLabel value="3" control={<Radio sx={{ color: PRIMARY_GREEN, "&.Mui-checked": { color: PRIMARY_GREEN } }} />} label="Employee" />
              </RadioGroup>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", mt: 2 }}>
              <Button size="small" variant="outlined" onClick={closeDrawer} sx={{ color: PRIMARY_GREEN, borderColor: PRIMARY_GREEN, fontWeight: 700 }}>Cancel</Button>
              <Button size="small" variant="contained" onClick={saveEmployee} sx={{ bgcolor: PRIMARY_GREEN, fontWeight: 700, "&:hover": { bgcolor: "#285c2f" } }}>Save</Button>
            </Stack>
          </Stack>
        </Box>
      </Drawer>

      <Dialog open={successDialogOpen} onClose={() => setSuccessDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: PRIMARY_GREEN, fontWeight: 800 }}>Success</DialogTitle>
        <DialogContent><Typography>{successMessage}</Typography></DialogContent>
        <DialogActions><Button onClick={() => setSuccessDialogOpen(false)} variant="contained" autoFocus sx={{ bgcolor: PRIMARY_GREEN, fontWeight: 700, "&:hover": { bgcolor: "#285c2f" } }}>OK</Button></DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={cancelDelete} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: "#14532d" }}>Delete Employee</DialogTitle>
        <DialogContent><Typography sx={{ color: "#5b7280" }}>Are you sure you want to delete <strong>{employeeToDelete?.name}</strong>?</Typography></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={cancelDelete} variant="outlined" sx={{ color: "#14532d", borderColor: "#bbe6c8", fontWeight: 700 }}>Cancel</Button><Button onClick={confirmDelete} variant="contained" sx={{ bgcolor: "#d14343", fontWeight: 700, "&:hover": { bgcolor: "#b83232" } }}>Sure</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

export default Employee_Creation;