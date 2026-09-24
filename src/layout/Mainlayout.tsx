import {
  useEffect,
  useState,
} from "react";

import {
  Box,
  IconButton,
  Typography,
  useMediaQuery,
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

   isMobile is computed once here — the single source of truth
   for the breakpoint — and passed down to Sidebar, so the
   hamburger button and the drawer's own open/close behavior
   can never disagree about which mode the app is in. The
   breakpoint (899.98px) matches Mainlayout.css's own
   "TABLET + MOBILE" media query exactly.
========================================================= */

const MainLayout = () => {

  const { pathname } =
    useLocation();

  const pageTitle = pageTitles[pathname];

  const isMobile = useMediaQuery("(max-width:899.98px)");

  const [mobileOpen, setMobileOpen] = useState(false);

  /* Always close the off-canvas sidebar on navigation. */
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <Box className="main-layout">

      <ScrollRestoration />

      <Sidebar
        mobileOpen={mobileOpen}
        isMobile={isMobile}
        onClose={() => setMobileOpen(false)}
      />

      <Box component="main" className="main-content">

        <Box className="page-header">

          <Box className="page-header-left">

            {isMobile && (
              <IconButton
                className="mobile-menu-button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation menu"
              >
                <MenuRoundedIcon />
              </IconButton>
            )}

            <Typography className="page-title">
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
