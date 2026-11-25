import { useState } from "react";

import {
  Box,
  Dialog,
  Typography,
  IconButton,
  TextField,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import SendIcon from "@mui/icons-material/Send";

import api from "../../api/axiosInstance";

/* ==========================================
   CONSTANTS
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

const MAX_MESSAGE_LENGTH = 5000;

/* ==========================================
   TYPES
========================================== */

interface EmployeeSupportDialogProps {
  open: boolean;
  onClose: () => void;
}

interface SupportResponse {
  success: boolean;
  message?: string;
}

/* ==========================================
   ERROR HANDLER
========================================== */

const getErrorMessage = (error: unknown): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to send request. Please try again.";
};

/* ==========================================
   EMPLOYEE SUPPORT DIALOG
========================================== */

const EmployeeSupportDialog = ({
  open,
  onClose,
}: EmployeeSupportDialogProps) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ==========================================
     RESET FORM
  ========================================== */

  const resetForm = () => {
    setSubject("");
    setMessage("");
    setError("");
    setSuccess("");
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

  const handleSendRequest = async () => {
    if (loading) return;

    setError("");
    setSuccess("");

    if (!subject) {
      setError("Please select a subject.");
      return;
    }

    if (!message.trim()) {
      setError("Please enter your message.");
      return;
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      setError("Message cannot exceed 5000 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post<SupportResponse>(
        "/support/send-email",
        {
          subject,
          message: message.trim(),
        }
      );

      if (response.data?.success === false) {
        throw new Error(
          response.data.message ||
            "Unable to send support request."
        );
      }

      setSuccess(
        response.data?.message ||
          "Support request sent successfully."
      );

      setSubject("");
      setMessage("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    subject !== "" &&
    message.trim() !== "" &&
    message.length <= MAX_MESSAGE_LENGTH &&
    !loading;

  /* ==========================================
     UI
  ========================================== */

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      fullWidth
      aria-labelledby="employee-support-title"
      sx={{
        "& .MuiDialog-paper": {
          width: "780px",
          maxWidth: "calc(100% - 32px)",
          maxHeight: "calc(100dvh - 32px)",
          margin: "16px",
          borderRadius: "18px",
          overflow: "hidden",
          backgroundColor: "#ffffff",
          boxShadow: "0 15px 45px rgba(0,0,0,0.15)",
        },
      }}
    >
      {/* MAIN CARD */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "220px minmax(0, 1fr)",
          },
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* ==========================================
            LEFT SIDE DESIGN
        ========================================== */}

        <Box
          sx={{
            display: {
              xs: "none",
              sm: "flex",
            },
            position: "relative",
            isolation: "isolate",
            overflow: "hidden",
            flexDirection: "column",
            justifyContent: "center",
            padding: "24px 20px",
            color: "#ffffff",

            background:
              "linear-gradient(145deg, #14845e 0%, #075443 55%, #309b68 100%)",

            "&::before": {
              content: '""',
              position: "absolute",
              width: "240px",
              height: "200px",
              top: "-130px",
              right: "-90px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.10)",
              zIndex: -1,
            },

            "&::after": {
              content: '""',
              position: "absolute",
              width: "250px",
              height: "160px",
              bottom: "-120px",
              left: "-70px",
              borderRadius: "50%",
              background: "rgba(181,235,83,0.20)",
              zIndex: -1,
            },
          }}
        >
          <Typography
            sx={{
              fontSize: "25px",
              fontWeight: 750,
              lineHeight: 1.3,
              color: "#ffffff",
              marginBottom: "12px",
            }}
          >
            We're here
            <br />
            for you.
          </Typography>

          <Typography
            sx={{
              fontSize: "13px",
              lineHeight: 1.7,
              color: "#e4f5ed",
            }}
          >
            Connect with our HR team for assistance,
            guidance and workplace support.
          </Typography>

          {/* SMALL ACCENT LINE */}

          <Box
            sx={{
              width: "38px",
              height: "4px",
              borderRadius: "10px",
              backgroundColor: "#b5eb53",
              margin: "18px 0",
            }}
          />

          {/* ==========================================
              EMPLOYEE SUPPORT IMAGE
          ========================================== */}

          <Box
            component="img"
            src="/employee-support.png"
            alt="Employee support assistant"
            sx={{
              display: "block",
              width: "100%",
              maxWidth: "180px",
              height: "auto",
              maxHeight: "210px",
              objectFit: "contain",
              objectPosition: "center",
              margin: "0 auto 18px",
              borderRadius: "12px",
              flexShrink: 0,
            }}
          />

          {/* HELP DESK LABEL */}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 12px",
              borderRadius: "9px",
              backgroundColor: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <Box
              sx={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#b5eb53",
                flexShrink: 0,
              }}
            />

            <Typography
              sx={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#ffffff",
              }}
            >
              Employee Help Desk
            </Typography>
          </Box>
        </Box>

        {/* ==========================================
            RIGHT SIDE FORM
        ========================================== */}

        <Box
          sx={{
            minWidth: 0,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#ffffff",
          }}
        >
          {/* HEADER */}

          <Box
            sx={{
              position: "relative",
              isolation: "isolate",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "20px",
              paddingRight: "48px",
              flexShrink: 0,

              background:
                "linear-gradient(110deg, #f5fbf7, #dff2e7)",

              borderBottom: "1px solid #e2eee6",

              "&::after": {
                content: '""',
                position: "absolute",
                width: "250px",
                height: "100px",
                right: "-45px",
                bottom: "-78px",
                borderRadius: "50%",
                backgroundColor: "#a9dfbf",
                zIndex: -1,
              },
            }}
          >
            {/* HEADER ICON */}

            <Box
              sx={{
                width: "46px",
                height: "46px",
                flexShrink: 0,
                borderRadius: "12px",
                backgroundColor: "#d6efe1",
                color: "#087b4d",
                display: "grid",
                placeItems: "center",
              }}
            >
              <SupportAgentIcon
                sx={{
                  fontSize: "27px",
                }}
              />
            </Box>

            {/* HEADER TEXT */}

            <Box>
              <Typography
                id="employee-support-title"
                sx={{
                  fontSize: {
                    xs: "18px",
                    sm: "22px",
                  },
                  fontWeight: 750,
                  color: "#143a2b",
                  lineHeight: 1.3,
                }}
              >
                Employee Support
              </Typography>

              <Typography
                sx={{
                  fontSize: "12px",
                  color: "#70877b",
                  marginTop: "4px",
                }}
              >
                How can we help you today?
              </Typography>
            </Box>

            {/* CLOSE BUTTON */}

            <IconButton
              onClick={handleClose}
              disabled={loading}
              aria-label="Close employee support"
              sx={{
                position: "absolute",
                top: "12px",
                right: "12px",
                width: "30px",
                height: "30px",
                backgroundColor: "#ffffff",
                color: "#087b4d",

                "&:hover": {
                  backgroundColor: "#ffffff",
                },
              }}
            >
              <CloseIcon sx={{ fontSize: "19px" }} />
            </IconButton>
          </Box>

          {/* ==========================================
              FORM CONTENT
          ========================================== */}

          <Box
            sx={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              flex: "1 1 auto",
              minHeight: 0,
              overflowY: "auto",

              "&::-webkit-scrollbar": {
                width: "5px",
              },

              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#c5dfcf",
                borderRadius: "10px",
              },
            }}
          >
            {/* ERROR MESSAGE */}

            {error && (
              <Alert
                severity="error"
                onClose={() => setError("")}
                sx={{
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              >
                {error}
              </Alert>
            )}

            {/* SUCCESS MESSAGE */}

            {success && (
              <Alert
                severity="success"
                onClose={() => setSuccess("")}
                sx={{
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              >
                {success}
              </Alert>
            )}

            {/* SEND TO EMAIL CARD */}

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                borderRadius: "10px",
                backgroundColor: "#f0f8f3",
                border: "1px solid #d5eadd",
              }}
            >
              <Box
                sx={{
                  width: "40px",
                  height: "40px",
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "10px",
                  backgroundColor: "#ddf1e5",
                  color: "#087b4d",
                }}
              >
                <EmailOutlinedIcon
                  sx={{
                    fontSize: "23px",
                  }}
                />
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: "12px",
                    color: "#789486",
                  }}
                >
                  Send To
                </Typography>

                <Typography
                  sx={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#087b4d",
                    marginTop: "3px",
                    overflowWrap: "anywhere",
                  }}
                >
                  {SUPPORT_EMAIL}
                </Typography>
              </Box>
            </Box>

            {/* ==========================================
                SUBJECT FIELD
            ========================================== */}

            <Box>
              <Typography
                component="label"
                htmlFor="support-subject"
                sx={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 650,
                  color: "#17263b",
                  marginBottom: "7px",
                }}
              >
                Subject{" "}
                <Box
                  component="span"
                  sx={{ color: "#dc2626" }}
                >
                  *
                </Box>
              </Typography>

              <TextField
                id="support-subject"
                select
                fullWidth
                required
                size="small"
                value={subject}
                disabled={loading}
                onChange={(event) => {
                  setSubject(event.target.value);
                  setError("");
                  setSuccess("");
                }}
                slotProps={{
                  select: {
                    displayEmpty: true,
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: "40px",
                    borderRadius: "9px",
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                  },

                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#cfe2d5",
                  },

                  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
                    {
                      borderColor: "#8ebda0",
                    },

                  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                    {
                      borderColor: "#087b4d",
                      borderWidth: "1.5px",
                    },
                }}
              >
                <MenuItem value="" disabled>
                  <Typography
                    sx={{
                      fontSize: "13px",
                      color: "#94a3a0",
                    }}
                  >
                    Select a subject
                  </Typography>
                </MenuItem>

                {SUPPORT_SUBJECTS.map((item) => (
                  <MenuItem
                    key={item}
                    value={item}
                    sx={{
                      fontSize: "13px",
                    }}
                  >
                    {item}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* ==========================================
                MESSAGE FIELD
            ========================================== */}

            <Box>
              <Typography
                component="label"
                htmlFor="support-message"
                sx={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 650,
                  color: "#17263b",
                  marginBottom: "7px",
                }}
              >
                Your Message{" "}
                <Box
                  component="span"
                  sx={{ color: "#dc2626" }}
                >
                  *
                </Box>
              </Typography>

              <TextField
                id="support-message"
                fullWidth
                required
                multiline
                rows={4}
                value={message}
                disabled={loading}
                placeholder="Describe your issue or request..."
                onChange={(event) => {
                  setMessage(
                    event.target.value.slice(
                      0,
                      MAX_MESSAGE_LENGTH
                    )
                  );

                  setError("");
                  setSuccess("");
                }}
                slotProps={{
                  htmlInput: {
                    maxLength: MAX_MESSAGE_LENGTH,
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    padding: "12px",
                    fontSize: "13px",
                    lineHeight: 1.6,
                    backgroundColor: "#ffffff",
                  },

                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#cfe2d5",
                  },

                  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
                    {
                      borderColor: "#8ebda0",
                    },

                  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                    {
                      borderColor: "#087b4d",
                      borderWidth: "1.5px",
                    },
                }}
              />

              {/* MESSAGE COUNT */}

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "6px",
                }}
              >
                {/* <Typography
                  sx={{
                    fontSize: "11px",
                    color: "#81968a",
                  }}
                >
                  Please provide relevant details.
                </Typography> */}

                <Typography
                  sx={{
                    fontSize: "11px",
                    color:
                      message.length >= MAX_MESSAGE_LENGTH
                        ? "#dc2626"
                        : "#81968a",
                  }}
                >
                  {message.length}/{MAX_MESSAGE_LENGTH}
                </Typography>
              </Box>
            </Box>

            {/* ==========================================
                INFORMATION NOTE
            ========================================== */}

            {/* <Box
              sx={{
                padding: "10px 12px",
                borderRadius: "7px",
                borderLeft: "3px solid #087b4d",
                backgroundColor: "#f3f7f5",
              }} */}
            {/* > */}
              {/* <Typography
                sx={{
                  fontSize: "11.5px",
                  color: "#668073",
                  lineHeight: 1.6,
                }}
              >
                HR can reply directly to your registered
                employee email address.
              </Typography> */}
            {/* </Box> */}
          </Box>

          {/* ==========================================
              FOOTER BUTTONS - STATIC
          ========================================== */}

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "10px",
              padding: "14px 20px",
              borderTop: "1px solid #e5eee8",
              backgroundColor: "#ffffff",
              flexShrink: 0,
            }}
          >
            {/* CANCEL BUTTON */}

            <Button
              variant="outlined"
              onClick={handleClose}
              disabled={loading}
              sx={{
                minWidth: "85px",
                height: "36px",
                padding: "6px 16px",
                borderRadius: "8px",
                borderColor: "#b7d9c4",
                color: "#087b4d",
                textTransform: "none",
                fontSize: "12px",
                fontWeight: 650,

                "&:hover": {
                  borderColor: "#087b4d",
                  backgroundColor: "#f3faf5",
                },
              }}
            >
              Cancel
            </Button>

            {/* SEND REQUEST BUTTON */}

            <Button
              variant="contained"
              disabled={!canSubmit}
              onClick={() => void handleSendRequest()}
              startIcon={
                loading ? (
                  <CircularProgress
                    size={15}
                    color="inherit"
                  />
                ) : (
                  <SendIcon
                    sx={{
                      fontSize: "16px !important",
                    }}
                  />
                )
              }
              sx={{
                minWidth: "130px",
                height: "36px",
                padding: "6px 16px",
                borderRadius: "8px",
                background:
                  "linear-gradient(110deg, #087b4d, #05663e)",
                color: "#ffffff",
                textTransform: "none",
                fontSize: "12px",
                fontWeight: 700,
                boxShadow: "none",

                "&:hover": {
                  backgroundColor: "#05663e",
                  boxShadow: "none",
                },

                "&.Mui-disabled": {
                  background: "#e2e8e5",
                  color: "#94a39b",
                },
              }}
            >
              {loading ? "Sending..." : "Send Request"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default EmployeeSupportDialog;