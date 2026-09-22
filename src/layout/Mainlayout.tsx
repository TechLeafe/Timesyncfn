import { Box, Typography } from "@mui/material";
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
  "/checkin-checkout": "Check In / Check Out",
  "/leave-policies": "Leave Policies",
  "/roles": "Roles",
  "/settings": "Settings",
};

const MainLayout = () => {
  const { pathname } = useLocation();

  const pageTitle = pageTitles[pathname] ;

  return (
    <Box className="main-layout">
      <ScrollRestoration />

      <Sidebar />

      <Box component="main" className="main-content">
        <Box className="page-header" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography className="page-title">
            {pageTitle}
          </Typography>

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