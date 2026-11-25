
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
  IconButton,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import HealthAndSafetyOutlinedIcon from "@mui/icons-material/HealthAndSafetyOutlined";
import WorkHistoryOutlinedIcon from "@mui/icons-material/WorkHistoryOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
// import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import api from "../../api/axiosInstance";
import { HR, ADMIN } from "../../data/permissions";

import "./LeavePolicies.css";

/* =========================================
   TYPES
========================================= */

type LeavePolicy = {
  _id: string;
  policyName: string;
  businessYear: string;
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
const MONTHLY_PERMISSION_LIMIT_HOURS = 4;
const DEFAULT_EMPLOYEE_ENTITLEMENTS = {
  _id: "",
  policyName: EMPLOYEE_POLICY_NAME,
  businessYear: "",
  casualLeave: 11,
  sickLeave: 12,
  compensatoryOff: 0,
  permissionsPerMonth: MONTHLY_PERMISSION_LIMIT_HOURS,
};

const emptyForm: PolicyForm = {
  policyName: EMPLOYEE_POLICY_NAME,
  casualLeave: "",
  sickLeave: "",
  compensatoryOff: "",
  permissionsPerMonth: String(MONTHLY_PERMISSION_LIMIT_HOURS),
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

  const [pendingDeletePolicy, setPendingDeletePolicy] =
    useState<LeavePolicy | null>(null);

  const [policyDeleted, setPolicyDeleted] = useState(false);

  const [loadError, setLoadError] = useState("");

  const businessYear = getBusinessYear();
  const currentEmployeePolicy = policies.find(
    (policy) =>
      isEmployeeLeavePolicy(policy) &&
      policy.businessYear === businessYear
  );
  const employeePolicy =
    currentEmployeePolicy ??
    selectedPolicy ??
    policies[0] ??
    null;
  const displayPolicy =
    employeePolicy ??
    { ...DEFAULT_EMPLOYEE_ENTITLEMENTS, businessYear };

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

        const currentPolicy = data.find(
          (policy) =>
            isEmployeeLeavePolicy(policy) &&
            policy.businessYear === businessYear
        );
        const latestEmployeePolicy = data.find(
          isEmployeeLeavePolicy
        );

        setSelectedPolicy(
          currentPolicy ??
            latestEmployeePolicy ??
            data[0] ??
            null
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
    [businessYear]
  );

  useEffect(() => {
    void loadPolicies();
  }, [loadPolicies]);

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
        MONTHLY_PERMISSION_LIMIT_HOURS
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
        "Monthly permission allowance is fixed at 4 hours.";
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
  ): Promise<boolean> => {
    if (!canManage || deletingId !== null) return false;

    setDeletingId(policy._id || "pending");

    try {
      const response = await api.post<
        ApiResponse<unknown>
      >("/leaves/delete", {
        ...(policy._id
          ? { _id: policy._id }
          : {
              policyName: policy.policyName,
              businessYear: policy.businessYear,
            }),
      });

      if (response.data.success === false) {
        throw new Error(
          response.data.message ||
            "Unable to delete leave policy."
        );
      }

      const updatedPolicies = policies.filter(
        (currentPolicy) => {
          if (policy._id) {
            return currentPolicy._id !== policy._id;
          }

          return !(
            currentPolicy.policyName === policy.policyName &&
            currentPolicy.businessYear === policy.businessYear
          );
        }
      );
      setPolicies(updatedPolicies);

      const nextPolicy =
        updatedPolicies.find(
          (currentPolicy) =>
            isEmployeeLeavePolicy(currentPolicy) &&
            currentPolicy.businessYear === businessYear
        ) ??
        updatedPolicies.find(isEmployeeLeavePolicy) ??
        updatedPolicies[0] ??
        null;
      setSelectedPolicy(nextPolicy);
      setPolicyDeleted(updatedPolicies.length === 0);

      setToast({
        severity: "success",
        text: "Leave policy deleted successfully.",
      });
      return true;
    } catch (error) {
      setToast({
        severity: "error",
        text: getErrorMessage(
          error,
          "Unable to delete leave policy."
        ),
      });
      return false;
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDeletePolicy = async () => {
    if (!pendingDeletePolicy || deletingId) return;

    const deleted = await deletePolicy(pendingDeletePolicy);
    if (deleted) setPendingDeletePolicy(null);
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
      label: "Permissions ",
      shortLabel: "Permission",
      value: formatCount(MONTHLY_PERMISSION_LIMIT_HOURS),
      unit: "hours/month",
      icon: <AccessTimeOutlinedIcon />,
      tone: "purple",
    },
  ];

  /* =========================================
     CREATE / EDIT DIALOG
  ========================================= */

  const policyDialog = (
    <Dialog
      className="leave-policies-dialog lp-premium"
      open={dialogOpen}
      onClose={closeDialog}
      fullWidth
      maxWidth={false}
      aria-labelledby="leave-policy-dialog-title"
    >
      <Box className="lp-shell">
        <Box className="lp-side">
          <Box className="lp-art" aria-hidden="true">
            <svg viewBox="0 0 200 190" width="100%">
              <ellipse cx="100" cy="174" rx="75" ry="10" fill="#003e30" opacity=".35" />
              <rect x="34" y="26" width="115" height="145" rx="15" fill="#74c994" />
              <rect x="44" y="36" width="95" height="125" rx="9" fill="#fff" />
              <rect x="68" y="16" width="48" height="29" rx="8" fill="#a6dc50" />
              {[58, 89, 120].map(y => <g key={y}><rect x="55" y={y} width="19" height="19" rx="4" fill="#23985c"/><path d={`M59 ${y+9} l5 5 l7 -9`} stroke="white" strokeWidth="3" fill="none"/><rect x="81" y={y+5} width="45" height="5" rx="2" fill="#a4d4bd"/></g>)}
              <rect x="112" y="119" width="67" height="57" rx="8" fill="#fff" stroke="#65b58b" strokeWidth="3" />
              <path d="M113 134 H178" stroke="#65b58b" strokeWidth="4" />
              {[0,1,2].map(row => [0,1,2].map(col => <rect key={`${row}-${col}`} x={123+col*16} y={141+row*10} width="9" height="6" rx="1" fill="#75bfa1"/>))}
            </svg>
          </Box>
          <Box className="lp-side-line" />
          <Typography className="lp-side-title">Leave Policy</Typography>
          <Typography className="lp-side-copy">Manage and update employee leave entitlements.</Typography>
        </Box>
        <Box className="lp-main">
      <DialogTitle id="leave-policy-dialog-title">
        <Box className="lp-header-icon"><CalendarTodayOutlinedIcon /></Box>
        <Box className="lp-heading">
        {editingId
          ? "Edit Leave Policy"
          : "Create Leave Policy"}

        <Typography className="leave-policies__dialog-subtitle">
          Configure the company's employee leave
          entitlements.
        </Typography>
        </Box>
        <IconButton className="lp-close" aria-label="Close dialog" onClick={closeDialog} disabled={saving}><CloseRoundedIcon /></IconButton>
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

        <Box className="leave-policies__policy-name-field">
          <Box className="lp-field"><Box className="lp-field-icon"><WorkHistoryOutlinedIcon /></Box><TextField
            className="leave-policies__policy-name"
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
            slotProps={{
              inputLabel: { shrink: true },
            }}
          /></Box>
        </Box>

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
                label: "Permission Allowance (hours/month)",
              },
            ] as const
          ).map((field) => (
            <Box className="lp-field" key={field.key}>
              <Box className="lp-field-icon">{field.key === "casualLeave" ? <CalendarTodayOutlinedIcon /> : field.key === "sickLeave" ? <HealthAndSafetyOutlinedIcon /> : field.key === "compensatoryOff" ? <WorkHistoryOutlinedIcon /> : <AccessTimeOutlinedIcon />}</Box>
            <TextField
              label={field.label}
              value={form[field.key]}
              disabled={
                saving ||
                field.key === "permissionsPerMonth"
              }
              onChange={(event) =>
                updateField(
                  field.key,
                  event.target.value
                )
              }
              error={Boolean(
                fieldErrors[field.key]
              )}
              helperText={
                fieldErrors[field.key] ||
                (field.key === "permissionsPerMonth"
                  ? "Fixed monthly allowance"
                  : undefined)
              }
              slotProps={{
                htmlInput: {
                  inputMode: "numeric",
                  min: 0,
                },
              }}
              fullWidth
              required
            /></Box>
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
        </Box>
      </Box>
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

  const deleteConfirmationDialog = (
    <Dialog
      className="leave-policies-dialog"
      open={Boolean(pendingDeletePolicy)}
      onClose={() => {
        if (!deletingId) setPendingDeletePolicy(null);
      }}
      aria-labelledby="delete-policy-dialog-title"
      aria-describedby="delete-policy-dialog-description"
    >
      <DialogTitle id="delete-policy-dialog-title">
        Delete Leave Policy?
      </DialogTitle>

      <DialogContent>
        <Typography id="delete-policy-dialog-description">
          Are you sure you want to delete
          {" "}
          '{pendingDeletePolicy?.policyName}'?
        </Typography>
      </DialogContent>

      <DialogActions className="leave-policies__dialog-actions">
        <Button
          variant="outlined"
          className="leave-policies__outlined-button"
          onClick={() => setPendingDeletePolicy(null)}
          disabled={deletingId !== null}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={() => void confirmDeletePolicy()}
          disabled={deletingId !== null}
        >
          {deletingId ? "Deleting..." : "OK"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  /* =========================================
     DIRECT EMPLOYEE LEAVE OVERVIEW
  ========================================= */

  if (!loadError && (!policyDeleted || employeePolicy)) {
    const values = getPolicyValues(displayPolicy);

    return (
      <Box className="leave-policies">

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
          <Box className="leave-policies__entitlements-header">
            <Box className="leave-policies__entitlements-heading">
              <Typography className="leave-policies__section-title">
                Leave Entitlements
              </Typography>
              <Typography className="leave-policies__section-description">
                Employee leave entitlements.
              </Typography>
            </Box>

            {canManage && employeePolicy && (
              <Box className="leave-policies__entitlements-actions">
                <Button
                  variant="outlined"
                  className="leave-policies__outlined-button"
                  startIcon={<EditOutlinedIcon />}
                  onClick={() => openEdit(employeePolicy)}
                >
                  Edit Policy
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  className="leave-policies__delete-button"
                  startIcon={<DeleteOutlineRoundedIcon />}
                  disabled={deletingId !== null}
                  onClick={() => setPendingDeletePolicy(employeePolicy)}
                >
                  {deletingId ? "Deleting..." : "Delete Policy"}
                </Button>
              </Box>
            )}
          </Box>

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
        {deleteConfirmationDialog}
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
          {/* <Box className="leave-policies__heading-icon">
            <DescriptionOutlinedIcon />
          </Box> */}

          {/* <Box>
            <Typography
              component="h2"
              className="leave-policies__title"
            >
              Employee Leave
            </Typography>

            <Typography className="leave-policies__subtitle">
              Leave entitlement overview
            </Typography>
          </Box> */}
        </Box>

      </Box>

      {loading ? null : loadError ? (
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
      ) : policyDeleted ? (
        <Alert severity="info" className="leave-policies__error">
          No leave policy available.
        </Alert>
      ) : null}

      {policyDialog}
      {deleteConfirmationDialog}
      {toastSnackbar}
    </Box>
  );
};

export default LeavePolicies;
