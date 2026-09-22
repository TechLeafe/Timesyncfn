import { useEffect, useState } from "react";
import {
	Alert,
	Box,
	Button,
	Card,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	Snackbar,
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
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import api from "../../api/axiosInstance";
import { useCurrentUser } from "../../context/UserContext";
import "./LeavePolicies.css";

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
type FormErrors = Partial<Record<keyof PolicyForm, string>>;
type ApiResponse<T> = { success?: boolean; message?: string; data?: T };

const emptyForm: PolicyForm = {
	policyName: "",
	casualLeave: "",
	sickLeave: "",
	compensatoryOff: "",
	permissionsPerMonth: "",
};

const numericFields: (keyof PolicyForm)[] = ["casualLeave", "sickLeave", "compensatoryOff", "permissionsPerMonth"];

// The backend's documented /leaves/create and /leaves/update contract requires a
// "businessYear" field. There's no form field for it, so it's derived automatically
// and sent silently in the payload for both create and edit.
/**
 * Calculates the business year based on the current date.
 * If current month is April or later (Month >= 3 in JS 0-indexed months),
 * business year is CurrentYear-NextYear (e.g., 2026-2027).
 * If before April, it is PreviousYear-CurrentYear (e.g., 2025-2026).
 */
export const getBusinessYear = (date = new Date()) => {
	const currentYear = date.getFullYear();
	const month = date.getMonth(); // 0 = Jan, 3 = April

	// April (Month 3) or later begins the new business year
	if (month >= 3) {
		return `${currentYear}-${currentYear + 1}`;
	} else {
		return `${currentYear - 1}-${currentYear}`;
	}
};

const LeavePolicies = () => {
	const { currentUser } = useCurrentUser();
	const canManage = currentUser.role === "HR Manager" || currentUser.role === "Admin";

	const [policies, setPolicies] = useState<LeavePolicy[]>([]);
	const [selectedPolicy, setSelectedPolicy] = useState<LeavePolicy | null>(null);
	const [form, setForm] = useState<PolicyForm>(emptyForm);
	const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
	const [dialogError, setDialogError] = useState("");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [toast, setToast] = useState<{ severity: "success" | "error"; text: string } | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const getErrorMessage = (error: unknown, fallback: string) => {
		if (typeof error === "object" && error !== null && "response" in error) {
			const response = (error as { response?: { data?: ApiResponse<unknown> } }).response;
			if (response?.data?.message) return response.data.message;
		}
		return error instanceof Error ? error.message : fallback;
	};

	const loadPolicies = async (): Promise<LeavePolicy[]> => {
		try {
			setLoading(true);
			const response = await api.post<ApiResponse<LeavePolicy[]>>("/leaves/list", {});
			const data = response.data.data;
			if (!Array.isArray(data)) throw new Error("Invalid leave policy response.");
			setPolicies(data);
			return data;
		} catch (error) {
			setToast({ severity: "error", text: getErrorMessage(error, "Unable to load leave policies.") });
			return [];
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadPolicies();
	}, []);

	const openCreate = () => {
		setEditingId(null);
		setForm(emptyForm);
		setFieldErrors({});
		setDialogError("");
		setDialogOpen(true);
	};

	const openEdit = (policy: LeavePolicy) => {
		setEditingId(policy._id);
		setForm({
			policyName: policy.policyName,
			casualLeave: String(policy.casualLeave),
			sickLeave: String(policy.sickLeave),
			compensatoryOff: String(policy.compensatoryOff),
			permissionsPerMonth: String(policy.permissionsPerMonth),
		});
		setFieldErrors({});
		setDialogError("");
		setDialogOpen(true);
	};

	const updateField = (field: keyof PolicyForm, value: string) => {
		const nextValue = numericFields.includes(field) ? value.replace(/[^0-9]/g, "") : value;
		setForm((current) => ({ ...current, [field]: nextValue }));
		setFieldErrors((current) => ({ ...current, [field]: undefined }));
	};

	const validateForm = (): FormErrors => {
		const errors: FormErrors = {};
		if (!form.policyName.trim()) errors.policyName = "Policy name is required.";
		if (!form.casualLeave.trim()) errors.casualLeave = "Casual leave days are required.";
		if (!form.sickLeave.trim()) errors.sickLeave = "Sick leave days are required.";
		if (!form.compensatoryOff.trim()) errors.compensatoryOff = "Compensatory off days are required.";
		if (!form.permissionsPerMonth.trim()) errors.permissionsPerMonth = "Permissions per month is required.";
		return errors;
	};

	const savePolicy = async () => {
		const errors = validateForm();
		if (Object.keys(errors).length > 0) {
			setFieldErrors(errors);
			return;
		}
		setDialogError("");
		const payload = {
			policyName: form.policyName.trim(),
			businessYear: getBusinessYear(),
			casualLeave: Number(form.casualLeave),
			sickLeave: Number(form.sickLeave),
			compensatoryOff: Number(form.compensatoryOff),
			permissionsPerMonth: Number(form.permissionsPerMonth),
		};
		try {
			setSaving(true);
			if (editingId) {
				await api.post<ApiResponse<LeavePolicy>>("/leaves/update", { _id: editingId, ...payload });
				setToast({ severity: "success", text: "Leave policy updated successfully." });
			} else {
				await api.post<ApiResponse<LeavePolicy>>("/leaves/create", payload);
				setToast({ severity: "success", text: "Leave policy created successfully." });
			}
			setDialogOpen(false);
			const refreshed = await loadPolicies();
			if (editingId) {
				const updated = refreshed.find((item) => item._id === editingId);
				if (updated) setSelectedPolicy(updated);
			}
		} catch (error) {
			setDialogError(getErrorMessage(error, "Unable to save leave policy."));
		} finally {
			setSaving(false);
		}
	};

	const deletePolicy = async (policy: LeavePolicy) => {
		if (!window.confirm(`Delete ${policy.policyName}?`)) return;
		try {
			await api.post("/leaves/delete", { _id: policy._id });
			setSelectedPolicy(null);
			setToast({ severity: "success", text: "Leave policy deleted successfully." });
			await loadPolicies();
		} catch (error) {
			setToast({ severity: "error", text: getErrorMessage(error, "Unable to delete leave policy.") });
		}
	};

	const viewPolicy = (policy: LeavePolicy) => {
		setSelectedPolicy(policy);
	};

	const policyDialog = (
		<Dialog
			className="leave-policies-dialog"
			open={dialogOpen}
			onClose={(_event, reason) => {
				if (reason === "backdropClick" || reason === "escapeKeyDown") return;
				setDialogOpen(false);
			}}
			fullWidth
			maxWidth="sm"
		>
			<DialogTitle>{editingId ? "Edit leave policy" : "Create leave policy"}</DialogTitle>
			<DialogContent className="leave-policies__dialog-content">
				{dialogError && (
					<Alert severity="error" onClose={() => setDialogError("")}>
						{dialogError}
					</Alert>
				)}
				<TextField
					label="Policy name *"
					value={form.policyName}
					onChange={(event) => updateField("policyName", event.target.value)}
					error={!!fieldErrors.policyName}
					helperText={fieldErrors.policyName}
					fullWidth
					autoFocus
				/>
				<TextField
					label="Casual Leave (CL) *"
					value={form.casualLeave}
					onChange={(event) => updateField("casualLeave", event.target.value)}
					error={!!fieldErrors.casualLeave}
					helperText={fieldErrors.casualLeave}
					slotProps={{ htmlInput: { inputMode: "numeric" } }}
					fullWidth
				/>
				<TextField
					label="Sick Leave (SL) *"
					value={form.sickLeave}
					onChange={(event) => updateField("sickLeave", event.target.value)}
					error={!!fieldErrors.sickLeave}
					helperText={fieldErrors.sickLeave}
					slotProps={{ htmlInput: { inputMode: "numeric" } }}
					fullWidth
				/>
				<TextField
					label="Compensatory Off *"
					value={form.compensatoryOff}
					onChange={(event) => updateField("compensatoryOff", event.target.value)}
					error={!!fieldErrors.compensatoryOff}
					helperText={fieldErrors.compensatoryOff}
					slotProps={{ htmlInput: { inputMode: "numeric" } }}
					fullWidth
				/>
				<TextField
					label="Permissions per month *"
					value={form.permissionsPerMonth}
					onChange={(event) => updateField("permissionsPerMonth", event.target.value)}
					error={!!fieldErrors.permissionsPerMonth}
					helperText={fieldErrors.permissionsPerMonth}
					slotProps={{ htmlInput: { inputMode: "numeric" } }}
					fullWidth
				/>
			</DialogContent>
			<DialogActions>
				<Button className="leave-policies__outlined-button" variant="outlined" onClick={() => setDialogOpen(false)}>
					Cancel
				</Button>
				<Button variant="contained" disabled={saving} onClick={() => void savePolicy()}>
					{saving ? "Saving..." : "Save policy"}
				</Button>
			</DialogActions>
		</Dialog>
	);

	const toastSnackbar = (
		<Snackbar
			className="leave-policies-toast"
			open={!!toast}
			autoHideDuration={4000}
			onClose={() => setToast(null)}
			anchorOrigin={{ vertical: "top", horizontal: "right" }}
		>
			{toast ? (
				<Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)}>
					{toast.text}
				</Alert>
			) : undefined}
		</Snackbar>
	);

	if (selectedPolicy) {
		return (
			<Box className="leave-policies">
				<Button startIcon={<ArrowBackRoundedIcon />} className="leave-policies__back" onClick={() => setSelectedPolicy(null)}>
					Back to Leave Policies
				</Button>
				<Box className="leave-policies__detail-header">
					<Box>
						<Typography className="leave-policies__title">{selectedPolicy.policyName}</Typography>
					</Box>
					{canManage && (
						<Stack direction="row" spacing={1}>
							<Button className="leave-policies__outlined-button" variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => openEdit(selectedPolicy)}>
								Edit
							</Button>
							<Button className="leave-policies__outlined-button" variant="outlined" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => void deletePolicy(selectedPolicy)}>
								Delete
							</Button>
						</Stack>
					)}
				</Box>
				<Card className="leave-policies__detail-card">
					<Typography className="leave-policies__section-title">Leave entitlement</Typography>
					<Box className="leave-policies__line-list">
						<Box className="leave-policies__line">
							<Typography className="leave-policies__line-label">Casual Leave (CL)</Typography>
							<Typography className="leave-policies__line-value">{selectedPolicy.casualLeave} days per year</Typography>
						</Box>
						<Box className="leave-policies__line">
							<Typography className="leave-policies__line-label">Sick Leave (SL)</Typography>
							<Typography className="leave-policies__line-value">{selectedPolicy.sickLeave} days per year</Typography>
						</Box>
						<Box className="leave-policies__line">
							<Typography className="leave-policies__line-label">Compensatory Off</Typography>
							<Typography className="leave-policies__line-value">{selectedPolicy.compensatoryOff} days per year</Typography>
						</Box>
						<Box className="leave-policies__line">
							<Typography className="leave-policies__line-label">Permissions</Typography>
							<Typography className="leave-policies__line-value">{selectedPolicy.permissionsPerMonth} per month</Typography>
						</Box>
					</Box>
				</Card>
				{policyDialog}
				{toastSnackbar}
			</Box>
		);
	}

	return (
		<Box className="leave-policies">
			<Box className="leave-policies__header">
				<Box>
					<Typography className="leave-policies__title">Leave Policies</Typography>
					<Typography className="leave-policies__subtitle">
						{canManage ? "Create and manage leave entitlements for the company." : "View the leave entitlements available to employees."}
					</Typography>
				</Box>
				{canManage && (
					<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate} disabled={loading || policies.length > 0}>
						Create Policy
					</Button>
				)}
			</Box>

			<Card className="leave-policies__table-card">
				<Typography className="leave-policies__section-title">Company policies</Typography>
				<TableContainer>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell>Policy name</TableCell>
								<TableCell align="center">CL</TableCell>
								<TableCell align="center">SL</TableCell>
								<TableCell align="center">Comp Off</TableCell>
								<TableCell align="center">Permissions</TableCell>
								<TableCell align="right">Actions</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{loading ? (
								<TableRow>
									<TableCell colSpan={6} align="center">
										Loading leave policies...
									</TableCell>
								</TableRow>
							) : policies.length > 0 ? (
								policies.map((policy) => (
									<TableRow key={policy._id} hover>
										<TableCell>
											<Typography className="leave-policies__policy-name">{policy.policyName}</Typography>
										</TableCell>
										<TableCell align="center">{policy.casualLeave} days</TableCell>
										<TableCell align="center">{policy.sickLeave} days</TableCell>
										<TableCell align="center">{policy.compensatoryOff} days</TableCell>
										<TableCell align="center">{policy.permissionsPerMonth} /month</TableCell>
										<TableCell align="right">
											<Tooltip title="View policy">
												<IconButton onClick={() => viewPolicy(policy)}>
													<VisibilityOutlinedIcon />
												</IconButton>
											</Tooltip>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={6} align="center">
										No leave policies found.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</TableContainer>
			</Card>

			{policyDialog}
			{toastSnackbar}
		</Box>
	);
};

export default LeavePolicies;
