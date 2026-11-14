
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import api from "../../api/axiosInstance";

import type {
  AchievementEmployee,
  MonthlyAchievement,
} from "./MonthlyAchievementCard";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (value: MonthlyAchievement) => void;
  employees: AchievementEmployee[];
  month: number;
  year: number;
  existing: MonthlyAchievement | null;
};

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
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [readingPhoto, setReadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      ? existing.employee.photo
      : null;
  const photoPreview =
    uploadedPhoto || selectedEmployee?.photo || existingPhoto || null;

  const monthLabel = new Date(
    year,
    month - 1,
    1
  ).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Choose a PNG, JPG, or WebP image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be 10 MB or smaller.");
      return;
    }

    setReadingPhoto(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError("Unable to read the selected image.");
      } else {
        setUploadedPhoto(reader.result);
        setPhotoName(file.name);
        setError("");
      }
      setReadingPhoto(false);
    };
    reader.onerror = () => {
      setError("Unable to read the selected image.");
      setReadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
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
        ...(uploadedPhoto ? { photo: uploadedPhoto } : {}),
      });

      if (!response.data.success || !response.data.data) {
        throw new Error(
          response.data.message || "Unable to save achievement"
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
          (err instanceof Error ? err.message : "Save failed")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving || readingPhoto ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle
        sx={{
          backgroundColor: "#087b4d",
          color: "#ffffff",
          fontWeight: 700,
        }}
      >
        🏆 Declare Monthly Achievement
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 3 }}>
          <TextField
            label="Achievement Month"
            value={monthLabel}
            fullWidth
            slotProps={{
              input: { readOnly: true },
            }}
          />

          <TextField
            select
            label="Select Employee"
            value={userId}
            onChange={(event) => {
              const nextUserId = event.target.value;
              if (nextUserId !== userId) {
                setUploadedPhoto(null);
                setPhotoName("");
                setError("");
              }
              setUserId(nextUserId);
            }}
            fullWidth
            required
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

          <Box>
            <Button
              component="label"
              variant="outlined"
              disabled={saving || readingPhoto || !userId}
              sx={{ color: "#087b4d", borderColor: "#087b4d" }}
            >
              {readingPhoto
                ? "Reading image..."
                : photoName || "Upload Employee Image"}
              <input
                hidden
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handlePhotoChange}
              />
            </Button>
            <Typography
              variant="caption"
              sx={{ mt: 0.5, display: "block" }}
            >
              PNG, JPG, or WebP · Max 10 MB
            </Typography>
            {photoPreview && (
              <Box
                component="img"
                src={photoPreview}
                alt={`Photo of ${selectedEmployee?.name || "selected employee"}`}
                sx={{
                  display: "block",
                  width: 120,
                  height: 120,
                  mt: 1.5,
                  borderRadius: 1,
                  border: "1px solid #d5dbe1",
                  backgroundColor: "#f8fafc",
                  objectFit: "contain",
                }}
              />
            )}
          </Box>

          <TextField
            label="Reason for Achievement"
            placeholder="Enter why this employee was selected"
            value={reason}
            onChange={(event) =>
              setReason(event.target.value)
            }
            multiline
            rows={4}
            fullWidth
            required
            slotProps={{
              htmlInput: { maxLength: 500 },
            }}
          />

          {error && (
            <Alert severity="error">{error}</Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={saving || readingPhoto}
          sx={{
            color: "#087b4d",
            borderColor: "#087b4d",
            backgroundColor: "#ffffff",
            textTransform: "none",
            fontWeight: 600,
            "&:hover": {
              borderColor: "#087b4d",
              
            },
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          disabled={
            saving ||
            readingPhoto ||
            !userId ||
            !reason.trim()
          }
          onClick={() => void handleSave()}
          sx={{
            backgroundColor: "#087b4d",
            textTransform: "none",
            fontWeight: 600,
            "&:hover": {
              backgroundColor: "#06613d",
            },
          }}
        >
          {saving
            ? "Saving..."
            : existing
              ? "Update Achievement"
              : "Declare Achievement"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
