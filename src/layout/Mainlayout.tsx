import {
  useState,
} from "react";

import {
  Box,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import MenuRoundedIcon
  from "@mui/icons-material/MenuRounded";

import {
  Outlet,
  ScrollRestoration,
  useLocation,
} from "react-router-dom";

import Sidebar
  from "../Components/Sidebar/Sidebar";

import ProfileDropdown
  from "../Components/ProfileDropdown/ProfileDropdown";

import "./Mainlayout.css";


/* =========================================================
   PAGE TITLES
========================================================= */

const pageTitles:
  Record<string, string> = {

  "/admindashboard":
    "Dashboard",

  "/hrdashboard":
    "Dashboard",

  "/employeedashboard":
    "Dashboard",

  "/employees":
    "Employees",

  "/employee-creation":
    "Employee Creation",

  "/calendar":
    "Company Calendar",

  "/attendance":
    "Attendance",

  "/leaves-permissions":
    "Leaves and Permissions",

  "/checkinout":
    "Check In / Check Out",

  "/employee-management":
    "Employee Management",

  "/leave-policies":
    "Leave Policies",

  "/holiday":
    "Holidays",

  "/admin-leaves-permissions":
    "Leave Requests",

  "/employee-leaves-permissions":
    "Leaves and Permissions",

  "/roles":
    "Roles",

  "/settings":
    "Settings",
};


/* =========================================================
   MAIN LAYOUT
========================================================= */

const MainLayout = () => {

  const { pathname } =
    useLocation();

  const theme =
    useTheme();

  const isMobile =
    useMediaQuery(
      theme.breakpoints.down("md")
    );

  const [mobileOpen, setMobileOpen] =
    useState(false);


  /* =========================================================
     PAGE TITLE
  ========================================================= */

  const getPageTitle = () => {

    if (
      pathname === "/daily-task" ||
      pathname.startsWith(
        "/daily-task/"
      )
    ) {
      return "Daily Tasks";
    }

    return (
      pageTitles[pathname] ||
      ""
    );
  };

  const pageTitle =
    getPageTitle();


  /* =========================================================
     UI
  ========================================================= */

  return (
    <Box className="main-layout">

      <ScrollRestoration />


      {/* =========================
          SIDEBAR
      ========================= */}

      <Sidebar
        mobileOpen={mobileOpen}
        isMobile={isMobile}
        onClose={() =>
          setMobileOpen(false)
        }
      />


      {/* =========================
          MAIN AREA
      ========================= */}

      <Box
        component="main"
        className="main-content"
      >

        {/* =========================
            TOP HEADER
        ========================= */}

        <Box className="page-header">

          <Box className="page-header-left">

            {isMobile && (

              <IconButton
                className="mobile-menu-button"
                onClick={() =>
                  setMobileOpen(true)
                }
                aria-label="Open navigation menu"
              >
                <MenuRoundedIcon />
              </IconButton>

            )}


            <Typography
              className="page-title"
            >
              {pageTitle}
            </Typography>

          </Box>


          <Box className="page-header-profile">

            <ProfileDropdown />

          </Box>

        </Box>


        {/* =========================
            PAGE
        ========================= */}

        <Box className="page-content">

          <Outlet />

        </Box>

      </Box>

    </Box>
  );
};

export default MainLayout;