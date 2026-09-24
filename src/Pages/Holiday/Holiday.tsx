
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  type SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowLeft,
  Eye,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import api from "../../api/axiosInstance";
import "../Holiday/Holiday.css";

type HolidayStatus = "Active" | "Inactive";

interface HolidayData {
  _id: string;
  holidayName: string;
  holidayDate: string;
  holidayType: string;
  companyYear: string;
  description: string;
  status: HolidayStatus;
  createdAt?: string;
  updatedAt?: string;
}

interface HolidayFormData {
  holidayName: string;
  holidayDate: string;
  holidayType: string;
  companyYear: string;
  description: string;
  status: HolidayStatus;
}

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

type Toast = {
  type: "success" | "error";
  text: string;
};

const getCompanyYear = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  return month >= 3
    ? `${year}-${year + 1}`
    : `${year - 1}-${year}`;
};

const initialForm: HolidayFormData = {
  holidayName: "",
  holidayDate: "",
  holidayType: "",
  companyYear: getCompanyYear(),
  description: "",
  status: "Active",
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: ApiResponse<unknown>;
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return error instanceof Error ? error.message : fallback;
};

export default function Holiday() {
  const [holidays, setHolidays] = useState<HolidayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<Toast | null>(null);
  const [dialogError, setDialogError] = useState("");

  const [formData, setFormData] =
    useState<HolidayFormData>(initialForm);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedHoliday, setSelectedHoliday] =
    useState<HolidayData | null>(null);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [toast]);

  // Load holidays
  const loadHolidays = async (): Promise<HolidayData[]> => {
    try {
      setLoading(true);

      const response = await api.post<ApiResponse<HolidayData[]>>(
        "/holidays/list",
        {
          companyYear: "",
          holidayType: "",
        }
      );

      const data = response.data.data;

      if (!Array.isArray(data)) {
        throw new Error("Invalid holiday response.");
      }

      setHolidays(data);

      return data;
    } catch (error) {
      setToast({
        type: "error",
        text: getErrorMessage(
          error,
          "Unable to load holidays."
        ),
      });

      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHolidays();
  }, []);

  // Handle text fields
  const handleTextFieldChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Handle select fields
  const handleSelectChange = (
    event: SelectChangeEvent<string>
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Create holiday
  const handleCreateHoliday = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setDialogError("");

    try {
      setSaving(true);

      const response = await api.post<ApiResponse<HolidayData>>(
        "/holidays/create",
        formData
      );

      if (response.data.success === false) {
        throw new Error(
          response.data.message || "Unable to create holiday."
        );
      }

      setToast({
        type: "success",
        text:
          response.data.message ||
          "Holiday created successfully.",
      });

      setShowCreateModal(false);
      setFormData(initialForm);

      await loadHolidays();
    } catch (error) {
      setDialogError(
        getErrorMessage(
          error,
          "Unable to create holiday."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  // Open holiday details
  const openHolidayDetails = (holiday: HolidayData) => {
    setSelectedHoliday(holiday);
  };

  // Open edit form
  const openEditModal = (holiday: HolidayData) => {
    setSelectedHoliday(holiday);

    setFormData({
      holidayName: holiday.holidayName,
      holidayDate: holiday.holidayDate,
      holidayType: holiday.holidayType,
      companyYear: holiday.companyYear,
      description: holiday.description,
      status: holiday.status,
    });

    setDialogError("");
    setShowEditModal(true);
  };

  // Update holiday
  const handleUpdateHoliday = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!selectedHoliday) return;

    setDialogError("");

    try {
      setSaving(true);

      const response = await api.post<ApiResponse<HolidayData>>(
        "/holidays/update",
        {
          _id: selectedHoliday._id,
          ...formData,
        }
      );

      if (response.data.success === false) {
        throw new Error(
          response.data.message || "Unable to update holiday."
        );
      }

      setToast({
        type: "success",
        text:
          response.data.message ||
          "Holiday updated successfully.",
      });

      setShowEditModal(false);
      setFormData(initialForm);

      const refreshed = await loadHolidays();

      const updated = refreshed.find(
        (item) => item._id === selectedHoliday._id
      );

      if (updated) {
        setSelectedHoliday(updated);
      }
    } catch (error) {
      setDialogError(
        getErrorMessage(
          error,
          "Unable to update holiday."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete holiday
  const handleDeleteHoliday = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this holiday?"
    );

    if (!confirmed) return;

    try {
      await api.post("/holidays/delete", {
        _id: id,
      });

      setSelectedHoliday(null);

      setToast({
        type: "success",
        text: "Holiday deleted successfully.",
      });

      await loadHolidays();
    } catch (error) {
      setToast({
        type: "error",
        text: getErrorMessage(
          error,
          "Unable to delete holiday."
        ),
      });
    }
  };

  // Format date
  const formatDate = (date: string) => {
    if (!date) return "-";

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const openCreateModal = () => {
    setFormData(initialForm);
    setDialogError("");
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    if (saving) return;

    setShowCreateModal(false);
    setFormData(initialForm);
    setDialogError("");
  };

  const closeEditModal = () => {
    if (saving) return;

    setShowEditModal(false);
    setFormData(initialForm);
    setDialogError("");
  };

  // Holiday details
  if (selectedHoliday) {
    return (
      <Box className="holiday-page">
        {toast && (
          <Box
            className={`holiday-toast holiday-toast--${toast.type}`}
          >
            {toast.text}
          </Box>
        )}

        <Button
          className="holiday-back-button"
          onClick={() => setSelectedHoliday(null)}
          startIcon={<ArrowLeft size={20} />}
        >
          Back to Holidays
        </Button>

        <Box
          component="section"
          className="holiday-details-card"
        >
          <Box className="holiday-details-card-header">
            <Typography component="h2">
              Holiday information
            </Typography>

            <Box className="holiday-detail-actions">
              <Button
                className="holiday-edit-btn"
                startIcon={<Pencil size={18} />}
                onClick={() =>
                  openEditModal(selectedHoliday)
                }
              >
                Edit
              </Button>

              <Button
                className="holiday-delete-btn"
                startIcon={<Trash2 size={18} />}
                onClick={() =>
                  void handleDeleteHoliday(
                    selectedHoliday._id
                  )
                }
              >
                Delete
              </Button>
            </Box>
          </Box>

          <Box className="holiday-information-grid">
            <Box className="holiday-information-item">
              <span>Holiday Name</span>
              <strong>
                {selectedHoliday.holidayName}
              </strong>
            </Box>

            <Box className="holiday-information-item">
              <span>Holiday Date</span>
              <strong>
                {formatDate(
                  selectedHoliday.holidayDate
                )}
              </strong>
            </Box>

            <Box className="holiday-information-item">
              <span>Holiday Type</span>
              <strong>
                {selectedHoliday.holidayType}
              </strong>
            </Box>

            <Box className="holiday-information-item">
              <span>Company Year</span>
              <strong>
                {selectedHoliday.companyYear}
              </strong>
            </Box>

            <Box className="holiday-information-item">
              <span>Description</span>
              <strong>
                {selectedHoliday.description || "-"}
              </strong>
            </Box>

            <Box className="holiday-information-item">
              <span>Status</span>

              <Chip
                label={selectedHoliday.status}
                className={`holiday-status ${
                  selectedHoliday.status === "Active"
                    ? "active"
                    : "inactive"
                }`}
              />
            </Box>
          </Box>
        </Box>

        <HolidayModal
          open={showEditModal}
          title="Edit Holiday"
          submitText={
            saving ? "Saving..." : "Save Holiday"
          }
          formData={formData}
          error={dialogError}
          saving={saving}
          onTextFieldChange={handleTextFieldChange}
          onSelectChange={handleSelectChange}
          onSubmit={(event) =>
            void handleUpdateHoliday(event)
          }
          onCancel={closeEditModal}
        />
      </Box>
    );
  }

  return (
    <Box className="holiday-page">
      {toast && (
        <Box
          className={`holiday-toast holiday-toast--${toast.type}`}
        >
          {toast.text}
        </Box>
      )}

      <Box
        component="section"
        className="holiday-table-card"
      >
        <Box className="holiday-table-title">
          <Typography component="h2">
            Company Holidays
          </Typography>

          <Button
            className="create-holiday-btn"
            startIcon={<Plus size={19} />}
            onClick={openCreateModal}
          >
            Create Holiday
          </Button>
        </Box>

        <Box className="holiday-table-wrapper">
          <table className="holiday-table">
            <thead>
              <tr>
                <th>Holiday Name</th>
                <th>Holiday Date</th>
                <th>Holiday Type</th>
                <th>Company Year</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="holiday-empty-state"
                  >
                    Loading holidays...
                  </td>
                </tr>
              ) : holidays.length > 0 ? (
                holidays.map((holiday) => (
                  <tr key={holiday._id}>
                    <td className="holiday-name">
                      {holiday.holidayName}
                    </td>

                    <td>
                      {formatDate(
                        holiday.holidayDate
                      )}
                    </td>

                    <td>
                      {holiday.holidayType}
                    </td>

                    <td>
                      {holiday.companyYear}
                    </td>

                    <td>
                      <Chip
                        label={holiday.status}
                        className={`holiday-status ${
                          holiday.status === "Active"
                            ? "active"
                            : "inactive"
                        }`}
                      />
                    </td>

                    <td>
                      <IconButton
                        className="holiday-view-button"
                        onClick={() =>
                          openHolidayDetails(
                            holiday
                          )
                        }
                        title="View holiday"
                      >
                        <Eye size={21} />
                      </IconButton>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="holiday-empty-state"
                  >
                    No holidays created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Box>
      </Box>

      {/* Create Holiday */}
      <HolidayModal
        open={showCreateModal}
        title="Create Holiday"
        submitText={
          saving ? "Saving..." : "Save Holiday"
        }
        formData={formData}
        error={dialogError}
        saving={saving}
        onTextFieldChange={handleTextFieldChange}
        onSelectChange={handleSelectChange}
        onSubmit={(event) =>
          void handleCreateHoliday(event)
        }
        onCancel={closeCreateModal}
      />
    </Box>
  );
}

interface HolidayModalProps {
  open: boolean;
  title: string;
  submitText: string;
  formData: HolidayFormData;
  error: string;
  saving: boolean;

  onTextFieldChange: (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => void;

  onSelectChange: (
    event: SelectChangeEvent<string>
  ) => void;

  onSubmit: (
    event: React.FormEvent<HTMLFormElement>
  ) => void;

  onCancel: () => void;
}

function HolidayModal({
  open,
  title,
  submitText,
  formData,
  error,
  saving,
  onTextFieldChange,
  onSelectChange,
  onSubmit,
  onCancel,
}: HolidayModalProps) {
  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (
          reason === "backdropClick" ||
          reason === "escapeKeyDown"
        ) {
          return;
        }

        onCancel();
      }}
      fullWidth
      maxWidth="md"
      className="holiday-dialog"
    >
      <DialogTitle className="holiday-modal-title">
        <Typography component="h2">
          {title}
        </Typography>

        <IconButton
          onClick={onCancel}
          disabled={saving}
          aria-label="Close"
        >
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent className="holiday-modal">
        {error && (
          <Box className="holiday-modal-error">
            {error}
          </Box>
        )}

        <Box
          component="form"
          onSubmit={onSubmit}
          className="holiday-form"
        >
          <Box className="holiday-form-group">
            <TextField
              label="Holiday name"
              name="holidayName"
              value={formData.holidayName}
              onChange={onTextFieldChange}
              placeholder="Enter holiday name"
              required
              fullWidth
            />
          </Box>

          <Box className="holiday-form-grid">
            <Box className="holiday-form-group">
              <TextField
                label="Holiday date"
                name="holidayDate"
                type="date"
                value={formData.holidayDate}
                onChange={onTextFieldChange}
                required
                fullWidth
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
            </Box>

            <Box className="holiday-form-group">
              <Select
                name="holidayType"
                value={formData.holidayType}
                onChange={onSelectChange}
                displayEmpty
                fullWidth
                required
              >
                <MenuItem value="">
                  Select holiday type
                </MenuItem>

                <MenuItem value="Public">
                  Public
                </MenuItem>

                <MenuItem value="Company">
                  Company
                </MenuItem>
              </Select>
            </Box>

            <Box className="holiday-form-group">
              <TextField
                label="Company year"
                name="companyYear"
                value={formData.companyYear}
                onChange={onTextFieldChange}
                placeholder="2026-2027"
                required
                fullWidth
                slotProps={{
                  htmlInput: {
                    pattern: "[0-9]{4}-[0-9]{4}",
                  },
                }}
              />
            </Box>

            <Box className="holiday-form-group">
              <Select
                name="status"
                value={formData.status}
                onChange={onSelectChange}
                fullWidth
              >
                <MenuItem value="Active">
                  Active
                </MenuItem>

                <MenuItem value="Inactive">
                  Inactive
                </MenuItem>
              </Select>
            </Box>
          </Box>

          <Box className="holiday-form-group">
            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={onTextFieldChange}
              placeholder="Enter holiday description"
              multiline
              rows={3}
              fullWidth
            />
          </Box>

          {/* Save and cancel */}
          <DialogActions className="holiday-modal-actions">
            <Button
              type="button"
              className="holiday-cancel-button"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              className="holiday-save-button"
              disabled={saving}
            >
              {submitText}
            </Button>
          </DialogActions>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

