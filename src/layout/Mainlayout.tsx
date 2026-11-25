
import { useEffect, useState } from "react";
import { Suspense } from "react";
import GlobalLoader from "../Components/Loader/GlobalLoader";
import ClassicSpinner from "../Components/Loader/ClassicSpinner";

import {
  Box,
  IconButton,
  Typography,
  useMediaQuery,
} from "@mui/material";

import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

import {
  Outlet,
  ScrollRestoration,
  useLocation,
} from "react-router-dom";

import Sidebar from "../Components/Sidebar/Sidebar";
import ProfileDropdown from "../Components/ProfileDropdown/ProfileDropdown";
import BirthdayFooter from "../Components/BirthdayFooter/BirthdayFooter";

// Employee Support popup
import EmployeeSupportDialog from "../Components/support/EmployeeSupportDialog";

import "./Mainlayout.css";

/* ==========================================
   PAGE TITLES
========================================== */

const pageTitles: Record<string, string> = {
  "/admindashboard": "Admin Control Center",
  "/hrdashboard": "HR Management Hub",
  "/employeedashboard": "My TimeSync Hub",
  "/employees": "Employees",
  "/employee-creation": "Employee Creation",
  "/calendar": "Company Calendar",
  "/attendance": "Attendance",
  "/leaves-permissions": "Leaves and Permissions",
  "/checkinout": "Check In / Out",
  "/employee-management": "Employee Check In / Out",
  "/leave-policies": "Employee Leave",
  "/holiday": "Company Holidays",
  "/admin-leaves-permissions": "Leaves & Permissions",
  "/employee-leaves-permissions": "Leaves and Permissions",
  "/daily-task": "Daily Tasks",
  "/roles": "Roles",
  "/settings": "Settings",
  "/birthday-creation": "Birthday Celebrations",
};

/* ==========================================
   PAGE SUBTITLES
========================================== */

const pageSubtitles: Record<string, string> = {
  "/checkinout":
    "Manage your daily attendance and track your working session.",

  "/admin-leaves-permissions":
    "Review and manage employee leave and permission requests.",

  "/employee-leaves-permissions":
    "Apply for time off and track your requests.",

  "/employee-management":
    "Manage your daily attendance and track your working session.",

  "/holiday":
    "Manage public and company holidays for your employees.",

  "/birthday-creation":
    "Keep every birthday special by managing employee details and upcoming celebrations.",

  "/employee-creation":
    "Manage employee profiles, roles, and workplace details.",

  "/daily-task":
    "Stay organized and manage daily work efficiently.",

  "/leave-policies":
    "Stay informed about your leave benefits and available days.",

  "/employeedashboard":
    "Stay in sync with your workday, celebrate your progress, and make every moment count.",

  "/admindashboard":
    "Manage employees, attendance, and operations effortlessly.",

  "/hrdashboard":
    "Simplify employee management, attendance, and leave tracking.",
};

/* ==========================================
   MAIN LAYOUT COMPONENT
========================================== */

const MainLayout = () => {
  const { pathname } = useLocation();

  /* ==========================================
     PAGE DETAILS
  ========================================== */

  const isCheckInOutPage = pathname === "/checkinout";

  const isAdminLeavesPage =
    pathname === "/admin-leaves-permissions";

  const pageTitle =
    pathname === "/daily-task" ||
    pathname.startsWith("/daily-task/")
      ? "Daily Tasks"
      : pageTitles[pathname] ?? "";

  const pageSubtitle = pageSubtitles[pathname] ?? "";

  /* ==========================================
     RESPONSIVE SIDEBAR
  ========================================== */

  const isMobile = useMediaQuery("(max-width:899.98px)");

  const [mobileOpen, setMobileOpen] = useState(false);

  /* ==========================================
     EMPLOYEE SUPPORT POPUP STATE
  ========================================== */

  const [supportOpen, setSupportOpen] = useState(false);

  /* ==========================================
     OPEN SUPPORT POPUP
  ========================================== */

  const handleOpenSupport = () => {
    setMobileOpen(false);
    setSupportOpen(true);
  };

  /* ==========================================
     CLOSE SUPPORT POPUP
  ========================================== */

  const handleCloseSupport = () => {
    setSupportOpen(false);
  };

  /* ==========================================
     CLOSE MOBILE SIDEBAR AFTER NAVIGATION
  ========================================== */

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  /* ==========================================
     DIWALI BANNER
  ========================================== */

  const showDiwaliBanner = false;

  return (
    <Box className="app-main-layout app-main-layout-birthday-footer">
      <ScrollRestoration />

      {/* ======================================
          SIDEBAR
      ====================================== */}

      <Sidebar
        mobileOpen={mobileOpen}
        isMobile={isMobile}
        onClose={() => setMobileOpen(false)}
        onOpenSupport={handleOpenSupport}
      />

      {/* ======================================
          MAIN CONTENT
      ====================================== */}

      <Box
        component="main"
        className="app-main-content"
      >
        {/* ====================================
            PAGE HEADER
        ==================================== */}

        <Box
          component="header"
          className={`app-page-header ${
            isCheckInOutPage
              ? "app-page-header-attendance"
              : ""
          } ${
            isAdminLeavesPage
              ? "app-page-header-leaves-admin"
              : ""
          }`}
        >
          {/* HEADER LEFT */}

          <Box className="app-page-header-left">
            {isMobile && (
              <IconButton
                className="app-mobile-menu-button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
              >
                <MenuRoundedIcon />
              </IconButton>
            )}

            {/* PAGE TITLE AND SUBTITLE */}

            <Box
              className="app-page-heading-with-subtitle"
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                minWidth: 0,
              }}
            >
              <Typography
                component="h1"
                className="app-page-title"
                sx={{
                  fontSize: {
                    xs: "18px",
                    md: "22px",
                  },
                  fontWeight: 600,
                  color: "#14233B",
                  lineHeight: 1.3,
                  margin: 0,
                }}
              >
                {pageTitle}
              </Typography>

              {pageSubtitle && (
                <Typography
                  component="p"
                  className="app-page-subtitle"
                  sx={{
                    fontSize: {
                      xs: "11px",
                      md: "13px",
                    },
                    fontWeight: 400,
                    color: "#8191A8",
                    mt: 0.5,
                    lineHeight: 1.5,
                  }}
                >
                  {pageSubtitle}
                </Typography>
              )}
            </Box>
          </Box>

          {/* ====================================
              EMPLOYEE PROFILE
          ==================================== */}

          <Box className="app-page-header-profile">
            <ProfileDropdown />
          </Box>
        </Box>

        {/* ====================================
            PAGE CONTENT
        ==================================== */}

        
        {/* ====================================
            PAGE CONTENT
        ==================================== */}

        <Box
          className="app-page-content"
          sx={{ position: "relative" }}
        >
          <Suspense
            fallback={
              <Box
                className="global-loader-overlay"
                role="status"
                aria-label="Loading page"
              >
                <ClassicSpinner />
              </Box>
            }
          >
            <Outlet />
          </Suspense>

          <GlobalLoader />
        </Box>

      </Box> {/* This closes app-main-content */}


      {/* ======================================
          EMPLOYEE SUPPORT POPUP
      ====================================== */}

      <EmployeeSupportDialog
        open={supportOpen}
        onClose={handleCloseSupport}
      />

      {/* ======================================
          DIWALI CELEBRATION BANNER
      ====================================== */}

      {showDiwaliBanner && <BirthdayFooter />}
    </Box>
  );
};

export default MainLayout;
