
import {
  useState,
  type MouseEvent,
} from "react";

import {
  Avatar,
  Box,
  Menu,
  Typography,
  Divider,
  ButtonBase,
} from "@mui/material";

import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";

/* =========================================
   CONSTANTS
========================================= */

const FONT =
  "var(--font-family, 'Inter', sans-serif)";

const avatarGradient =
  "linear-gradient(135deg, #098553 0%, #075B3D 100%)";

/* =========================================
   TYPES
========================================= */

interface StoredUser {
  userId?: string;
  employeeId?: string;
  name?: string;
  fullName?: string;
  email?: string;
  userType?: number | string;
  designation?: string;
  jobTitle?: string;
}

/* =========================================
   SYSTEM ROLE
========================================= */
const getRole = (
  userType?: number | string
): string => {
  switch (Number(userType)) {
    case 1:
      return "HR";

    case 2:
      return "Admin";

    case 3:
      return "Employee";

    default:
      return "User";
  }
};
/* =========================================
   GET LOGGED-IN USER
========================================= */

const getStoredUser = (): StoredUser | null => {
  try {
    const storedUser =
      localStorage.getItem("loggedInUser");

    if (!storedUser) {
      return null;
    }

    const parsed: unknown =
      JSON.parse(storedUser);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return null;
    }

    return parsed as StoredUser;
  } catch {
    return null;
  }
};

/* =========================================
   GET INITIALS
========================================= */

const getInitials = (name: string): string => {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");

  return initials || "U";
};

/* =========================================
   REUSABLE PROFILE DETAILS ROW
========================================= */

interface ProfileDetailProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  last?: boolean;
}

const ProfileDetail = ({
  icon,
  label,
  value,
  last = false,
}: ProfileDetailProps) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1.3,
      mb: last ? 0 : 1.6,
      minWidth: 0,
    }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: "#087B4D",
      }}
    >
      {icon}
    </Box>

    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography
        sx={{
          fontFamily: FONT,
          fontSize: 10.5,
          color: "#9AA5B4",
          mb: 0.3,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontFamily: FONT,
          fontSize: 12,
          fontWeight: 650,
          color: "#26364B",
          overflowWrap: "anywhere",
          lineHeight: 1.5,
        }}
      >
        {value}
      </Typography>
    </Box>
  </Box>
);

/* =========================================
   PROFILE DROPDOWN
========================================= */

