
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";

import {
  Alert,
  Box,
  Button,
  Dialog,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import {
  CalendarDays,
  UserRound,
  CloudUpload,
  Upload,
  Trash2,
  X,
  Award,
  CircleCheck,
  ImagePlus,
} from "lucide-react";

import api from "../../api/axiosInstance";

import type {
  AchievementEmployee,
  MonthlyAchievement,
} from "./MonthlyAchievementCard";

import "./DeclareAchievementModal.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (value: MonthlyAchievement) => void;
  employees: AchievementEmployee[];
  month: number;
  year: number;
  existing: MonthlyAchievement | null;
};

/* ==========================================
   TROPHY ILLUSTRATION
========================================== */

function TrophyIllustration() {
  return (
    <svg
      className="achievement-trophy"
      viewBox="0 0 240 220"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="trophyGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff7ad" />
          <stop offset="45%" stopColor="#ffdc43" />
          <stop offset="100%" stopColor="#d68b08" />
        </linearGradient>

        <linearGradient id="trophyBase" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#37d88b" />
          <stop offset="100%" stopColor="#034b36" />
        </linearGradient>

        <radialGradient id="trophyGlow">
          <stop offset="0%" stopColor="#ffe76b" stopOpacity=".35" />
          <stop offset="100%" stopColor="#ffe76b" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="120" cy="95" r="95" fill="url(#trophyGlow)" />

      {/* Platform */}
      <path
        d="M34 180V193C34 216 206 216 206 193V180"
        fill="#034b36"
      />

      <ellipse
        cx="120"
        cy="180"
        rx="86"
        ry="17"
        fill="url(#trophyBase)"
      />

      {/* Trophy handles */}
      <path
        d="M76 51H49V69C49 93 66 108 86 108"
        stroke="url(#trophyGold)"
        strokeWidth="10"
        strokeLinecap="round"
      />

      <path
        d="M164 51H191V69C191 93 174 108 154 108"
        stroke="url(#trophyGold)"
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* Trophy cup */}
      <path
        d="M76 36H164V77C164 110 146 131 120 131C94 131 76 110 76 77V36Z"
        fill="url(#trophyGold)"
        stroke="#fff1a3"
        strokeWidth="2"
      />

      <rect
        x="69"
        y="30"
        width="102"
        height="12"
        rx="6"
        fill="url(#trophyGold)"
      />

      {/* Star */}
      <path
        d="M120 57L128 73L146 76L133 89L136 107L120 98L104 107L107 89L94 76L112 73Z"
        fill="#fff8c7"
        stroke="#dba320"
        strokeWidth="1.5"
      />

      {/* Trophy stem */}
      <rect
        x="111"
        y="125"
        width="18"
        height="30"
        rx="4"
        fill="url(#trophyGold)"
      />

      <path
        d="M94 158H146L154 170H86L94 158Z"
        fill="url(#trophyGold)"
      />

      <rect
        x="81"
        y="169"
        width="78"
        height="10"
        rx="3"
        fill="#143d31"
      />

      {/* Golden leaves */}
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <g key={item}>
          <ellipse
            cx={31 + item * 4}
            cy={78 + item * 15}
            rx="5"
            ry="12"
            transform={`rotate(-35 ${31 + item * 4} ${78 + item * 15})`}
            fill="#f8d94e"
          />

          <ellipse
            cx={209 - item * 4}
            cy={78 + item * 15}
            rx="5"
            ry="12"
            transform={`rotate(35 ${209 - item * 4} ${78 + item * 15})`}
            fill="#f8d94e"
          />
        </g>
      ))}

      {/* Sparkles */}
      <path
        d="M120 4V20M112 12H128M48 21V35M41 28H55M188 17V31M181 24H195"
        stroke="#fff3a0"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ==========================================
   ACHIEVEMENT MODAL
========================================== */

