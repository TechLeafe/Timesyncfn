
import { useState } from "react";
import axios from "axios";

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
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";

// Request From icon hidden
// import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";

import api from "../../api/axiosInstance";

/* ==========================================
   TYPES
========================================== */

interface EmployeeSupportDialogProps {
  open: boolean;
  onClose: () => void;
}

interface SupportResponse {
  success: boolean;
  message: string;
}

/* ==========================================
   SUPPORT CONFIGURATION
========================================== */

const SUPPORT_EMAIL = "hr@techleafe.com";

const SUPPORT_SUBJECTS = [
  "Attendance Issue",
  "Leave Request",
  "Payroll / Salary",
  "Permission Request",
  "Technical Support",
  "General HR Enquiry",
];

/* ==========================================
   EMPLOYEE SUPPORT COMPONENT
========================================== */

const EmployeeSupportDialog = ({
  open,
  onClose,
}: EmployeeSupportDialogProps) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  /* ==========================================
     RESET FORM
  ========================================== */

  const resetForm = () => {
    setSubject("");
    setMessage("");
    setSuccess("");
    setError("");
  };

  /* ==========================================
     CLOSE DIALOG
  ========================================== */

  const handleClose = () => {
    if (loading) return;

    resetForm();
    onClose();
  };

  /* ==========================================
     SEND SUPPORT REQUEST
  ========================================== */

  const handleSend = async () => {
    if (loading) return;

    setError("");
    setSuccess("");

    // Validate subject
    if (!SUPPORT_SUBJECTS.includes(subject)) {
      setError("Please select a valid subject.");
      return;
    }

    // Validate message
    if (!message.trim()) {
      setError("Please enter your message.");
      return;
    }

    if (message.trim().length > 5000) {
      setError("Message cannot exceed 5000 characters.");
      return;
    }

    setLoading(true);

    try {
      // Backend identifies the logged-in employee
      // using the authenticated JWT token.

      const response = await api.post<SupportResponse>(
        "/support/send-email",
        {
          subject,
          message: message.trim(),
        }
      );

      if (response.data?.success !== true) {
        setError(
          response.data?.message ||
            "Unable to send support request."
        );
        return;
      }

      // Success message
      setSuccess(
        response.data.message ||
          "Your support request has been sent successfully."
      );

      // Clear form
      setSubject("");
      setMessage("");

    } catch (err: unknown) {
      if (axios.isAxiosError<SupportResponse>(err)) {
        const status = err.response?.status;
        const apiMessage = err.response?.data?.message;

        console.error("Employee Support API Error:", {
          status,
          message: apiMessage || err.message,
        });

        if (status === 400) {
          setError(
            apiMessage ||
              "Please check your subject and message."
          );

        } else if (status === 401) {
          setError(
            "Your login session is invalid or expired. Please log in again."
          );

        } else if (status === 403) {
          setError(
            apiMessage ||
              "You do not have permission to send this request."
          );

        } else if (status === 404) {
          setError(
            apiMessage ||
              "Support service or employee account not found."
          );

        } else if (status === 429) {
          setError(
            "Too many support requests. Please try again later."
          );

        } else if (status === 500) {
          setError(
            apiMessage ||
              "Unable to send support email. Please contact HR."
          );

        } else if (status === 503) {
          setError(
            "Support email service is not configured. Please contact the administrator."
          );

        } else if (!err.response) {
          setError(
            "Cannot connect to the backend server. Please check your connection."
          );

        } else {
          setError(
            apiMessage ||
              "Unable to send your request. Please try again."
          );
        }

      } else {
        setError(
          "An unexpected error occurred. Please try again."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  /* ==========================================
     COMPONENT UI
  ========================================== */

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="employee-support-title"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "18px",
          overflow: "hidden",
          maxHeight: "90vh",
        },
      }}
    >
      {/* ======================================
          HEADER
      ====================================== */}

      <DialogTitle
        id="employee-support-title"
        sx={{
          px: 3,
          py: 2.5,
          borderBottom: "1px solid #E8EEF2",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            {/* Support Icon */}

            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: "14px",
                backgroundColor: "#E6F6ED",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#00875A",
                flexShrink: 0,
              }}
            >
              <SupportAgentRoundedIcon
                sx={{ fontSize: 28 }}
              />
            </Box>

            {/* Header Text */}

            <Box>
              <Typography
                component="span"
                sx={{
                  display: "block",
                  fontSize: {
                    xs: 19,
                    sm: 23,
                  },
                  fontWeight: 700,
                  color: "#14233B",
                }}
              >
                Employee Support
              </Typography>

              <Typography
                component="span"
                sx={{
                  display: "block",
                  fontSize: 14,
                  color: "#8191A8",
                  mt: 0.5,
                }}
              >
                We're here to help you.
              </Typography>
            </Box>
          </Box>

          {/* Close Button */}

          <IconButton
            onClick={handleClose}
            disabled={loading}
            aria-label="Close employee support"
          >
            <CloseRoundedIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* ======================================
          CONTENT
      ====================================== */}

      <DialogContent
        sx={{
          px: {
            xs: 2,
            sm: 3,
          },
          py: 3,
        }}
      >
        <Typography
          sx={{
            fontSize: 15,
            color: "#71839A",
            mb: 3,
            lineHeight: 1.6,
          }}
        >
          Have a question or concern? Submit your
          request directly to our HR team.
        </Typography>

        {/* ====================================
            REQUEST FROM - COMMENTED OUT
        ==================================== */}

        {/*
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            backgroundColor: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            p: 2,
            mb: 2,
          }}
        >
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: "10px",
              backgroundColor: "#E8EEF5",
              color: "#475569",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <PersonOutlineRoundedIcon />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 13,
                color: "#64748B",
              }}
            >
              Request From
            </Typography>

            <Typography
              sx={{
                fontSize: 15,
                fontWeight: 600,
                color: "#14233B",
                mt: 0.3,
              }}
            >
              Logged-in Employee
            </Typography>

            <Typography
              sx={{
                fontSize: 12,
                color: "#8191A8",
                mt: 0.4,
              }}
            >
              Your employee details are included automatically.
            </Typography>
          </Box>
        </Box>
        */}

        {/* ====================================
            SEND TO EMAIL
        ==================================== */}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            backgroundColor: "#F3FAF6",
            border: "1px solid #DCEFE4",
            borderRadius: "12px",
            p: 2,
            mb: 3,
          }}
        >
          <Box
            sx={{
              width: 42,
              height: 42,
              backgroundColor: "#E0F3E8",
              borderRadius: "10px",
              color: "#00875A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <EmailOutlinedIcon />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 14,
                color: "#789486",
              }}
            >
              Send To
            </Typography>

            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 700,
                color: "#00875A",
                mt: 0.5,
                overflowWrap: "anywhere",
              }}
            >
              {SUPPORT_EMAIL}
            </Typography>
          </Box>
        </Box>

        {/* ====================================
            SUCCESS MESSAGE
        ==================================== */}

        {success && (
          <Alert
            severity="success"
            onClose={() => setSuccess("")}
            sx={{
              mb: 3,
              borderRadius: "12px",
            }}
          >
            {success}
          </Alert>
        )}

        {/* ====================================
            ERROR MESSAGE
        ==================================== */}

        {error && (
          <Alert
            severity="error"
            onClose={() => setError("")}
            sx={{
              mb: 3,
              borderRadius: "12px",
            }}
          >
            {error}
          </Alert>
        )}

        {/* ====================================
            SUBJECT DROPDOWN
        ==================================== */}

        <TextField
          select
          fullWidth
          required
          label="Subject"
          value={subject}
          onChange={(event) => {
            setSubject(event.target.value);
            setError("");
            setSuccess("");
          }}
          disabled={loading}
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
            },
          }}
        >
          {SUPPORT_SUBJECTS.map((item) => (
            <MenuItem
              key={item}
              value={item}
            >
              {item}
            </MenuItem>
          ))}
        </TextField>

        {/* ====================================
            EMPLOYEE MESSAGE
        ==================================== */}

        <TextField
          fullWidth
          required
          multiline
          minRows={5}
          maxRows={8}
          label="Your Message"
          placeholder="Please describe your issue or request in detail..."
          value={message}
          disabled={loading}
          onChange={(event) => {
            setMessage(
              event.target.value.slice(0, 5000)
            );

            setError("");
            setSuccess("");
          }}
          helperText={`${message.length}/5000 characters`}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
            },

            "& .MuiFormHelperText-root": {
              textAlign: "right",
              marginRight: 0,
            },
          }}
        />

        {/* ====================================
            REPLY INFORMATION
        ==================================== */}

        <Typography
          sx={{
            fontSize: 12,
            color: "#8191A8",
            mt: 1.5,
            lineHeight: 1.6,
          }}
        >
          HR can reply directly to your registered
          employee email address.
        </Typography>

      </DialogContent>

      {/* ======================================
          FOOTER BUTTONS
      ====================================== */}

      <DialogActions
        sx={{
          px: 3,
          py: 2.5,
          borderTop: "1px solid #E8EEF2",
          gap: 1,
        }}
      >
        {/* Cancel Button */}

        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{
            color: "#64748B",
            textTransform: "none",
            fontWeight: 600,
            borderRadius: "10px",
            px: 2,
          }}
        >
          {success ? "Close" : "Cancel"}
        </Button>

        {/* Send Request Button */}

        <Button
          variant="contained"
          onClick={handleSend}
          disabled={
            loading ||
            !subject ||
            !message.trim()
          }
          startIcon={
            loading ? (
              <CircularProgress
                size={18}
                color="inherit"
              />
            ) : (
              <SendRoundedIcon />
            )
          }
          sx={{
            backgroundColor: "#00875A",
            color: "#FFFFFF",
            textTransform: "none",
            fontWeight: 700,
            borderRadius: "12px",
            px: 3,
            minHeight: 46,
            boxShadow: "none",

            "&:hover": {
              backgroundColor: "#006F49",
              boxShadow: "none",
            },

            "&.Mui-disabled": {
              backgroundColor: "#E2E8F0",
              color: "#94A3B8",
            },
          }}
        >
          {loading ? "Sending..." : "Send Request"}
        </Button>

      </DialogActions>
    </Dialog>
  );
};

export default EmployeeSupportDialog;
