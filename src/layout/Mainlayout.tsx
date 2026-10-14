
import { useEffect, useState } from "react";

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

import "./Mainlayout.css";

/* ==========================================
   PAGE TITLES
========================================== */

const pageTitles: Record<string, string> = {
  "/admindashboard": "Dashboard",
  "/hrdashboard": "Dashboard",
  "/employeedashboard": "Dashboard",
  "/employees": "Employees",
  "/employee-creation": "Employee Creation",
  "/calendar": "Company Calendar",
  "/attendance": "Attendance",
  "/leaves-permissions": "Leaves and Permissions",
  "/checkinout": "Time Checker",
  "/employee-management": "Employee Management",
  "/leave-policies": "Leave Policies",
  "/holiday": "Holidays",
  "/admin-leaves-permissions": "Leave Requests",
  "/employee-leaves-permissions": "Leaves and Permissions",
  "/daily-task": "Daily Tasks",
  "/roles": "Roles",
  "/settings": "Settings",
};

const MainLayout = () => {
  const { pathname } = useLocation();

  /* PAGE TITLE */

  const pageTitle =
    pathname === "/daily-task" ||
    pathname.startsWith("/daily-task/")
      ? "Daily Tasks"
      : pageTitles[pathname] ?? "";

  /* RESPONSIVE SIDEBAR */

  const isMobile = useMediaQuery(
    "(max-width:899.98px)"
  );

  const [mobileOpen, setMobileOpen] = useState(false);

  /* CLOSE MOBILE DRAWER AFTER NAVIGATION */

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <Box className="app-main-layout">

      <ScrollRestoration />

      {/* SIDEBAR */}

      <Sidebar
        mobileOpen={mobileOpen}
        isMobile={isMobile}
        onClose={() => setMobileOpen(false)}
      />

      {/* MAIN CONTENT */}

      <Box
        component="main"
        className="app-main-content"
      >

        {/* NAVBAR */}

        <Box
          component="header"
          className="app-page-header"
        >

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

            <Typography
              component="h1"
              className="app-page-title"
            >
              {pageTitle}
            </Typography>
          </Box>

          {/* EMPLOYEE PROFILE */}

          <Box className="app-page-header-profile">
            <ProfileDropdown />
          </Box>
        </Box>

        {/* PAGE CONTENT */}

        <Box className="app-page-content">
          <Outlet />
        </Box>

      </Box>
    </Box>
  );
};

export default MainLayout;
