import { useCallback, useEffect, useState } from "react";

import type { ChangeEvent, FormEvent, ReactNode } from "react";

import {

  Alert,

  Box,

  Button,

  Chip,

  CircularProgress,

  Dialog,

  DialogActions,

  DialogContent,

  DialogTitle,

  FormControl,

  IconButton,

  MenuItem,

  Select,

  Snackbar,

  TextField,

  Tooltip,

  Typography,

} from "@mui/material";

import type { SelectChangeEvent } from "@mui/material";

import {

  ArrowLeft,

  Building2,

  CalendarCheck2,

  CircleCheck,

  FileText,

  Tag,

  CalendarDays,

  Eye,

  Pencil,

  Plus,

  RefreshCw,

  Trash2,

  X,

} from "lucide-react";

import api from "../../api/axiosInstance";

import "./Holiday.css";

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

interface ApiResponse<T> {

  success?: boolean;

  message?: string;

  data?: T;

}

interface Toast {

  type: "success" | "error";

  text: string;

}

const getCompanyYear = (date = new Date()) => {

  const year = date.getFullYear();

  return date.getMonth() >= 3

    ? `${year}-${year + 1}`

    : `${year - 1}-${year}`;

};

const createEmptyForm = (): HolidayFormData => ({

  holidayName: "",

  holidayDate: "",

  holidayType: "",

  companyYear: getCompanyYear(),

  description: "",

  status: "Active",

});

type HolidayDateStatus = "Completed" | "Today" | "Upcoming" | "Inactive";

const getHolidayDateStatus = (
  holiday: Pick<HolidayData, "holidayDate" | "status">,
  currentDate = new Date()
): HolidayDateStatus => {
  // Inactive is an administrative state, not an elapsed-date label.
  if (holiday.status === "Inactive") return "Inactive";

  const dateKey = holiday.holidayDate?.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (!dateKey) return "Upcoming";

  const todayKey = [
    currentDate.getFullYear(),
    String(currentDate.getMonth() + 1).padStart(2, "0"),
    String(currentDate.getDate()).padStart(2, "0"),
  ].join("-");

  if (dateKey < todayKey) return "Completed";
  if (dateKey === todayKey) return "Today";
  return "Upcoming";
};

const toInputDate = (value: string) => {

  const match = value?.match(/^\d{4}-\d{2}-\d{2}/);

  return match ? match[0] : "";

};

