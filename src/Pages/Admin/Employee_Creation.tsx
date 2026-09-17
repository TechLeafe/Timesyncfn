import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  Paper,
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

type Employee = {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  designation: string;
  status: "Active" | "Inactive";
};

const initialEmployees: Employee[] = [];

const emptyForm = { id: "", name: "", email: "", password: "", phone: "", designation: "" };

function Employee_Creation() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [form, setForm] = useState(emptyForm);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageSeverity, setMessageSeverity] = useState<"success" | "error">("success");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");

  const updateField = (field: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setShowValidation(false);

    if (field === "password") {
      setPasswordError(value && !/^\d*$/.test(value) ? "Password must contain numbers only" : value && value.length !== 6 ? "Password must be exactly 6 numbers" : "");
    }

    if (field === "email") {
      setEmailError(value && !/^[^\s@]+@[^\s@]+\.com$/.test(value) ? "Email must contain @ and end with .com" : "");
    }
  };

  const openCreateDrawer = () => {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setShowValidation(false);
    setPasswordError("");
    setEmailError("");
    setDrawerOpen(true);
  };

  const openEditDrawer = (employee: Employee) => {
    setEditingId(employee.id);
    setForm({ ...employee, phone: employee.phone === "-" ? "" : employee.phone });
    setMessage("");
    setShowValidation(false);
    setPasswordError("");
    setEmailError("");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setShowValidation(false);
    setPasswordError("");
    setEmailError("");
  };

  const saveEmployee = () => {
    if (!form.id.trim() || !form.name.trim() || !form.email.trim() || !form.password.trim() || !form.designation.trim()) {
      setShowValidation(true);
      return;
    }
    if (!/^\d{6}$/.test(form.password)) {
      setPasswordError("Password must be exactly 6 numbers");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.com$/.test(form.email)) {
      setEmailError("Email must contain @ and end with .com");
      return;
    }
    if (editingId) {
      setEmployees((current) => current.map((employee) => employee.id === editingId ? { ...employee, ...form, phone: form.phone.trim() || "-" } : employee));
      setMessage("Successfully updated employee details");
      setMessageSeverity("success");
    } else {
      if (employees.some((employee) => employee.id === form.id.trim())) {
        setMessage("Employee ID already exists");
        setMessageSeverity("error");
        return;
      }
      setEmployees((current) => [...current, { ...form, id: form.id.trim(), name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || "-", designation: form.designation.trim(), status: "Active" }]);
      setMessage("Successfully created employee details");
      setMessageSeverity("success");
    }
    setDrawerOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setShowValidation(false);
    setPasswordError("");
    setEmailError("");
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
    <Box sx={{ width: "100%", minWidth: 0, overflowX: "hidden" }}>
      {message && <Alert severity={messageSeverity} onClose={() => setMessage("")} sx={{ mb: 2 }}>{message}</Alert>}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" } }}>
        <Box sx={{ minWidth: 0 }}><Typography variant="h4" sx={{ color: "#14532d", fontWeight: 800, fontSize: { xs: "2rem", sm: "2.125rem" } }}>Employees</Typography><Typography sx={{ color: "#5b7280", mt: 0.5 }}>Manage your employee records in one place.</Typography></Box>
        <Button variant="contained" size="large" startIcon={<AddRoundedIcon />} onClick={openCreateDrawer} sx={{ width: { xs: "100%", sm: "auto" }, px: 3, py: 1.35, bgcolor: "#16a34a", fontWeight: 800, "&:hover": { bgcolor: "#15803d" } }}>Create</Button>
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
          <Typography variant="h5" sx={{ color: "#14532d", fontWeight: 800, fontSize: { xs: "1.5rem", sm: "1.75rem" }, mb: 1.5 }}>{editingId ? "Edit Employee" : "Create Employee"}</Typography>
          {messageSeverity === "error" && message && <Alert severity="error" onClose={() => setMessage("")} sx={{ mb: 2 }}>{message}</Alert>}
          <Stack spacing={4}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 1.5 }} sx={{ alignItems: { sm: "center" } }}>
              <Typography sx={{ width: { sm: 125 }, flexShrink: 0, fontWeight: 700, color: "#000000", fontSize: { xs: 14, sm: 16 } }}>Employee ID</Typography>
              <TextField fullWidth size="small" value={form.id} onChange={(event) => updateField("id", event.target.value)} required />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 1.5 }} sx={{ alignItems: { sm: "center" } }}>
              <Typography sx={{ width: { sm: 125 }, flexShrink: 0, fontWeight: 700, color: "#000000", fontSize: { xs: 14, sm: 16 } }}>Name</Typography>
              <TextField fullWidth size="small" value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 1.5 }} sx={{ alignItems: { sm: "center" } }}>
              <Typography sx={{ width: { sm: 125 }, flexShrink: 0, fontWeight: 700, color: "#000000", fontSize: { xs: 14, sm: 16 } }}>Email</Typography>
              <TextField fullWidth size="small" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} error={Boolean(emailError)} helperText={emailError} required />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 1.5 }} sx={{ alignItems: { sm: "center" } }}>
              <Typography sx={{ width: { sm: 125 }, flexShrink: 0, fontWeight: 700, color: "#000000", fontSize: { xs: 14, sm: 16 } }}>Password</Typography>
              <TextField
                fullWidth
                size="small"
                type="password"
                value={form.password}
                slotProps={{ htmlInput: { maxLength: 6, inputMode: "numeric" } }}
                onChange={(event) => updateField("password", event.target.value.replace(/\D/g, ""))}
                error={Boolean(passwordError)}
                helperText={passwordError}
                required
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 1.5 }} sx={{ alignItems: { sm: "center" } }}>
              <Typography sx={{ width: { sm: 125 }, flexShrink: 0, fontWeight: 700, color: "#000000", fontSize: { xs: 14, sm: 16 } }}>Phone</Typography>
              <TextField fullWidth size="small" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 1.5 }} sx={{ alignItems: { sm: "center" } }}>
              <Typography sx={{ width: { sm: 125 }, flexShrink: 0, fontWeight: 700, color: "#000000", fontSize: { xs: 14, sm: 16 } }}>Designation</Typography>
              <TextField fullWidth size="small" value={form.designation} onChange={(event) => updateField("designation", event.target.value)} required />
            </Stack>
            {showValidation && <Typography sx={{ color: "#d32f2f", fontSize: 14, fontWeight: 600, mt: -1 }}>Please fill all details</Typography>}

            <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", mt: 2 }}>
              <Button size="small" variant="outlined" onClick={closeDrawer} sx={{ color: "#14532d", borderColor: "#bbe6c8", fontWeight: 700 }}>Cancel</Button>
              <Button size="small" variant="contained" onClick={saveEmployee} sx={{ bgcolor: "#16a34a", fontWeight: 700, "&:hover": { bgcolor: "#15803d" } }}>Save</Button>
            </Stack>
          </Stack>
        </Box>
      </Drawer>

      <Dialog open={deleteDialogOpen} onClose={cancelDelete} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: "#14532d" }}>Delete Employee</DialogTitle>
        <DialogContent><Typography sx={{ color: "#5b7280" }}>Are you sure you want to delete <strong>{employeeToDelete?.name}</strong>?</Typography></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={cancelDelete} variant="outlined" sx={{ color: "#14532d", borderColor: "#bbe6c8", fontWeight: 700 }}>Cancel</Button><Button onClick={confirmDelete} variant="contained" sx={{ bgcolor: "#d14343", fontWeight: 700, "&:hover": { bgcolor: "#b83232" } }}>Sure</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

export default Employee_Creation;