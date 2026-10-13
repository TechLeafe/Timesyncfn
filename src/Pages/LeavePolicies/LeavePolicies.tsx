
import { useCallback, useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import HealthAndSafetyOutlinedIcon from "@mui/icons-material/HealthAndSafetyOutlined";
import WorkHistoryOutlinedIcon from "@mui/icons-material/WorkHistoryOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import api from "../../api/axiosInstance";
import { HR, ADMIN } from "../../data/permissions";

import "./LeavePolicies.css";

/* =========================================
   TYPES
========================================= */

type LeavePolicy = {
  _id: string;
  policyName: string;
  casualLeave: number;
  sickLeave: number;
  compensatoryOff: number;
  permissionsPerMonth: number;
  createdAt?: string;
  updatedAt?: string;
};

type PolicyForm = {
  policyName: string;
  casualLeave: string;
  sickLeave: string;
  compensatoryOff: string;
  permissionsPerMonth: string;
};

type FormErrors = Partial<
  Record<keyof PolicyForm, string>
>;

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

type ToastMessage = {
  severity: "success" | "error";
  text: string;
};

/* =========================================
   CONSTANTS
========================================= */

const EMPLOYEE_POLICY_NAME = "Employee Leave";

const emptyForm: PolicyForm = {
  policyName: EMPLOYEE_POLICY_NAME,
  casualLeave: "",
  sickLeave: "",
  compensatoryOff: "",
  permissionsPerMonth: "",
};

const numericFields: (keyof PolicyForm)[] = [
  "casualLeave",
  "sickLeave",
  "compensatoryOff",
  "permissionsPerMonth",
];

/* =========================================
   HELPERS
========================================= */

export const getBusinessYear = (
  date = new Date()
): string => {
  const year = date.getFullYear();

  return date.getMonth() >= 3
    ? `${year}-${year + 1}`
    : `${year - 1}-${year}`;
};

const getUserType = (): number | null => {
  try {
    const stored = localStorage.getItem("loggedInUser");

    if (!stored) return null;

    const parsed: unknown = JSON.parse(stored);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("userType" in parsed)
    ) {
      return null;
    }

    const value = Number(parsed.userType);

    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
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
          data?: ApiResponse<unknown>;
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return error instanceof Error
    ? error.message
    : fallback;
};

const formatCount = (
  value: number | null | undefined
): number => {
  const result = Number(value ?? 0);

  return Number.isFinite(result)
    ? Math.max(0, result)
    : 0;
};

const isEmployeeLeavePolicy = (
  policy: LeavePolicy
): boolean =>
  policy.policyName.trim().toLowerCase() ===
  EMPLOYEE_POLICY_NAME.toLowerCase();

/* =========================================
   COMPONENT
========================================= */

const LeavePolicies = () => {
  const userType = getUserType();

  const canManage =
    userType === HR || userType === ADMIN;

  const [policies, setPolicies] = useState<
    LeavePolicy[]
  >([]);

  const [selectedPolicy, setSelectedPolicy] =
    useState<LeavePolicy | null>(null);

  const [form, setForm] = useState<PolicyForm>({
    ...emptyForm,
  });

  const [fieldErrors, setFieldErrors] =
    useState<FormErrors>({});

  const [dialogError, setDialogError] = useState("");
  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);

  const [toast, setToast] =
    useState<ToastMessage | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [loadError, setLoadError] = useState("");

  const businessYear = getBusinessYear();

  /* =========================================
     FETCH POLICIES
  ========================================= */

  const loadPolicies = useCallback(
    async (): Promise<LeavePolicy[] | null> => {
      setLoading(true);
      setLoadError("");

      try {
        const response = await api.post<
          ApiResponse<LeavePolicy[]>
        >("/leaves/list", {});

        if (response.data.success === false) {
          throw new Error(
            response.data.message ||
              "Unable to load leave policies."
          );
        }

        const data = response.data.data;

        if (!Array.isArray(data)) {
          throw new Error(
            "Invalid leave policy response."
          );
        }

        setPolicies(data);

        // Directly select Employee Leave.
        // The listing page is no longer displayed.
        const employeeLeavePolicy = data.find(
          isEmployeeLeavePolicy
        );

        setSelectedPolicy(
          employeeLeavePolicy ?? null
        );

        return data;
      } catch (error) {
        setPolicies([]);
        setSelectedPolicy(null);

        setLoadError(
          getErrorMessage(
            error,
            "Unable to load leave policies."
          )
        );

        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadPolicies();
  }, [loadPolicies]);

  /* =========================================
     CREATE POLICY
  ========================================= */

  const openCreate = () => {
    // Preserve existing one-policy limit.
    if (
      !canManage ||
      policies.length > 0 ||
      loading
    ) {
      return;
    }

    setEditingId(null);
    setForm({ ...emptyForm });
    setFieldErrors({});
    setDialogError("");
    setDialogOpen(true);
  };

  /* =========================================
     EDIT POLICY
  ========================================= */

  const openEdit = (policy: LeavePolicy) => {
    if (!canManage) return;

    setEditingId(policy._id);

    setForm({
      policyName: policy.policyName,
      casualLeave: String(policy.casualLeave),
      sickLeave: String(policy.sickLeave),
      compensatoryOff: String(
        policy.compensatoryOff
      ),
      permissionsPerMonth: String(
        policy.permissionsPerMonth
      ),
    });

    setFieldErrors({});
    setDialogError("");
    setDialogOpen(true);
  };

  /* =========================================
     CLOSE DIALOG
  ========================================= */

  const closeDialog = () => {
    if (saving) return;

    setDialogOpen(false);
    setDialogError("");
    setFieldErrors({});
  };

  /* =========================================
     UPDATE FORM FIELDS
  ========================================= */

  const updateField = (
    field: keyof PolicyForm,
    value: string
  ) => {
    const nextValue = numericFields.includes(field)
      ? value.replace(/[^0-9]/g, "")
      : value;

    setForm((current) => ({
      ...current,
      [field]: nextValue,
    }));

    setFieldErrors((current) => ({
      ...current,
      [field]: undefined,
    }));

    setDialogError("");
  };

  /* =========================================
     VALIDATE FORM
  ========================================= */

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};

    if (!form.policyName.trim()) {
      errors.policyName =
        "Policy name is required.";
    }

    if (!form.casualLeave.trim()) {
      errors.casualLeave =
        "Casual leave days are required.";
    }

    if (!form.sickLeave.trim()) {
      errors.sickLeave =
        "Sick leave days are required.";
    }

    if (!form.compensatoryOff.trim()) {
      errors.compensatoryOff =
        "Compensatory off days are required.";
    }

    if (!form.permissionsPerMonth.trim()) {
      errors.permissionsPerMonth =
        "Permissions per month is required.";
    }

    return errors;
  };

  /* =========================================
     SAVE POLICY
  ========================================= */

  const savePolicy = async () => {
    if (!canManage || saving) return;

    const errors = validateForm();

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setDialogError("");
    setSaving(true);

    const currentEditingId = editingId;

    const payload = {
      policyName: form.policyName.trim(),
      businessYear: getBusinessYear(),
      casualLeave: Number(form.casualLeave),
      sickLeave: Number(form.sickLeave),
      compensatoryOff: Number(
        form.compensatoryOff
      ),
      permissionsPerMonth: Number(
        form.permissionsPerMonth
      ),
    };

    try {
      if (currentEditingId) {
        const response = await api.post<
          ApiResponse<LeavePolicy>
        >("/leaves/update", {
          _id: currentEditingId,
          ...payload,
        });

        if (response.data.success === false) {
          throw new Error(
            response.data.message ||
              "Unable to update leave policy."
          );
        }
      } else {
        const response = await api.post<
          ApiResponse<LeavePolicy>
        >("/leaves/create", payload);

        if (response.data.success === false) {
          throw new Error(
            response.data.message ||
              "Unable to create leave policy."
          );
        }
      }

      // Reload policy and its updated entitlements.
      const refreshed = await loadPolicies();

      if (!refreshed) {
        throw new Error(
          "Policy was saved, but the latest details could not be loaded. Please refresh."
        );
      }

      setDialogOpen(false);
      setEditingId(null);

      setToast({
        severity: "success",
        text: currentEditingId
          ? "Leave policy updated successfully."
          : "Leave policy created successfully.",
      });
    } catch (error) {
      setDialogError(
        getErrorMessage(
          error,
          "Unable to save leave policy."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================
     DELETE POLICY
  ========================================= */

  const deletePolicy = async (
    policy: LeavePolicy
  ) => {
    if (!canManage || deletingId) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${policy.policyName}"?`
    );

    if (!confirmed) return;

    setDeletingId(policy._id);

    try {
      const response = await api.post<
        ApiResponse<unknown>
      >("/leaves/delete", {
        _id: policy._id,
      });

      if (response.data.success === false) {
        throw new Error(
          response.data.message ||
            "Unable to delete leave policy."
        );
      }

      const refreshed = await loadPolicies();

      if (!refreshed) {
        throw new Error(
          "Policy was deleted, but the latest details could not be loaded. Please refresh."
        );
      }

      setToast({
        severity: "success",
        text: "Leave policy deleted successfully.",
      });
    } catch (error) {
      setToast({
        severity: "error",
        text: getErrorMessage(
          error,
          "Unable to delete leave policy."
        ),
      });
    } finally {
      setDeletingId(null);
    }
  };

  /* =========================================
     LEAVE ENTITLEMENT VALUES
  ========================================= */

  const getPolicyValues = (policy: LeavePolicy) => [
    {
      label: "Casual Leave",
      shortLabel: "CL",
      value: formatCount(policy.casualLeave),
      unit: "days/year",
      icon: <CalendarTodayOutlinedIcon />,
      tone: "green",
    },
    {
      label: "Sick Leave",
      shortLabel: "SL",
      value: formatCount(policy.sickLeave),
      unit: "days/year",
      icon: <HealthAndSafetyOutlinedIcon />,
      tone: "blue",
    },
    {
      label: "Compensatory Off",
      shortLabel: "Comp Off",
      value: formatCount(
        policy.compensatoryOff
      ),
      unit: "days/year",
      icon: <WorkHistoryOutlinedIcon />,
      tone: "orange",
    },
    {
      label: "Permissions",
      shortLabel: "Permission",
      value: formatCount(
        policy.permissionsPerMonth
      ),
      unit: "/month",
      icon: <AccessTimeOutlinedIcon />,
      tone: "purple",
    },
  ];

  /* =========================================
     CREATE / EDIT DIALOG
  ========================================= */

  const policyDialog = (
    <Dialog
      className="leave-policies-dialog"
      open={dialogOpen}
      onClose={closeDialog}
      fullWidth
      maxWidth="sm"
      aria-labelledby="leave-policy-dialog-title"
    >
      <DialogTitle id="leave-policy-dialog-title">
        {editingId
          ? "Edit Leave Policy"
          : "Create Leave Policy"}

        <Typography className="leave-policies__dialog-subtitle">
          Configure the company's employee leave
          entitlements.
        </Typography>
      </DialogTitle>

      <DialogContent className="leave-policies__dialog-content">
        {dialogError && (
          <Alert
            severity="error"
            onClose={() => setDialogError("")}
          >
            {dialogError}
          </Alert>
        )}

        <TextField
          label="Policy Name"
          value={form.policyName}
          onChange={(event) =>
            updateField(
              "policyName",
              event.target.value
            )
          }
          error={Boolean(fieldErrors.policyName)}
          helperText={fieldErrors.policyName}
          fullWidth
          required
          autoFocus
          disabled={saving}
        />

        <Box className="leave-policies__form-grid">
          {(
            [
              {
                key: "casualLeave",
                label: "Casual Leave (CL)",
              },
              {
                key: "sickLeave",
                label: "Sick Leave (SL)",
              },
              {
                key: "compensatoryOff",
                label: "Compensatory Off",
              },
              {
                key: "permissionsPerMonth",
                label: "Permissions per Month",
              },
            ] as const
          ).map((field) => (
            <TextField
              key={field.key}
              label={field.label}
              value={form[field.key]}
              onChange={(event) =>
                updateField(
                  field.key,
                  event.target.value
                )
              }
              error={Boolean(
                fieldErrors[field.key]
              )}
              helperText={fieldErrors[field.key]}
              slotProps={{
                htmlInput: {
                  inputMode: "numeric",
                  min: 0,
                },
              }}
              disabled={saving}
              fullWidth
              required
            />
          ))}
        </Box>

        <Box className="leave-policies__business-year">
          <CalendarTodayOutlinedIcon />

          <Typography>
            Business Year:{" "}
            <strong>{businessYear}</strong>
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions className="leave-policies__dialog-actions">
        <Button
          variant="outlined"
          className="leave-policies__outlined-button"
          onClick={closeDialog}
          disabled={saving}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={() => void savePolicy()}
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
          {saving
            ? "Saving..."
            : editingId
              ? "Update Policy"
              : "Create Policy"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  /* =========================================
     SNACKBAR
  ========================================= */

  const toastSnackbar = (
    <Snackbar
      className="leave-policies-toast"
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
          severity={toast.severity}
          variant="filled"
          onClose={() => setToast(null)}
        >
          {toast.text}
        </Alert>
      ) : undefined}
    </Snackbar>
  );

  /* =========================================
     DIRECT EMPLOYEE LEAVE OVERVIEW
  ========================================= */

  if (!loading && selectedPolicy && !loadError) {
    const values = getPolicyValues(selectedPolicy);

    return (
      <Box className="leave-policies">

        {/* HEADER */}

        <Box className="leave-policies__detail-header">
          <Box className="leave-policies__heading-content">
            <Box className="leave-policies__heading-icon">
              <DescriptionOutlinedIcon />
            </Box>

            <Box>
              <Typography
                component="h2"
                className="leave-policies__title"
              >
                {selectedPolicy.policyName}
              </Typography>

              <Typography className="leave-policies__subtitle">
                Leave entitlement overview
              </Typography>
            </Box>
          </Box>

          {/* HR / ADMIN ACTIONS */}

          {canManage && (
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={1}
              sx={{
                width: {
                  xs: "100%",
                  sm: "auto",
                },
              }}
            >
              <Button
                variant="outlined"
                className="leave-policies__outlined-button"
                startIcon={<EditOutlinedIcon />}
                onClick={() =>
                  openEdit(selectedPolicy)
                }
              >
                Edit Policy
              </Button>

              <Button
                variant="outlined"
                color="error"
                className="leave-policies__delete-button"
                startIcon={
                  <DeleteOutlineRoundedIcon />
                }
                disabled={deletingId !== null}
                onClick={() =>
                  void deletePolicy(selectedPolicy)
                }
              >
                {deletingId
                  ? "Deleting..."
                  : "Delete Policy"}
              </Button>
            </Stack>
          )}
        </Box>

        {/* FOUR ENTITLEMENT CARDS */}

        <Box className="leave-policies__detail-stat-grid">
          {values.map((item) => (
            <Card
              key={item.label}
              className={`leave-policies__stat leave-policies__stat--${item.tone}`}
            >
              <Box className="leave-policies__stat-icon">
                {item.icon}
              </Box>

              <Typography className="leave-policies__stat-label">
                {item.label}
              </Typography>

              <Typography className="leave-policies__stat-value">
                {item.value}
              </Typography>

              <Typography className="leave-policies__stat-unit">
                {item.unit}
              </Typography>
            </Card>
          ))}
        </Box>

        {/* ENTITLEMENT DETAILS */}

        <Card className="leave-policies__detail-card">
          <Typography className="leave-policies__section-title">
            Leave Entitlements
          </Typography>

          <Typography className="leave-policies__section-description">
            Entitlements configured under this
            company leave policy.
          </Typography>

          <Box className="leave-policies__line-list">
            {values.map((item) => (
              <Box
                key={item.label}
                className="leave-policies__line"
              >
                <Typography className="leave-policies__line-label">
                  {item.label}
                </Typography>

                <Typography className="leave-policies__line-value">
                  {item.value} {item.unit}
                </Typography>
              </Box>
            ))}
          </Box>
        </Card>

        {policyDialog}
        {toastSnackbar}
      </Box>
    );
  }

  /* =========================================
     LOADING / ERROR / NO POLICY
     NO LISTING PAGE
  ========================================= */

  return (
    <Box className="leave-policies">

      <Box className="leave-policies__detail-header">
        <Box className="leave-policies__heading-content">
          <Box className="leave-policies__heading-icon">
            <DescriptionOutlinedIcon />
          </Box>

          <Box>
            <Typography
              component="h2"
              className="leave-policies__title"
            >
              Employee Leave
            </Typography>

            <Typography className="leave-policies__subtitle">
              Leave entitlement overview
            </Typography>
          </Box>
        </Box>

        {!loading &&
          !loadError &&
          canManage &&
          policies.length === 0 && (
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={openCreate}
              className="leave-policies__create-button"
            >
              Create Policy
            </Button>
          )}
      </Box>

      {loading ? (
        <Card className="leave-policies__detail-card">
          <Box className="leave-policies__loading">
            <CircularProgress size={28} />

            <Typography>
              Loading Employee Leave policy...
            </Typography>
          </Box>
        </Card>
      ) : loadError ? (
        <Alert
          severity="error"
          className="leave-policies__error"
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshRoundedIcon />}
              onClick={() => void loadPolicies()}
            >
              Retry
            </Button>
          }
        >
          {loadError}
        </Alert>
      ) : (
        <Alert severity="info">
          {policies.length > 0
            ? "The Employee Leave policy was not found. Please contact HR to check the configured policy."
            : canManage
              ? "No Employee Leave policy is configured. Click Create Policy to add the leave entitlements."
              : "No Employee Leave policy is configured. Please contact HR."}
        </Alert>
      )}

      {policyDialog}
      {toastSnackbar}
    </Box>
  );
};

export default LeavePolicies;
