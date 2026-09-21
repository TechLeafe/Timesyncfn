import { useState } from "react";
import {
  ArrowLeft,
  Eye,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import "./Holiday.css";

type HolidayStatus = "Active" | "Inactive";

interface HolidayData {
  id: number;
  holidayName: string;
  holidayDate: string;
  holidayType: string;
  companyYear: string;
  description: string;
  status: HolidayStatus;
}

interface HolidayFormData {
  holidayName: string;
  holidayDate: string;
  holidayType: string;
  companyYear: string;
  description: string;
  status: HolidayStatus;
}

const initialForm: HolidayFormData = {
  holidayName: "",
  holidayDate: "",
  holidayType: "",
  companyYear: new Date().getFullYear().toString(),
  description: "",
  status: "Active",
};

export default function Holiday() {
  const [holidays, setHolidays] = useState<HolidayData[]>([
    {
      id: 1,
      holidayName: "Pongal",
      holidayDate: "2027-01-14",
      holidayType: "Public Holiday",
      companyYear: "2027",
      description: "Pongal Festival",
      status: "Active",
    },
    {
      id: 2,
      holidayName: "Republic Day",
      holidayDate: "2027-01-26",
      holidayType: "National Holiday",
      companyYear: "2027",
      description: "Republic Day",
      status: "Active",
    },
  ]);

  const [formData, setFormData] =
    useState<HolidayFormData>(initialForm);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedHoliday, setSelectedHoliday] =
    useState<HolidayData | null>(null);

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

  const handleCreateHoliday = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const newHoliday: HolidayData = {
      id: Date.now(),
      ...formData,
    };

    setHolidays((previous) => [...previous, newHoliday]);

    setFormData(initialForm);
    setShowCreateModal(false);
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

    setShowEditModal(true);
  };

  const handleUpdateHoliday = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!selectedHoliday) return;

    setHolidays((previous) =>
      previous.map((holiday) =>
        holiday.id === selectedHoliday.id
          ? {
              ...holiday,
              ...formData,
            }
          : holiday
      )
    );

    setSelectedHoliday((previous) =>
      previous
        ? {
            ...previous,
            ...formData,
          }
        : null
    );

    setShowEditModal(false);
    setFormData(initialForm);
  };

  const handleDeleteHoliday = (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this holiday?"
    );

    if (!confirmed) return;

    setHolidays((previous) =>
      previous.filter((holiday) => holiday.id !== id)
    );

    setSelectedHoliday(null);
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

  if (selectedHoliday && !showEditModal) {
    return (
      <div className="holiday-page">
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
              onClick={() =>
                handleDeleteHoliday(selectedHoliday.id)
              }
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
            submitText="Save Holiday"
            formData={formData}
            onChange={handleInputChange}
            onSubmit={handleUpdateHoliday}
            onCancel={() => {
              setShowEditModal(false);
              setFormData(initialForm);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="holiday-page">
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
              {holidays.length > 0 ? (
                holidays.map((holiday) => (
                  <tr key={holiday.id}>
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
          submitText="Save Holiday"
          formData={formData}
          onChange={handleInputChange}
          onSubmit={handleCreateHoliday}
          onCancel={() => {
            setShowCreateModal(false);
            setFormData(initialForm);
          }}
        />
      )}

      {showEditModal && (
        <HolidayModal
          title="Edit holiday"
          submitText="Save Holiday"
          formData={formData}
          onChange={handleInputChange}
          onSubmit={handleUpdateHoliday}
          onCancel={() => {
            setShowEditModal(false);
            setFormData(initialForm);
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
  onChange,
  onSubmit,
  onCancel,
}: HolidayModalProps) {
  return (
    <div className="holiday-modal-overlay">
      <div className="holiday-modal">
        <h2>{title}</h2>

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

                <option value="National Holiday">
                  National Holiday
                </option>

                <option value="Public Holiday">
                  Public Holiday
                </option>

                <option value="Festival Holiday">
                  Festival Holiday
                </option>

                <option value="Optional Holiday">
                  Optional Holiday
                </option>

                <option value="Company Holiday">
                  Company Holiday
                </option>
              </select>
            </div>

            <div className="holiday-form-group">
              <label>Company year</label>

              <input
                type="number"
                name="companyYear"
                min="2000"
                max="2100"
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