export default function DeclareAchievementModal({
  open,
  onClose,
  onSaved,
  employees,
  month,
  year,
  existing,
}: Props) {
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");

  const [uploadedPhoto, setUploadedPhoto] =
    useState<string | null>(null);

  const [photoName, setPhotoName] = useState("");
  const [readingPhoto, setReadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const busy = saving || readingPhoto;

  useEffect(() => {
    if (!open) return;

    setUserId(existing?.employee?.user_id || "");
    setReason(existing?.achievement || "");
    setUploadedPhoto(null);
    setPhotoName("");
    setReadingPhoto(false);
    setError("");
  }, [open, existing, month, year]);

  const selectedEmployee = employees.find(
    (employee) => employee.user_id === userId
  );

  const existingPhoto =
    existing?.employee?.user_id === userId
      ? existing?.employee?.photo
      : null;

  const photoPreview =
    uploadedPhoto ||
    existingPhoto ||
    selectedEmployee?.photo ||
    null;

  const monthLabel = new Date(
    year,
    month - 1,
    1
  ).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  /* ==========================================
     IMAGE UPLOAD
  ========================================== */

  const handlePhotoChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file || busy) return;

    if (
      !["image/png", "image/jpeg", "image/webp"].includes(
        file.type
      )
    ) {
      setError("Choose a PNG, JPG, or WebP image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be 10 MB or smaller.");
      return;
    }

    setReadingPhoto(true);
    setError("");

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError("Unable to read the selected image.");
      } else {
        setUploadedPhoto(reader.result);
        setPhotoName(file.name);
      }

      setReadingPhoto(false);
    };

    reader.onerror = () => {
      setError("Unable to read the selected image.");
      setReadingPhoto(false);
    };

    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setUploadedPhoto(null);
    setPhotoName("");
    setError("");
  };

  /* ==========================================
     SAVE ACHIEVEMENT
  ========================================== */

  const handleSave = async () => {
    if (busy) return;

    if (!userId || !reason.trim()) {
      setError(
        "Please select an employee and enter the reason."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await api.post<{
        success: boolean;
        message?: string;
        data: MonthlyAchievement;
      }>("/monthly-achievement", {
        user_id: userId,
        month,
        year,
        achievement: reason.trim(),
        ...(uploadedPhoto
          ? { photo: uploadedPhoto }
          : {}),
      });

      if (!response.data.success || !response.data.data) {
        throw new Error(
          response.data.message ||
            "Unable to save achievement."
        );
      }

      onSaved(response.data.data);
      onClose();
    } catch (err: unknown) {
      const apiError = err as {
        response?: {
          data?: { message?: string };
        };
      };

      setError(
        apiError.response?.data?.message ||
          (err instanceof Error
            ? err.message
            : "Save failed.")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      maxWidth={false}
      fullWidth
      aria-labelledby="achievement-modal-title"
      className="achievement-dialog"
      sx={{
        "& .MuiDialog-paper": {
          width: "700px",
          maxWidth: "calc(100% - 32px)",
          maxHeight: "calc(100dvh - 40px)",
          borderRadius: "18px",
          margin: "16px",
          overflow: "hidden",
          background: "#ffffff",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.15)",
        },
      }}
    >
      <div className="achievement-modal-layout">

        {/* LEFT SIDE PANEL */}

        <aside className="achievement-side-panel">
          <div className="achievement-side-decoration" />

          <TrophyIllustration />

          <div className="achievement-side-text">
            <h2>
              Recognize &amp;
              <br />
              Record
              <br />
              Achievements
            </h2>

            <div className="achievement-gold-line" />

            <p>
              Celebrate exceptional performance and
              recognize employee achievements.
            </p>
          </div>
        </aside>

        {/* RIGHT SIDE PANEL */}

        <div className="achievement-main-panel">

          {/* HEADER */}

          <header className="achievement-modal-header">
            <div className="achievement-header-icon">
              <Award size={28} />
            </div>

            <div className="achievement-header-text">
              <h2 id="achievement-modal-title">
                Declare Monthly Achievement
              </h2>

              <p>
                Add employee achievement for a selected month.
              </p>
            </div>

            <IconButton
              className="achievement-close-button"
              onClick={onClose}
              disabled={busy}
              aria-label="Close achievement dialog"
            >
              <X size={21} />
            </IconButton>
          </header>

          {/* FORM CONTENT */}

          <div className="achievement-modal-content">

            <div className="achievement-field-grid">

              {/* ACHIEVEMENT MONTH */}

              <div className="achievement-field">
                <div className="achievement-field-icon">
                  <CalendarDays size={21} />
                </div>

                <div className="achievement-field-control">
                  <label htmlFor="achievement-month">
                    Achievement Month
                  </label>

                  <TextField
                    id="achievement-month"
                    value={monthLabel}
                    fullWidth
                    size="small"
                    slotProps={{
                      input: {
                        readOnly: true,
                      },
                    }}
                  />
                </div>
              </div>

              {/* EMPLOYEE SELECTION */}

              <div className="achievement-field">
                <div className="achievement-field-icon">
                  <UserRound size={21} />
                </div>

                <div className="achievement-field-control">
                  <label htmlFor="achievement-employee">
                    Select Employee <span>*</span>
                  </label>

                  <TextField
                    id="achievement-employee"
                    select
                    fullWidth
                    size="small"
                    required
                    disabled={busy}
                    value={userId}
                    slotProps={{
                      select: {
                        displayEmpty: true,
                      },
                    }}
                    onChange={(event) => {
                      const nextUserId = event.target.value;

                      if (nextUserId !== userId) {
                        setUploadedPhoto(null);
                        setPhotoName("");
                        setError("");
                      }

                      setUserId(nextUserId);
                    }}
                  >
                    <MenuItem value="">
                      Select Employee
                    </MenuItem>

                    {employees.map((employee) => (
                      <MenuItem
                        key={employee.user_id}
                        value={employee.user_id}
                      >
                        {employee.name} ({employee.employeeId})
                      </MenuItem>
                    ))}
                  </TextField>
                </div>
              </div>
            </div>

            {/* IMAGE UPLOAD SECTION */}

            <div className="achievement-upload-section">

              {/* IMAGE PREVIEW */}

              <div className="achievement-preview-area">
                <div className="achievement-preview-box">
                  {photoPreview ? (
                    <>
                      <Box
                        component="img"
                        src={photoPreview}
                        alt={`Photo of ${
                          selectedEmployee?.name ||
                          "selected employee"
                        }`}
                        className="achievement-preview-image"
                      />

                      {uploadedPhoto && (
                        <IconButton
                          className="achievement-remove-image"
                          onClick={handleRemovePhoto}
                          disabled={busy}
                          aria-label="Remove uploaded image"
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      )}
                    </>
                  ) : (
                    <div className="achievement-empty-preview">
                      <ImagePlus size={38} />
                      <span>Image Preview</span>
                    </div>
                  )}
                </div>
              </div>

              {/* UPLOAD ACTION */}

              <div className="achievement-upload-action">
                <CloudUpload
                  size={43}
                  strokeWidth={1.7}
                  className="achievement-upload-icon"
                />

                <h3>Upload Employee Image</h3>

                <p>PNG, JPG, or WebP · Max 10 MB</p>

                <Button
                  component="label"
                  variant="outlined"
                  className="achievement-choose-button"
                  disabled={busy || !userId}
                  startIcon={<Upload size={17} />}
                >
                  {readingPhoto
                    ? "Reading image..."
                    : "Choose Image"}

                  <input
                    hidden
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handlePhotoChange}
                    disabled={busy || !userId}
                  />
                </Button>

                {photoName && (
                  <Typography
                    className="achievement-file-name"
                    title={photoName}
                  >
                    {photoName}
                  </Typography>
                )}
              </div>
            </div>

            {/* ACHIEVEMENT REASON */}

            <div className="achievement-reason-field">
              <label htmlFor="achievement-reason">
                Reason for Achievement <span>*</span>
              </label>

              <TextField
                id="achievement-reason"
                placeholder="Enter why this employee was selected..."
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                multiline
                rows={2}
                fullWidth
                required
                disabled={busy}
                slotProps={{
                  htmlInput: {
                    maxLength: 500,
                  },
                }}
              />

              <div className="achievement-character-count">
                {reason.length}/500
              </div>
            </div>

            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}
          </div>

          {/* FOOTER BUTTONS */}

          <footer className="achievement-modal-footer">
            <Button
              variant="outlined"
              className="achievement-cancel-button"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              className="achievement-save-button"
              disabled={
                busy ||
                !userId ||
                !reason.trim()
              }
              onClick={() => void handleSave()}
              startIcon={<CircleCheck size={19} />}
            >
              {saving
                ? "Saving..."
                : existing
                  ? "Update Achievement"
                  : "Declare Achievement"}
            </Button>
          </footer>
        </div>
      </div>
    </Dialog>
  );
}
