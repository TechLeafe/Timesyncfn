import {
  useState,
  type MouseEvent,
} from "react";

import {
  Avatar,
  Box,
  Menu,
  Typography,
} from "@mui/material";

import KeyboardArrowDownRoundedIcon
  from "@mui/icons-material/KeyboardArrowDownRounded";


const FONT =
  "var(--font-family, 'Inter', sans-serif)";


type StoredUser = {
  userId: string;
  name: string;
  email: string;
  userType: 1 | 2 | 3;
};


const getDesignation = (
  userType?: number
) => {
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


const getStoredUser =
  (): StoredUser | null => {

    try {
      const storedUser =
        localStorage.getItem(
          "loggedInUser"
        );

      return storedUser
        ? JSON.parse(
            storedUser
          ) as StoredUser
        : null;

    } catch {
      return null;
    }
  };


export default function ProfileDropdown() {

  const loggedInUser =
    getStoredUser();

  const userName =
    loggedInUser?.name ||
    loggedInUser?.email ||
    "User";

  const email =
    loggedInUser?.email || "";

  const designation =
    getDesignation(
      loggedInUser?.userType
    );

  const initial =
    userName
      .charAt(0)
      .toUpperCase();


  /* =========================================================
     DROPDOWN
  ========================================================= */

  const [
    anchorEl,
    setAnchorEl,
  ] =
    useState<HTMLElement | null>(
      null
    );

  const open =
    Boolean(anchorEl);


  const handleOpen = (
    event:
      MouseEvent<HTMLElement>
  ) => {
    setAnchorEl(
      event.currentTarget
    );
  };


  const handleClose = () => {
    setAnchorEl(null);
  };


  /* =========================================================
     UI
  ========================================================= */

  return (
    <>

      {/* =========================
          PROFILE BUTTON
      ========================= */}

      <Box
        onClick={handleOpen}
        sx={{
          display: "flex",

          alignItems: "center",

          gap: {
            xs: 0.5,
            sm: 1.25,
          },

          px: {
            xs: 0.4,
            sm: 1.25,
          },

          py: 0.65,

          borderRadius: "12px",

          userSelect: "none",

          cursor: "pointer",

          transition:
            "background 0.2s ease",

          "&:hover": {
            backgroundColor:
              "#F8FAFC",
          },
        }}
      >

        {/* AVATAR */}

        <Avatar
          alt={userName}
          sx={{
            width: {
              xs: 38,
              sm: 40,
            },

            height: {
              xs: 38,
              sm: 40,
            },

            flexShrink: 0,

            fontWeight: 700,

            fontSize: 15,

            background:
              "linear-gradient(135deg, #176B3A 0%, #0F532C 100%)",

            boxShadow:
              "0 2px 5px rgba(0,0,0,0.08)",

            border:
              "2px solid #FFFFFF",
          }}
        >
          {initial}
        </Avatar>


        {/* NAME + DESIGNATION */}

        <Box
          sx={{
            display: {
              xs: "none",
              sm: "flex",
            },

            flexDirection:
              "column",

            textAlign:
              "left",

            minWidth: 0,
          }}
        >

          <Typography
            sx={{
              fontFamily: FONT,

              fontSize: 13.5,

              fontWeight: 700,

              color: "#111827",

              lineHeight: 1.2,

              maxWidth: 150,

              whiteSpace:
                "nowrap",

              overflow:
                "hidden",

              textOverflow:
                "ellipsis",
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


        {/* ARROW */}

        <KeyboardArrowDownRoundedIcon
          sx={{
            display: {
              xs: "none",
              sm: "block",
            },

            fontSize: 20,

            color: "#667085",

            transition:
              "transform 0.2s ease",

            transform: open
              ? "rotate(180deg)"
              : "rotate(0deg)",
          }}
        />

      </Box>


      {/* =========================
          DROPDOWN
      ========================= */}

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
              mt: 1,

              width: 240,

              maxWidth:
                "calc(100vw - 24px)",

              borderRadius:
                "12px",

              border:
                "1px solid #EAECF0",

              boxShadow:
                "0 10px 30px rgba(16,24,40,0.14)",

              overflow:
                "hidden",
            },
          },
        }}
      >

        {/* =========================
            USER DETAILS
        ========================= */}

        <Box
          sx={{
            display: "flex",

            alignItems:
              "center",

            gap: 1.5,

            px: 2,

            py: 1.8,
          }}
        >

          <Avatar
            sx={{
              width: 42,

              height: 42,

              flexShrink: 0,

              fontWeight: 700,

              background:
                "linear-gradient(135deg, #176B3A 0%, #0F532C 100%)",
            }}
          >
            {initial}
          </Avatar>


          <Box
            sx={{
              minWidth: 0,

              flex: 1,
            }}
          >

            {/* USER NAME */}

            <Typography
              sx={{
                fontFamily: FONT,

                fontSize: 14,

                fontWeight: 700,

                color: "#101828",

                whiteSpace:
                  "nowrap",

                overflow:
                  "hidden",

                textOverflow:
                  "ellipsis",
              }}
            >
              {userName}
            </Typography>


            {/* DESIGNATION */}

            <Typography
              sx={{
                fontFamily: FONT,

                fontSize: 12,

                color: "#667085",

                mt: 0.25,
              }}
            >
              {designation}
            </Typography>


            {/* EMAIL */}

            {email && (

              <Typography
                sx={{
                  fontFamily: FONT,

                  fontSize: 11.5,

                  color: "#98A2B3",

                  mt: 0.4,

                  whiteSpace:
                    "nowrap",

                  overflow:
                    "hidden",

                  textOverflow:
                    "ellipsis",
                }}
              >
                {email}
              </Typography>

            )}

          </Box>

        </Box>

      </Menu>

    </>
  );
}