const formatDate = (value: string) => {

  const date = toInputDate(value);

  if (!date) return "-";

  const [year, month, day] = date.split("-").map(Number);

  return new Date(

    year,

    month - 1,

    day

  ).toLocaleDateString("en-IN", {

    day: "2-digit",

    month: "short",

    year: "numeric",

  });

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

          data?: { message?: string };

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

  const [deleting, setDeleting] = useState(false);

  const [loadError, setLoadError] = useState("");

  const [toast, setToast] = useState<Toast | null>(null);

  const [dialogError, setDialogError] = useState("");

  const [formData, setFormData] =

    useState<HolidayFormData>(createEmptyForm);

  const [dialogMode, setDialogMode] = useState<

    "create" | "edit" | null

  >(null);

  const [selectedHoliday, setSelectedHoliday] =

    useState<HolidayData | null>(null);

  const loadHolidays = useCallback(async () => {

    setLoading(true);

    setLoadError("");

    try {

      const response =

        await api.post<ApiResponse<HolidayData[]>>(

          "/holidays/list",

          {

            companyYear: "",

            holidayType: "",

          }

        );

      if (response.data.success === false) {

        throw new Error(

          response.data.message || "Unable to load holidays."

        );

      }

      if (!Array.isArray(response.data.data)) {

        throw new Error("Invalid holiday response.");

      }

      const result = response.data.data;

      setHolidays(result);

      return result;

    } catch (error) {

      setLoadError(

        getErrorMessage(error, "Unable to load holidays.")

      );

      return null;

    } finally {

      setLoading(false);

    }

  }, []);

  useEffect(() => {

    void loadHolidays();

  }, [loadHolidays]);

  const showToast = (

    type: Toast["type"],

    text: string

  ) => {

    setToast({ type, text });

  };

  const openCreateModal = () => {

    setFormData(createEmptyForm());

    setDialogError("");

    setDialogMode("create");

  };

  const openEditModal = (holiday: HolidayData) => {

    setSelectedHoliday(holiday);

    setFormData({

      holidayName: holiday.holidayName,

      holidayDate: toInputDate(holiday.holidayDate),

      holidayType: holiday.holidayType,

      companyYear: holiday.companyYear,

      description: holiday.description || "",

      status: holiday.status,

    });

    setDialogError("");

    setDialogMode("edit");

  };

  const closeDialog = () => {

    if (saving) return;

    setDialogMode(null);

    setDialogError("");

  };

  const handleTextFieldChange = (

    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>

  ) => {

    const { name, value } = event.target;

    setFormData((previous) => ({

      ...previous,

      [name]: value,

    }));

    setDialogError("");

  };

  const handleSelectChange = (

    event: SelectChangeEvent<string>

  ) => {

    const { name, value } = event.target;

    if (!name) return;

    setFormData((previous) => ({

      ...previous,

      [name]: value,

    }));

    setDialogError("");

  };

  const validateForm = () => {

    if (!formData.holidayName.trim()) {

      return "Please enter a holiday name.";

    }

    if (!formData.holidayDate) {

      return "Please choose a holiday date.";

    }

    if (!["Public", "Company"].includes(formData.holidayType)) {

      return "Please select a holiday type.";

    }

    if (

      !/^\d{4}-\d{4}$/.test(formData.companyYear.trim())

    ) {

      return "Company year must be in YYYY-YYYY format.";

    }

    return "";

  };

  const handleSaveHoliday = async (

    event: FormEvent<HTMLFormElement>

  ) => {

    event.preventDefault();

    if (saving || !dialogMode) return;

    const validationError = validateForm();

    if (validationError) {

      setDialogError(validationError);

      return;

    }

    if (

      dialogMode === "edit" &&

      !selectedHoliday

    ) {

      setDialogError("No holiday was selected.");

      return;

    }

    setSaving(true);

    setDialogError("");

    const editingId = selectedHoliday?._id;

    const isEditing = dialogMode === "edit";

    const payload = {

      holidayName: formData.holidayName.trim(),

      holidayDate: formData.holidayDate,

      holidayType: formData.holidayType,

      companyYear: formData.companyYear.trim(),

      description: formData.description.trim(),

      status: formData.status,

    };

    try {

      const response = await api.post<

        ApiResponse<HolidayData>

      >(

        isEditing

          ? "/holidays/update"

          : "/holidays/create",

        isEditing

          ? { _id: editingId, ...payload }

          : payload

      );

      if (response.data.success === false) {

        throw new Error(

          response.data.message ||

            "Unable to save holiday."

        );

      }

      setDialogMode(null);

      showToast(

        "success",

        response.data.message ||

          (isEditing

            ? "Holiday updated successfully."

            : "Holiday created successfully.")

      );

      const refreshed = await loadHolidays();

      if (isEditing && refreshed && editingId) {

        const updated = refreshed.find(

          (item) => item._id === editingId

        );

        if (updated) {

          setSelectedHoliday(updated);

        }

      }

    } catch (error) {

      setDialogError(

        getErrorMessage(

          error,

          "Unable to save holiday."

        )

      );

    } finally {

      setSaving(false);

    }

  };

  const handleDeleteHoliday = async (

    holiday: HolidayData

  ) => {

    if (deleting) return;

    const confirmed = window.confirm(

      `Are you sure you want to delete "${holiday.holidayName}"?`

    );

    if (!confirmed) return;

    setDeleting(true);

    try {

      const response = await api.post<

        ApiResponse<unknown>

      >("/holidays/delete", {

        _id: holiday._id,

      });

      if (response.data.success === false) {

        throw new Error(

          response.data.message ||

            "Unable to delete holiday."

        );

      }

      setSelectedHoliday(null);

      showToast(

        "success",

        response.data.message ||

          "Holiday deleted successfully."

      );

      await loadHolidays();

    } catch (error) {

      showToast(

        "error",

        getErrorMessage(

          error,

          "Unable to delete holiday."

        )

      );

    } finally {

      setDeleting(false);

    }

  };

  const upcomingCount = holidays.filter(
    (holiday) => getHolidayDateStatus(holiday) === "Upcoming"
  ).length;

  const completedCount = holidays.filter(
    (holiday) => getHolidayDateStatus(holiday) === "Completed"
  ).length;

  return (

    <Box className="holiday-page">

      <Snackbar

        open={Boolean(toast)}

        autoHideDuration={4000}

        onClose={() => setToast(null)}

        anchorOrigin={{

          vertical: "top",

          horizontal: "right",

        }}

      >

        {toast ? (

          <Alert

            severity={toast.type}

            variant="filled"

            onClose={() => setToast(null)}

          >

            {toast.text}

          </Alert>

        ) : undefined}

      </Snackbar>

      {selectedHoliday ? (

        <>

          <Button

            className="holiday-back-button"

            startIcon={<ArrowLeft size={17} />}

            onClick={() => setSelectedHoliday(null)}

          >

            Back to Holidays

          </Button>

          <Box className="holiday-page-header holiday-details-page-header">

            <Box className="holiday-page-heading">

              <Box className="holiday-page-icon">

                <CalendarDays size={23} />

              </Box>

              <Box>

                <Typography component="h2" className="holiday-page-title">

                  Holiday Details

                </Typography>

                <Typography className="holiday-page-subtitle">

                  View and manage holiday information.

                </Typography>

              </Box>

            </Box>

            <Box className="holiday-detail-actions">

              <Button

                className="holiday-edit-btn"

                startIcon={<Pencil size={16} />}

                onClick={() => openEditModal(selectedHoliday)}

              >

                Edit

              </Button>

              <Button

                className="holiday-delete-btn"

                startIcon={

                  deleting ? (

                    <CircularProgress size={16} color="inherit" />

                  ) : (

                    <Trash2 size={16} />

                  )

                }

                disabled={deleting}

                onClick={() => void handleDeleteHoliday(selectedHoliday)}

              >

                Delete

              </Button>

            </Box>

          </Box>

          <Box className="holiday-details-card holiday-details-modern">

            <HolidayHero holiday={selectedHoliday} />

            <Box className="holiday-details-information">

              <Box className="holiday-details-section-heading">

                <Box className="holiday-details-section-symbol">

                  <FileText size={23} />

                </Box>

                <Box>

                  <Typography component="h3">Holiday Information</Typography>

                  <Typography className="holiday-section-subtitle">

                    Complete details for the selected holiday.

                  </Typography>

                </Box>

              </Box>

              <Box className="holiday-information-grid">

                <HolidayInfoItem

                  icon={<CalendarDays size={22} />}

                  label="Holiday Name"

                  value={selectedHoliday.holidayName}

                />

                <HolidayInfoItem

                  icon={<CalendarCheck2 size={22} />}

                  label="Holiday Date"

                  value={formatDate(selectedHoliday.holidayDate)}

                />

                <HolidayInfoItem

                  icon={<Tag size={22} />}

                  label="Holiday Type"

                  value={selectedHoliday.holidayType}

                />

                <HolidayInfoItem

                  icon={<Building2 size={22} />}

                  label="Company Year"

                  value={selectedHoliday.companyYear}

                />

                <HolidayInfoItem

                  icon={<FileText size={22} />}

                  label="Description"

                  value={selectedHoliday.description || "No description provided."}

                  full

                  description

                />

                <HolidayInfoItem

                  icon={<CalendarCheck2 size={22} />}

                  label="Date Status"

                  value={getHolidayDateStatus(selectedHoliday)}

                />

                <HolidayInfoItem

                  icon={<CircleCheck size={22} />}

                  label="Status"

                  value={selectedHoliday.status}

                  status={selectedHoliday.status}

                />

              </Box>

            </Box>

          </Box>

        </>

      ) : (

        <>

          <Box className="holiday-page-header">

            <Box className="holiday-page-heading">

              <Box className="holiday-page-icon">

                <CalendarDays size={23} />

              </Box>

              <Box>

                <Typography

                  component="h2"

                  className="holiday-page-title"

                >

                  Company Holidays

                </Typography>

                <Typography className="holiday-page-subtitle">

                  Manage public and company holidays

                  for your employees.

                </Typography>

              </Box>

            </Box>

            <Button

              className="create-holiday-btn"

              variant="contained"

              startIcon={<Plus size={18} />}

              onClick={openCreateModal}

            >

              Create Holiday

            </Button>

          </Box>

          <Box className="holiday-summary">

            <Box className="holiday-summary-icon">

              <EventAvailableIcon />

            </Box>

            <Box>

              <Typography className="holiday-summary-label">

                Total Holidays

              </Typography>

              <Typography className="holiday-summary-value">

                {loading || loadError

                  ? "—"

                  : holidays.length}

              </Typography>

            </Box>

            <Box className="holiday-summary-extra">

              <Typography>

                {loading || loadError

                  ? "Holiday status unavailable"

                  : `${upcomingCount} upcoming · ${completedCount} completed`}

              </Typography>

            </Box>

          </Box>

          {loadError && (

            <Alert

              severity="error"

              className="holiday-load-error"

              action={

                <Button

                  size="small"

                  color="inherit"

                  startIcon={

                    <RefreshCw size={15} />

                  }

                  onClick={() => void loadHolidays()}

                >

                  Retry

                </Button>

              }

            >

              {loadError}

            </Alert>

          )}

          <Box className="holiday-table-card">

            <Box className="holiday-table-title">

              <Box>

                <Typography component="h3">

                  Holiday List

                </Typography>

                <Typography className="holiday-section-subtitle">

                  All configured holidays

                </Typography>

              </Box>

            </Box>

            {loading ? (

              <Box className="holiday-empty-panel">

                <CircularProgress

                  size={26}

                  sx={{ color: "#087b4d" }}

                />

                <Typography>

                  Loading holidays...

                </Typography>

              </Box>

            ) : loadError ? (

              <Box className="holiday-empty-panel">

                <Typography>

                  Unable to display holidays.

                </Typography>

              </Box>

            ) : holidays.length === 0 ? (

              <Box className="holiday-empty-panel">

                <CalendarDays size={31} />

                <Typography>

                  No holidays created yet.

                </Typography>

              </Box>

            ) : (

              <>

                <Box className="holiday-table-wrapper">

                  <table className="holiday-table">

                    <thead>

                      <tr>

                        <th>Holiday Name</th>

                        <th>Holiday Date</th>

                        <th>Holiday Type</th>

                        <th>Company Year</th>

                        <th>Date Status</th>

                        <th>Actions</th>

                      </tr>

                    </thead>

                    <tbody>

                      {holidays.map((holiday) => (

                        <tr key={holiday._id}>

                          <td className="holiday-name">

                            {holiday.holidayName}

                          </td>

                          <td>

                            {formatDate(

                              holiday.holidayDate

                            )}

                          </td>

                          <td>{holiday.holidayType}</td>

                          <td>{holiday.companyYear}</td>

                          <td>

                            <HolidayDateStatusChip holiday={holiday} />

                          </td>

                          <td>

                            <Tooltip title="View holiday">

                              <IconButton

                                className="holiday-view-button"

                                aria-label={`View ${holiday.holidayName}`}

                                onClick={() =>

                                  setSelectedHoliday(holiday)

                                }

                              >

                                <Eye size={19} />

                              </IconButton>

                            </Tooltip>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </Box>

                <Box className="holiday-mobile-list">

                  {holidays.map((holiday) => (

                    <Box

                      key={holiday._id}

                      className="holiday-mobile-card"

                    >

                      <Box className="holiday-mobile-card-header">

                        <Box>

                          <Typography className="holiday-mobile-name">

                            {holiday.holidayName}

                          </Typography>

                          <Typography className="holiday-mobile-type">

                            {holiday.holidayType}

                          </Typography>

                        </Box>

                        <HolidayDateStatusChip holiday={holiday} />

                      </Box>

                      <Box className="holiday-mobile-grid">

                        <Box>

                          <span>Holiday Date</span>

                          <strong>

                            {formatDate(

                              holiday.holidayDate

                            )}

                          </strong>

                        </Box>

                        <Box>

                          <span>Company Year</span>

                          <strong>

                            {holiday.companyYear}

                          </strong>

                        </Box>

                      </Box>

                      <Button

                        className="holiday-mobile-view"

                        startIcon={<Eye size={16} />}

                        onClick={() =>

                          setSelectedHoliday(holiday)

                        }

                      >

                        View Details

                      </Button>

                    </Box>

                  ))}

                </Box>

              </>

            )}

          </Box>

        </>

      )}

      <HolidayModal

        open={dialogMode !== null}

        title={

          dialogMode === "edit"

            ? "Edit Holiday"

            : "Create Holiday"

        }

        formData={formData}

        error={dialogError}

        saving={saving}

        onTextFieldChange={handleTextFieldChange}

        onSelectChange={handleSelectChange}

        onSubmit={handleSaveHoliday}

        onCancel={closeDialog}

      />

    </Box>

  );

}

function EventAvailableIcon() {

  return <CalendarDays size={23} />;

}

function HolidayStatusChip({ status }: { status: HolidayStatus }) {
  return (
    <Chip
      label={status}
      size="small"
      className={`holiday-status ${status === "Active" ? "active" : "inactive"}`}
    />
  );
}

function HolidayDateStatusChip({ holiday }: { holiday: HolidayData }) {
  const dateStatus = getHolidayDateStatus(holiday);

  return (
    <Chip
      size="small"
      label={dateStatus}
      className={`holiday-date-status holiday-date-status--${dateStatus.toLowerCase()}`}
    />
  );
}

/* =========================================

   DYNAMIC HOLIDAY HERO

========================================= */

function getHolidayArtwork(name: string) {

  const normalized = name.toLowerCase();

  if (/gandhi/.test(normalized)) return { icon: "🕊️", category: "REMEMBRANCE", theme: "heritage" };

  if (/diwali|deepavali/.test(normalized)) return { icon: "🪔", category: "FESTIVAL OF LIGHTS", theme: "gold" };

  if (/pongal|sankranti/.test(normalized)) return { icon: "🌾", category: "HARVEST FESTIVAL", theme: "harvest" };

  if (/christmas/.test(normalized)) return { icon: "🎄", category: "FESTIVAL CELEBRATION", theme: "winter" };

  if (/ayudha|ayutha|pooja|puja|navaratri|dussehra/.test(normalized)) return { icon: "🌼", category: "FESTIVAL CELEBRATION", theme: "gold" };

  if (/independence|republic/.test(normalized)) return { icon: "🇮🇳", category: "NATIONAL HOLIDAY", theme: "heritage" };

  if (/new year/.test(normalized)) return { icon: "🎉", category: "NEW BEGINNINGS", theme: "winter" };

  if (/ramzan|eid|bakrid/.test(normalized)) return { icon: "🌙", category: "FESTIVAL CELEBRATION", theme: "winter" };

  return { icon: "✨", category: "COMPANY CELEBRATION", theme: "green" };

}

function HolidayHero({ holiday }: { holiday: HolidayData }) {

  const artwork = getHolidayArtwork(holiday.holidayName);

  return (

    <Box className={`holiday-hero holiday-hero--${artwork.theme}`}>

      <Box className="holiday-hero-main">

        <Box className="holiday-hero-symbol" aria-hidden="true">

          {artwork.icon}

        </Box>

        <Box className="holiday-hero-text">

          <Typography className="holiday-hero-eyebrow">

            {holiday.holidayType.toUpperCase()} HOLIDAY

          </Typography>

          <Typography component="h2" className="holiday-hero-title">

            {holiday.holidayName}

          </Typography>

          <Box className="holiday-hero-meta">

            <span className="holiday-hero-date">

              <CalendarDays size={16} />

              {formatDate(holiday.holidayDate)}

            </span>

            <span className="holiday-hero-type">{holiday.holidayType}</span>

            <span className={`holiday-hero-status ${holiday.status.toLowerCase()}`}>

              <span aria-hidden="true" />

              {holiday.status}

            </span>

          </Box>

        </Box>

      </Box>

      <Box className="holiday-hero-art" aria-hidden="true">

        <span className="holiday-hero-art-circle">{artwork.icon}</span>

        <Typography className="holiday-hero-art-caption">

          {artwork.category}

        </Typography>

      </Box>

    </Box>

  );

}

function HolidayInfoItem({

  icon,

  label,

  value,

  full = false,

  description = false,

  status,

}: {

  icon: ReactNode;

  label: string;

  value: string;

  full?: boolean;

  description?: boolean;

  status?: HolidayStatus;

}) {

  return (

    <Box className={`holiday-information-item ${full ? "holiday-information-item--full" : ""}`}>

      <Box className="holiday-information-icon">{icon}</Box>

      <Box className="holiday-information-content">

        <span>{label}</span>

        {status ? (

          <HolidayStatusChip status={status} />

        ) : (

          <strong className={description ? "holiday-information-description" : ""}>

            {value}

          </strong>

        )}

      </Box>

    </Box>

  );

}

interface HolidayModalProps {

  open: boolean;

  title: string;

  formData: HolidayFormData;

  error: string;

  saving: boolean;

  onTextFieldChange: (

    event: ChangeEvent<

      HTMLInputElement | HTMLTextAreaElement

    >

  ) => void;

  onSelectChange: (

    event: SelectChangeEvent<string>

  ) => void;

  onSubmit: (event: FormEvent<HTMLFormElement>) => void;

  onCancel: () => void;

}

function HolidayModal({

  open,

  title,

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

        if (saving || reason === "backdropClick") {

          return;

        }

        onCancel();

      }}

      fullWidth

      maxWidth="sm"

      className="holiday-dialog"

    >

      <DialogTitle className="holiday-modal-title">

        <Box>

          <Typography component="h2">

            {title}

          </Typography>

          <Typography className="holiday-modal-subtitle">

            Enter the holiday details below.

          </Typography>

        </Box>

        <IconButton

          aria-label="Close modal"

          disabled={saving}

          onClick={onCancel}

        >

          <X size={20} />

        </IconButton>

      </DialogTitle>

      <DialogContent className="holiday-modal">

        {error && (

          <Alert

            severity="error"

            className="holiday-modal-error"

          >

            {error}

          </Alert>

        )}

        <Box

          component="form"

          id="holiday-form"

          onSubmit={onSubmit}

          className="holiday-form"

        >

          <Box className="holiday-form-group">

            <TextField

              label="Holiday Name"

              name="holidayName"

              value={formData.holidayName}

              onChange={onTextFieldChange}

              placeholder="Enter holiday name"

              fullWidth

              required

              disabled={saving}

            />

          </Box>

          <Box className="holiday-form-grid">

            <Box className="holiday-form-group">

              <TextField

                label="Holiday Date"

                name="holidayDate"

                type="date"

                value={formData.holidayDate}

                onChange={onTextFieldChange}

                fullWidth

                required

                disabled={saving}

                slotProps={{

                  inputLabel: { shrink: true },

                }}

              />

            </Box>

            <Box className="holiday-form-group">

              <FormControl fullWidth>

                <Select

                  name="holidayType"

                  value={formData.holidayType}

                  onChange={onSelectChange}

                  displayEmpty

                  required

                  disabled={saving}

                >

                  <MenuItem value="" disabled>

                    Select Holiday Type

                  </MenuItem>

                  <MenuItem value="Public">

                    Public

                  </MenuItem>

                  <MenuItem value="Company">

                    Company

                  </MenuItem>

                </Select>

              </FormControl>

            </Box>

            <Box className="holiday-form-group">

              <TextField

                label="Company Year"

                name="companyYear"

                value={formData.companyYear}

                onChange={onTextFieldChange}

                placeholder="2026-2027"

                fullWidth

                required

                disabled={saving}

                slotProps={{

                  htmlInput: {

                    pattern: "[0-9]{4}-[0-9]{4}",

                  },

                }}

              />

            </Box>

            <Box className="holiday-form-group">

              <FormControl fullWidth>

                <Select

                  name="status"

                  value={formData.status}

                  onChange={onSelectChange}

                  disabled={saving}

                >

                  <MenuItem value="Active">

                    Active

                  </MenuItem>

                  <MenuItem value="Inactive">

                    Inactive

                  </MenuItem>

                </Select>

              </FormControl>

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

              minRows={3}

              fullWidth

              disabled={saving}

            />

          </Box>

        </Box>

      </DialogContent>

      <DialogActions className="holiday-modal-actions">

        <Button

          type="button"

          variant="outlined"

          className="holiday-cancel-button"

          onClick={onCancel}

          disabled={saving}

        >

          Cancel

        </Button>

        <Button

          type="submit"

          form="holiday-form"

          variant="contained"

          className="holiday-save-button"

          disabled={saving}

          startIcon={

            saving ? (

              <CircularProgress

                size={16}

                color="inherit"

              />

            ) : undefined

          }

        >

          {saving ? "Saving..." : "Save Holiday"}

        </Button>

      </DialogActions>

    </Dialog>

  );

}