export default function ProfileDropdown() {
  /* =========================================
     LOGGED-IN USER DETAILS
  ========================================= */

  const loggedInUser = getStoredUser();

  const userName =
    loggedInUser?.name?.trim() ||
    loggedInUser?.fullName?.trim() ||
    loggedInUser?.email?.trim() ||
    "User";

  const email =
    loggedInUser?.email?.trim() || "";

  /* System role controls permissions */
  const systemRole = getRole(
    loggedInUser?.userType
  );

  /*
    Job designation comes from employee data.
    Example: App Developer, Web Developer,
    UI/UX Designer, Full Stack Developer.
  */
  const jobDesignation =
    loggedInUser?.designation?.trim() ||
    loggedInUser?.jobTitle?.trim() ||
    "";

  /*
    Display actual designation when available.
    Otherwise show the system role as fallback.
  */
  const profileTitle =
    jobDesignation || systemRole;

  const initials = getInitials(userName);

  /* =========================================
     MENU STATE
  ========================================= */

  const [anchorEl, setAnchorEl] =
    useState<HTMLElement | null>(null);

  const open = Boolean(anchorEl);

  const handleOpen = (
    event: MouseEvent<HTMLElement>
  ) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  /* =========================================
     UI
  ========================================= */

  return (
    <>
      {/* =====================================
          TOP-RIGHT PROFILE TRIGGER
      ===================================== */}

      <ButtonBase
        onClick={handleOpen}
        aria-label={`Open profile menu for ${userName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 0, sm: 1.25 },
          px: { xs: 0.2, sm: 1.2 },
          py: 0.6,
          borderRadius: "12px",
          textAlign: "left",
          minWidth: 0,
          transition: "background 0.2s ease",

          "&:hover": {
            backgroundColor: "#F3F8F5",
          },

          "&:focus-visible": {
            outline: "3px solid #71C6A1",
            outlineOffset: "3px",
          },
        }}
      >
        {/* AVATAR */}

        <Avatar
          alt={userName}
          sx={{
            width: { xs: 38, sm: 42 },
            height: { xs: 38, sm: 42 },
            flexShrink: 0,
            fontFamily: FONT,
            fontWeight: 750,
            fontSize: 14,
            background: avatarGradient,
            border: "2px solid #FFFFFF",
            boxShadow:
              "0 3px 12px rgba(8,123,77,0.14)",
          }}
        >
          {initials}
        </Avatar>

        {/* USER NAME + JOB DESIGNATION */}

        <Box
          sx={{
            display: {
              xs: "none",
              sm: "flex",
            },
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 0.4,
            minWidth: 0,
          }}
        >
          <Typography
            sx={{
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 750,
              color: "#142238",
              lineHeight: 1.25,

              maxWidth: {
                sm: 125,
                md: 175,
              },

              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {userName}
          </Typography>

          <Typography
            sx={{
              fontFamily: FONT,
              fontSize: 11,
              fontWeight: 550,
              color: "#8591A2",
              lineHeight: 1.25,

              maxWidth: {
                sm: 125,
                md: 175,
              },

              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {profileTitle}
          </Typography>
        </Box>

        {/* DROPDOWN ARROW */}

        <KeyboardArrowDownRoundedIcon
          sx={{
            display: {
              xs: "none",
              sm: "block",
            },
            fontSize: 19,
            ml: 0.4,
            color: "#8190A3",
            transition: "transform 0.2s ease",

            transform: open
              ? "rotate(180deg)"
              : "rotate(0deg)",
          }}
        />
      </ButtonBase>

      {/* =====================================
          PROFILE MENU
      ===================================== */}

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.2,
              width: 290,
              maxWidth: "calc(100vw - 24px)",
              borderRadius: "16px",
              border: "1px solid #E7EDF2",
              boxShadow:
                "0 16px 45px rgba(20,38,60,0.13)",
              overflow: "hidden",
            },
          },
        }}
      >
        {/* ===================================
            PROFILE HEADER
        =================================== */}

        <Box
          sx={{
            px: 2.3,
            pt: 2.1,
            pb: 1.8,
            background:
              "linear-gradient(115deg, #F0FAF4, #FFFFFF)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              minWidth: 0,
            }}
          >
            <Avatar
              alt={userName}
              sx={{
                width: 47,
                height: 47,
                flexShrink: 0,
                background: avatarGradient,
                fontFamily: FONT,
                fontWeight: 750,
                fontSize: 15,
                boxShadow:
                  "0 4px 12px rgba(8,123,77,0.15)",
              }}
            >
              {initials}
            </Avatar>

            <Box
              sx={{
                minWidth: 0,
                flex: 1,
              }}
            >
              <Typography
                sx={{
                  fontFamily: FONT,
                  fontSize: 14,
                  fontWeight: 750,
                  color: "#142238",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {userName}
              </Typography>

              {/* ACTUAL JOB DESIGNATION */}

              <Typography
                sx={{
                  fontFamily: FONT,
                  fontSize: 11.5,
                  color: "#087B4D",
                  fontWeight: 650,
                  mt: 0.35,
                  overflowWrap: "anywhere",
                }}
              >
                {profileTitle}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider
          sx={{
            borderColor: "#EDF1F4",
          }}
        />

        {/* ===================================
            ACCOUNT DETAILS
        =================================== */}

        <Box
          sx={{
            px: 2.2,
            py: 1.6,
          }}
        >
          <Typography
            sx={{
              fontFamily: FONT,
              fontSize: 10,
              fontWeight: 800,
              color: "#98A4B4",
              letterSpacing: 1.4,
              mb: 1.6,
            }}
          >
            ACCOUNT DETAILS
          </Typography>

          {/* FULL NAME */}

          <ProfileDetail
            icon={
              <PersonOutlineRoundedIcon
                sx={{ fontSize: 20 }}
              />
            }
            label="Full Name"
            value={userName}
          />

          {/* JOB DESIGNATION */}

          <ProfileDetail
            icon={
              <BadgeOutlinedIcon
                sx={{ fontSize: 20 }}
              />
            }
            label="Designation"
            value={
              jobDesignation || "Not assigned"
            }
          />

          {/* EMAIL ADDRESS */}

          {email && (
            <ProfileDetail
              icon={
                <MailOutlineRoundedIcon
                  sx={{ fontSize: 20 }}
                />
              }
              label="Email Address"
              value={email}
              last
            />
          )}
        </Box>

        <Divider
          sx={{
            borderColor: "#EDF1F4",
          }}
        />

        {/* ===================================
            FOOTER
        =================================== */}

        <Box
          sx={{
            px: 2.2,
            py: 1.4,
          }}
        >
          <Typography
            sx={{
              fontFamily: FONT,
              fontSize: 11,
              color: "#8A98A8",
              textAlign: "center",
            }}
          >
            HRM Employee Management Portal
          </Typography>
        </Box>
      </Menu>
    </>
  );
}
