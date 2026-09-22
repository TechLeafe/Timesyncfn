import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Eye,
  Pencil,
  Plus,
  Trash2,
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

type ApiResponse<T> = { success?: boolean; message?: string; data?: T };
type Toast = { type: "success" | "error"; text: string };

/**
 * Same fiscal-year convention used on the Leave Policies page (Apr–Mar),
 * used here only to pre-fill "Company year" — it stays a free-text field
 * the user can still change (e.g. to plan next year's holidays ahead).
 */
const getCompanyYear = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  return month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
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
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: ApiResponse<unknown> } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error ? error.message : fallback;
};

export default function Holiday() {
  const [holidays, setHolidays] = useState<HolidayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [dialogError, setDialogError] = useState("");

  const [formData, setFormData] = useState<HolidayFormData>(initialForm);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<HolidayData | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadHolidays = async (): Promise<HolidayData[]> => {
    try {
      setLoading(true);
      const response = await api.post<ApiResponse<HolidayData[]>>("/holidays/list", {
        companyYear: "",
        holidayType: "",
      });
      const data = response.data.data;
      if (!Array.isArray(data)) throw new Error("Invalid holiday response.");
      setHolidays(data);
      return data;
    } catch (error) {
      setToast({ type: "error", text: getErrorMessage(error, "Unable to load holidays.") });
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHolidays();
  }, []);

  const handleInputChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreateHoliday = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setDialogError("");
    try {
      setSaving(true);
      await api.post<ApiResponse<HolidayData>>("/holidays/create", formData);
      setToast({ type: "success", text: "Holiday created successfully." });
      setShowCreateModal(false);
      setFormData(initialForm);
      await loadHolidays();
    } catch (error) {
      setDialogError(getErrorMessage(error, "Unable to create holiday."));
    } finally {
      setSaving(false);
    }
  };

  const openHolidayDetails = (holiday: HolidayData) => {
    setSelectedHoliday(holiday);
  };

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

  const handleUpdateHoliday = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!selectedHoliday) return;

    setDialogError("");
    try {
      setSaving(true);
      await api.post<ApiResponse<HolidayData>>("/holidays/update", {
        _id: selectedHoliday._id,
        ...formData,
      });
      setToast({ type: "success", text: "Holiday updated successfully." });
      setShowEditModal(false);
      setFormData(initialForm);

      const refreshed = await loadHolidays();
      const updated = refreshed.find((item) => item._id === selectedHoliday._id);
      if (updated) setSelectedHoliday(updated);
    } catch (error) {
      setDialogError(getErrorMessage(error, "Unable to update holiday."));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this holiday?"
    );

    if (!confirmed) return;

    try {
      await api.post("/holidays/delete", { _id: id });
      setSelectedHoliday(null);
      setToast({ type: "success", text: "Holiday deleted successfully." });
      await loadHolidays();
    } catch (error) {
      setToast({ type: "error", text: getErrorMessage(error, "Unable to delete holiday.") });
    }
  };

  const formatDate = (date: string) => {
    if (!date) return "-";

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const toastBanner = toast && (
    <div className={`holiday-toast holiday-toast--${toast.type}`}>{toast.text}</div>
  );

  if (selectedHoliday && !showEditModal) {
    return (
      <div className="holiday-page">
        {toastBanner}

        <button
          className="holiday-back-button"
          onClick={() => setSelectedHoliday(null)}
        >
          <ArrowLeft size={22} />
          Back to Holidays
        </button>

        <div className="holiday-details-heading">
          <div>
            <h1>{selectedHoliday.holidayName}</h1>
            <p>Company holiday details</p>
          </div>

          <div className="holiday-detail-actions">
            <button
              className="holiday-edit-btn"
              onClick={() => openEditModal(selectedHoliday)}
            >
              <Pencil size={19} />
              Edit
            </button>

            <button
              className="holiday-delete-btn"
              onClick={() => void handleDeleteHoliday(selectedHoliday._id)}
            >
              <Trash2 size={19} />
              Delete
            </button>
          </div>
        </div>

        <section className="holiday-details-card">
          <h2>Holiday information</h2>

          <div className="holiday-information-grid">
            <div className="holiday-information-item">
              <span>Holiday Name</span>
              <strong>{selectedHoliday.holidayName}</strong>
            </div>

            <div className="holiday-information-item">
              <span>Holiday Date</span>
              <strong>
                {formatDate(selectedHoliday.holidayDate)}
              </strong>
            </div>

            <div className="holiday-information-item">
              <span>Holiday Type</span>
              <strong>{selectedHoliday.holidayType}</strong>
            </div>

            <div className="holiday-information-item">
              <span>Company Year</span>
              <strong>{selectedHoliday.companyYear}</strong>
            </div>

            <div className="holiday-information-item">
              <span>Description</span>
              <strong>
                {selectedHoliday.description || "-"}
              </strong>
            </div>

            <div className="holiday-information-item">
              <span>Status</span>

              <strong
                className={`holiday-status ${
                  selectedHoliday.status === "Active"
                    ? "active"
                    : "inactive"
                }`}
              >
                {selectedHoliday.status}
              </strong>
            </div>
          </div>
        </section>

        {showEditModal && (
          <HolidayModal
            title="Edit holiday"
            submitText={saving ? "Saving..." : "Save Holiday"}
            formData={formData}
            error={dialogError}
            onChange={handleInputChange}
            onSubmit={(event) => void handleUpdateHoliday(event)}
            onCancel={() => {
              setShowEditModal(false);
              setFormData(initialForm);
              setDialogError("");
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="holiday-page">
      {toastBanner}

      <div className="holiday-page-header">
        <div>
          <h1>Holidays</h1>

          <p>
            Create and manage company holidays for employees.
          </p>
        </div>

        <button
          className="create-holiday-btn"
          onClick={() => {
            setFormData(initialForm);
            setDialogError("");
            setShowCreateModal(true);
          }}
        >
          <Plus size={22} />
          Create Holiday
        </button>
      </div>

      <section className="holiday-table-card">
        <div className="holiday-table-title">
          <h2>Company Holidays</h2>
        </div>

        <div className="holiday-table-wrapper">
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
                  <td colSpan={6} className="holiday-empty-state">
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
                      {formatDate(holiday.holidayDate)}
                    </td>

                    <td>{holiday.holidayType}</td>

                    <td>{holiday.companyYear}</td>

                    <td>
                      <span
                        className={`holiday-status ${
                          holiday.status === "Active"
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {holiday.status}
                      </span>
                    </td>

                    <td>
                      <button
                        className="holiday-view-button"
                        onClick={() =>
                          openHolidayDetails(holiday)
                        }
                        title="View holiday"
                      >
                        <Eye size={22} />
                      </button>
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
        </div>
      </section>

      {showCreateModal && (
        <HolidayModal
          title="Create holiday"
          submitText={saving ? "Saving..." : "Save Holiday"}
          formData={formData}
          error={dialogError}
          onChange={handleInputChange}
          onSubmit={(event) => void handleCreateHoliday(event)}
          onCancel={() => {
            setShowCreateModal(false);
            setFormData(initialForm);
            setDialogError("");
          }}
        />
      )}

      {showEditModal && (
        <HolidayModal
          title="Edit holiday"
          submitText={saving ? "Saving..." : "Save Holiday"}
          formData={formData}
          error={dialogError}
          onChange={handleInputChange}
          onSubmit={(event) => void handleUpdateHoliday(event)}
          onCancel={() => {
            setShowEditModal(false);
            setFormData(initialForm);
            setDialogError("");
          }}
        />
      )}
    </div>
  );
}

interface HolidayModalProps {
  title: string;
  submitText: string;
  formData: HolidayFormData;
  error: string;

  onChange: (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => void;

  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;

  onCancel: () => void;
}

function HolidayModal({
  title,
  submitText,
  formData,
  error,
  onChange,
  onSubmit,
  onCancel,
}: HolidayModalProps) {
  return (
    <div className="holiday-modal-overlay">
      <div className="holiday-modal">
        <h2>{title}</h2>

        {error && <div className="holiday-modal-error">{error}</div>}

        <form onSubmit={onSubmit}>
          <div className="holiday-form-group full-width">
            <label>Holiday name</label>

            <input
              type="text"
              name="holidayName"
              value={formData.holidayName}
              onChange={onChange}
              placeholder="Enter holiday name"
              required
            />
          </div>

          <div className="holiday-form-grid">
            <div className="holiday-form-group">
              <label>Holiday date</label>

              <input
                type="date"
                name="holidayDate"
                value={formData.holidayDate}
                onChange={onChange}
                required
              />
            </div>

            <div className="holiday-form-group">
              <label>Holiday type</label>

              <select
                name="holidayType"
                value={formData.holidayType}
                onChange={onChange}
                required
              >
                <option value="">
                  Select holiday type
                </option>

                <option value="Public">
                  Public
                </option>

                <option value="Company">
                  Company
                </option>
              </select>
            </div>

            <div className="holiday-form-group">
              <label>Company year</label>

              <input
                type="text"
                name="companyYear"
                placeholder="2026-2027"
                pattern="^[0-9]{4}-[0-9]{4}$"
                title="Format: YYYY-YYYY, e.g. 2026-2027"
                value={formData.companyYear}
                onChange={onChange}
                required
              />
            </div>

            <div className="holiday-form-group">
              <label>Status</label>

              <select
                name="status"
                value={formData.status}
                onChange={onChange}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="holiday-form-group full-width">
            <label>Description</label>

            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={onChange}
              placeholder="Enter holiday description"
            />
          </div>

          <div className="holiday-modal-actions">
            <button
              type="button"
              className="holiday-cancel-button"
              onClick={onCancel}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="holiday-save-button"
            >
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
