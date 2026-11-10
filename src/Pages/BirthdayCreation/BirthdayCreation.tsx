
import { useCallback, useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import {
  Add,
  Edit,
  Delete,
  CakeOutlined,
} from "@mui/icons-material";

import {
  getAllBirthdays,
  createBirthday,
  updateBirthday,
  deleteBirthday,
  type BirthdayReward,
  type BirthdayPayload,
} from "../../services/birthdayCreationService";

import "./BirthdayCreation.css";

const initialForm: BirthdayPayload = {
  employeeName: "",
  employeeId: "",
  dob: "",
};

// Get local date in YYYY-MM-DD format
const getToday = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function BirthdayCreation() {
  const [birthdays, setBirthdays] = useState<BirthdayReward[]>([]);
  
  const totalBirthdays = birthdays.length;

  const currentMonth = new Date().getMonth();

  const thisMonthBirthdays = birthdays.filter((birthday) => {
     const dob = new Date(birthday.dob);

     return (
       !isNaN(dob.getTime()) &&
       dob.getMonth() === currentMonth
     );
  }).length; 
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [form, setForm] = useState<BirthdayPayload>({
    ...initialForm,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // FETCH ALL BIRTHDAY RECORDS
  const fetchBirthdays = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAllBirthdays();

      setBirthdays(response.data || []);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        "Unable to fetch birthday records"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBirthdays();
  }, [fetchBirthdays]);

  // OPEN CREATE POPUP
  const handleCreate = () => {
    setForm({ ...initialForm });
    setEditingId(null);
    setError("");
    setOpen(true);
  };

  // OPEN EDIT POPUP
  const handleEdit = (birthday: BirthdayReward) => {
    setForm({
      employeeName: birthday.employeeName,
      employeeId: birthday.employeeId,
      dob: birthday.dob.substring(0, 10),
    });

    setEditingId(birthday.employeeId);
    setError("");
    setOpen(true);
  };

  // CLEAR FORM
  const handleClear = () => {
    setForm({ ...initialForm });
    setError("");
  };

  // HANDLE FORM INPUT
  const handleChange = (
    field: keyof BirthdayPayload,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // SAVE / UPDATE BIRTHDAY
  const handleSave = async () => {
    const employeeName = form.employeeName.trim();
    const employeeId = form.employeeId.trim();
    const dob = form.dob;

    if (!employeeName || !employeeId || !dob) {
      setError("Please fill all required fields");
      return;
    }

    if (dob > getToday()) {
      setError("Date of birth cannot be in the future");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload: BirthdayPayload = {
        employeeName,
        employeeId,
        dob,
      };

      if (editingId) {
        await updateBirthday(editingId, payload);

        setSuccess("Birthday updated successfully");
      } else {
        await createBirthday(payload);

        setSuccess("Birthday created successfully");
      }

      setOpen(false);
      setEditingId(null);
      setForm({ ...initialForm });

      await fetchBirthdays();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        "Unable to save birthday details"
      );
    } finally {
      setSaving(false);
    }
  };

  // OPEN DELETE CONFIRMATION
  const handleDeleteClick = (employeeId: string) => {
    setSelectedId(employeeId);
    setDeleteOpen(true);
  };

  // DELETE BIRTHDAY
  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      setSaving(true);

      await deleteBirthday(selectedId);

      setDeleteOpen(false);
      setSelectedId(null);

      setSuccess("Birthday deleted successfully");

      await fetchBirthdays();
    } catch (err: any) {
      setDeleteOpen(false);

      setError(
        err.response?.data?.message ||
        "Unable to delete birthday"
      );
    } finally {
      setSaving(false);
    }
  };

  // FORMAT DOB
  const formatDOB = (dob: string) => {
    if (!dob) return "-";

    const date = dob.substring(0, 10);
    const [year, month, day] = date.split("-");

    return `${day}-${month}-${year}`;
  };

  return (
    <Box className="birthday-page">

      {/* PAGE HEADER */}
      <Box className="birthday-header">

        <Box>
          <Typography 
              variant="h5" 
              sx={{ fontWeight: 600 }}
          >
            Birthday Creation
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Manage employee birthday details
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreate}
          className="birthday-create-btn"
        >
          Create Birthday
        </Button>

      </Box>

      {/* SUCCESS MESSAGE */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess("")}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Alert
          severity="success"
          onClose={() => setSuccess("")}
        >
          {success}
        </Alert>
      </Snackbar>

      {/* ERROR MESSAGE */}
      {error && !open && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}
    
      {/* BIRTHDAY STATS */}
      <Box className="birthday-stats">
         <Box className="birthday-stat-card">
           <Typography variant="body1">
              Total Birthdays
           </Typography>
           <Typography variant="h4">
             {totalBirthdays}
           </Typography>
      </Box>

      <Box className="birthday-stat-card">
      <Typography variant="body1">
         This Month
      </Typography>
      <Typography variant="h4">
        {thisMonthBirthdays}
      </Typography>
      </Box>
     </Box>

      {/* BIRTHDAY TABLE */}
      <TableContainer
        component={Paper}
        className="birthday-table-container"
      >
        {loading ? (
          <Box className="birthday-loading">
            <CircularProgress />
          </Box>
        ) : (
          <Table>

            <TableHead>
              <TableRow>
                <TableCell>Employee Name</TableCell>
                <TableCell>Employee ID</TableCell>
                <TableCell>Date of Birth</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>

              {birthdays.length > 0 ? (
                birthdays.map((birthday) => (
                  <TableRow key={birthday._id} hover>

                    <TableCell>
                      {birthday.employeeName}
                    </TableCell>

                    <TableCell>
                      {birthday.employeeId}
                    </TableCell>

                    <TableCell>
                      {formatDOB(birthday.dob)}
                    </TableCell>

                    <TableCell align="center">

                     
                    <TableCell align="center">

  {/* EDIT BUTTON */}
  <IconButton
    sx={{
      color: "#016637",
      "&:hover": {
        backgroundColor: "rgba(1, 102, 55, 0.08)",
      },
    }}
    onClick={() => handleEdit(birthday)}
    title="Edit"
  >
    <Edit />
  </IconButton>

  {/* DELETE BUTTON */}
  <IconButton
    color="error"
    onClick={() =>
      handleDeleteClick(birthday.employeeId)
    }
    title="Delete"
  >
    <Delete />
  </IconButton>

</TableCell>


                      <IconButton
                        color="error"
                        onClick={() =>
                          handleDeleteClick(birthday.employeeId)
                        }
                        title="Delete"
                      >
                        <Delete />
                      </IconButton>

                    </TableCell>

                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No birthday records found
                  </TableCell>
                </TableRow>
              )}

            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* CREATE / EDIT POPUP */}
      <Dialog
        open={open}
        onClose={() => !saving && setOpen(false)}
        fullWidth
        maxWidth="sm"
      >

        <DialogTitle>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <CakeOutlined sx={{ color: "#016637" }} />

            <Typography
                 variant="h6"
                 sx={{ fontWeight: 600 }}
            >
            {editingId ? "Edit Birthday" : "Create Birthday"}
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent>

          <Stack spacing={3} sx={{ mt: 1 }}>

            <TextField
              label="Employee Name"
              placeholder="Enter employee name"
              fullWidth
              required
              value={form.employeeName}
              onChange={(e) =>
                handleChange("employeeName", e.target.value)
              }
            />

            <TextField
              label="Employee ID"
              placeholder="Enter employee ID"
              fullWidth
              required
              value={form.employeeId}
              onChange={(e) =>
                handleChange("employeeId", e.target.value)
              }
            />

            <TextField
              label="Date of Birth"
              type="date"
              fullWidth
              required
              value={form.dob}
              onChange={(e) =>
                handleChange("dob", e.target.value)
              }
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
                htmlInput: {
                  max: getToday(),
                },
              }}
            />

            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}

          </Stack>

        </DialogContent>

        <DialogActions sx={{ p: 3 }}>

          <Button
            variant="outlined"
            color="inherit"
            onClick={handleClear}
            disabled={saving}
          >
            Clear
          </Button>

          <Button
            variant="contained"
            className="birthday-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <CircularProgress size={22} color="inherit" />
            ) : editingId ? (
              "Update"
            ) : (
              "Save"
            )}
          </Button>

        </DialogActions>

      </Dialog>

      {/* DELETE CONFIRMATION POPUP */}
      <Dialog
        open={deleteOpen}
        onClose={() => !saving && setDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
      >

        <DialogTitle>
          Delete Birthday
        </DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to delete this birthday record?
          </Typography>

          <Typography
            sx={{
              fontWeight: 600,
              mt: 1,
          }}
          >
          Employee ID: {selectedId}
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>

          <Button
            onClick={() => setDeleteOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={saving}
          >
            {saving ? "Deleting..." : "Delete"}
          </Button>

        </DialogActions>

      </Dialog>

    </Box>
  );
}
