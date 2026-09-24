import { useEffect, useState } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";

import Sidebar from "../Components/Sidebar/Sidebar";
import ProfileDropdown from "../Components/ProfileDropdown/ProfileDropdown";
import "./Mainlayout.css";

const pageTitles: Record<string, string> = {
  "/admindashboard": "Dashboard",
  "/employees": "Employees",
  "/employee-creation": "Employee Creation",
  "/calendar": "Company Calendar",
  "/attendance": "Attendance",
  "/leaves-permissions": "Leaves and Permissions",
  "/checkinout": "Check In / Check Out",
  "/employee-management": "Employee Management",
  "/leave-policies": "Leave Policies",
  "/holiday": "Holidays",
  "/roles": "Roles",
  "/settings": "Settings",
};

const MainLayout = () => {
  const { pathname } = useLocation();

  const pageTitle = pageTitles[pathname];

  // The sidebar is a permanent column on real desktops (>= lg) and an
  // off-canvas drawer everywhere narrower (phones and tablets, portrait
  // or landscape) — this state only matters for the off-canvas case.
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Always close the off-canvas sidebar on navigation, as a safety net
  // alongside the click-to-close already wired inside Sidebar itself.
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  return (
    <Box className="main-layout">
      <ScrollRestoration />

      <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      <Box component="main" className="main-content">
        <Box className="page-header" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <IconButton
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
              sx={{ display: { xs: "inline-flex", lg: "none" }, color: "#374151", flexShrink: 0 }}
            >
              <MenuRoundedIcon />
            </IconButton>

            <Typography className="page-title" sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {pageTitle}
            </Typography>
          </Box>

          {/* Profile Dropdown in Top-Right Corner */}
          <ProfileDropdown />
        </Box>

        <Box className="page-content">
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
