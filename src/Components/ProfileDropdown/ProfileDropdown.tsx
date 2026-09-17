import { useState } from "react";
import {
  Avatar,
  Box,
  Divider,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CheckIcon from "@mui/icons-material/Check";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { useCurrentUser } from "../../context/UserContext";
import { USERS, type UserProfile } from "../../data/users";

import { useNavigate } from "react-router-dom";

const FONT = "var(--font-family, 'Inter', sans-serif)";

export default function ProfileDropdown() {
  const { currentUser, setCurrentUser } = useCurrentUser(); // Default: Dhamini (HR Manager)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const navigate = useNavigate();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

const handleSelectUser = (user: UserProfile) => {
  setCurrentUser(user);
  handleClose();

  switch (user.role) {
    case "Admin":
      navigate("/admindashboard");
      break;

    case "HR Manager":
      navigate("/hrdashboard");
      break;

    case "Employee":
      navigate("/employeedashboard");
      break;

    default:
      navigate("/admindashboard");
      break;
  }
};

  return (
    <Box>
      {/* ── Trigger Button ── */}
      <Box
        onClick={handleClick}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          cursor: "pointer",
          px: 1.25,
          py: 0.65,
          borderRadius: "12px",
          transition: "all 0.15s ease",
          userSelect: "none",
          border: "1px solid transparent",
          "&:hover": {
            backgroundColor: "#F8FAFC",
            borderColor: "#E2E8F0",
          },
        }}
      >
        {/* Circular profile image */}
        <Avatar
          src={currentUser.avatarUrl}
          alt={currentUser.name}
          sx={{
            width: 36,
            height: 36,
            fontWeight: 700,
            fontSize: 15,
            background: currentUser.avatarBg,
            boxShadow: "0 2px 5px rgba(0,0,0,0.08)",
            border: "2px solid #FFFFFF",
          }}
        >
          {currentUser.name[0]}
        </Avatar>

        {/* Name and Role column */}
        <Box sx={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
          <Typography
            sx={{
              fontFamily: FONT,
              fontSize: 13.5,
              fontWeight: 700,
              color: "#111827",
              lineHeight: 1.2,
            }}
          >
            {currentUser.name}
          </Typography>
          <Typography
            sx={{
              fontFamily: FONT,
              fontSize: 11.5,
              fontWeight: 500,
              color: "#6B7280",
              lineHeight: 1.1,
              mt: 0.2,
            }}
          >
            {currentUser.role}
          </Typography>
        </Box>

        {/* Dropdown Arrow */}
        <KeyboardArrowDownIcon
          sx={{
            fontSize: 18,
            color: "#6B7280",
            transition: "transform 0.2s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            ml: 0.25,
          }}
        />
      </Box>

      {/* ── Clean Dropdown Menu ── */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: 240,
              borderRadius: "14px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
              border: "1px solid #E5E7EB",
              p: 1,
              fontFamily: FONT,
            },
          },
        }}
      >
        <Box sx={{ px: 1.5, py: 0.75, mb: 0.5 }}>
          <Typography sx={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Switch Account / Role
          </Typography>
        </Box>

        {USERS.map((user) => {
          const isSelected = user.id === currentUser.id;
          return (
            <MenuItem
              key={user.id}
              onClick={() => handleSelectUser(user)}
              sx={{
                borderRadius: "9px",
                py: 1,
                px: 1.25,
                mb: 0.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: isSelected ? "#F3F4F6" : "transparent",
                "&:hover": {
                  backgroundColor: isSelected ? "#E5E7EB" : "#F9FAFB",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                <Avatar
                  src={user.avatarUrl}
                  alt={user.name}
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: 13,
                    fontWeight: 700,
                    background: user.avatarBg,
                  }}
                >
                  {user.name[0]}
                </Avatar>
                <Box>
                  <Typography sx={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#111827", lineHeight: 1.2 }}>
                    {user.name}
                  </Typography>
                  <Typography sx={{ fontFamily: FONT, fontSize: 11, color: "#6B7280", lineHeight: 1.1 }}>
                    {user.role}
                  </Typography>
                </Box>
              </Box>

              {isSelected && <CheckIcon sx={{ fontSize: 16, color: "#1B6B33" }} />}
            </MenuItem>
          );
        })}

        <Divider sx={{ my: 1, borderColor: "#F3F4F6" }} />

        <MenuItem sx={{ borderRadius: "8px", py: 0.85, px: 1.25, color: "#374151" }}>
          <PersonOutlinedIcon sx={{ fontSize: 18, mr: 1.25, color: "#6B7280" }} />
          <Typography sx={{ fontFamily: FONT, fontSize: 13, fontWeight: 500 }}>
            View Profile
          </Typography>
        </MenuItem>

        <MenuItem sx={{ borderRadius: "8px", py: 0.85, px: 1.25, color: "#374151" }}>
          <SettingsOutlinedIcon sx={{ fontSize: 18, mr: 1.25, color: "#6B7280" }} />
          <Typography sx={{ fontFamily: FONT, fontSize: 13, fontWeight: 500 }}>
            Settings
          </Typography>
        </MenuItem>

        <Divider sx={{ my: 1, borderColor: "#F3F4F6" }} />

        <MenuItem
          sx={{
            borderRadius: "8px",
            py: 0.85,
            px: 1.25,
            color: "#D42B2B",
            "&:hover": { backgroundColor: "#FEF2F2" },
          }}
        >
          <LogoutOutlinedIcon sx={{ fontSize: 18, mr: 1.25, color: "#D42B2B" }} />
          <Typography sx={{ fontFamily: FONT, fontSize: 13, fontWeight: 600 }}>
            Log out
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}
