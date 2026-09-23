import {
  Avatar,
  Box,
  Typography,
} from "@mui/material";

const FONT = "var(--font-family, 'Inter', sans-serif)";

type StoredUser = {
  userId: string;
  name: string;
  email: string;
  userType: 1 | 2 | 3;
};

const getDesignation = (userType?: number) => {
  switch (userType) {
    case 1:
      return "HR Manager";
    case 2:
      return "Admin";
    case 3:
      return "Employee";
    default:
      return "User";
  }
};

const getStoredUser = (): StoredUser | null => {
  try {
    const storedUser = localStorage.getItem("loggedInUser");

    return storedUser
      ? JSON.parse(storedUser) as StoredUser
      : null;
  } catch {
    return null;
  }
};

export default function ProfileDropdown() {
  const loggedInUser = getStoredUser();
  const userName = loggedInUser?.name || loggedInUser?.email || "User";
  const designation = getDesignation(loggedInUser?.userType);
  const initial = userName.charAt(0).toUpperCase();

  return (
    <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          px: 1.25,
          py: 0.65,
          borderRadius: "12px",
          userSelect: "none",
        }}
      >
        <Avatar
          alt={userName}
          sx={{
            width: 36,
            height: 36,
            fontWeight: 700,
            fontSize: 15,
            background: "linear-gradient(135deg, #176B3A 0%, #0F532C 100%)",
            boxShadow: "0 2px 5px rgba(0,0,0,0.08)",
            border: "2px solid #FFFFFF",
          }}
        >
          {initial}
        </Avatar>

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
            {userName}
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
            {designation}
          </Typography>
        </Box>
      </Box>
  );
}
