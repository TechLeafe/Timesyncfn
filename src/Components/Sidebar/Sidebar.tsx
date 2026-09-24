import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import type { ReactNode } from "react";

import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import SpaceDashboardRoundedIcon from "@mui/icons-material/SpaceDashboardRounded";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";

import {
  HR,
  ADMIN,
  EMPLOYEE,
} from "../../data/permissions";

import "./Sidebar.css";


/* =========================================================
   NAV ITEM TYPE
========================================================= */

interface NavItem {
  label: string;
  icon: ReactNode;
  path: string;
  roles: number[];
}


/* =========================================================
   SIDEBAR ITEMS
========================================================= */

const navItems: NavItem[] = [
  /* =========================
     HR DASHBOARD
  ========================= */

  {
    label: "Dashboard",
    icon: <SpaceDashboardRoundedIcon />,
    path: "/hrdashboard",
    roles: [HR],
  },

  /* =========================
     ADMIN DASHBOARD
  ========================= */

  {
    label: "Dashboard",
    icon: <SpaceDashboardRoundedIcon />,
    path: "/admindashboard",
    roles: [ADMIN],
  },

  /* =========================
     EMPLOYEE DASHBOARD
  ========================= */

  {
    label: "Dashboard",
    icon: <SpaceDashboardRoundedIcon />,
    path: "/employeedashboard",
    roles: [EMPLOYEE],
  },

  /* =========================
     EMPLOYEE CREATION
     HR + ADMIN ONLY
  ========================= */

  {
    label: "Employee Creation",
    icon: <PersonAddAltOutlinedIcon />,
    path: "/employee-creation",
    roles: [HR, ADMIN],
  },

  /* =========================
     ATTENDANCE
     ALL ROLES
  ========================= */

  {
    label: "Attendance",
    icon: <FactCheckOutlinedIcon />,
    path: "/attendance",
    roles: [HR, ADMIN, EMPLOYEE],
  },

  /* =========================
     COMPANY CALENDAR
     ALL ROLES
  ========================= */

  {
    label: "Company Calendar",
    icon: <CalendarMonthOutlinedIcon />,
    path: "/calendar",
    roles: [HR, ADMIN, EMPLOYEE],
  },

  /* =========================
     CHECK IN / OUT
     ALL ROLES
  ========================= */

  {
    label: "Check In/Out",
    icon: <AccessTimeOutlinedIcon />,
    path: "/checkinout",
    roles: [HR, ADMIN, EMPLOYEE],
  },
  {
    label: "Leave Policies",
    icon: <EventAvailableOutlinedIcon />,
    path: "/leave-policies",
    roles: [HR, ADMIN, EMPLOYEE],
  },
  // {
  //   label: "Leaves and Permissions",
  //   icon:  <EventAvailableOutlinedIcon sx={{ fontSize: 20 }} />,
  //   path:  "/leaves-permissions",
  // },

  /* =========================
     HOLIDAYS
     HR + ADMIN ONLY
  ========================= */

  {
    label: "Holidays",
    icon: <EventNoteOutlinedIcon />,
    path: "/holiday",
    roles: [HR, ADMIN],
  },

  /* =========================
     LEAVE REQUESTS
     HR + ADMIN ONLY
  ========================= */

  {
    label: "Leave Requests",
    icon: <EventAvailableOutlinedIcon />,
    path: "/admin-leaves-permissions",
    roles: [HR, ADMIN],
  },

  /* =========================
     LEAVES AND PERMISSIONS
     EMPLOYEE ONLY
  ========================= */

  {
    label: "Leaves and Permissions",
    icon: <EventAvailableOutlinedIcon />,
    path: "/employee-leaves-permissions",
    roles: [EMPLOYEE],
  },
];


/* =========================================================
   SIDEBAR COMPONENT

   Real desktops (>= 1200px, MUI's "lg") keep the permanent
   sidebar as before. Anything narrower — phones AND tablets,
   portrait or landscape (iPad landscape is ~1024–1180px,
   comfortably under 1200) — gets an off-canvas drawer instead
   of a shrinking column, opened via a hamburger button that
   lives in MainLayout's header.
========================================================= */

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { pathname } = useLocation();

  const navigate = useNavigate();

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));


  /* =========================================================
     GET LOGGED IN USER
  ========================================================= */

  const storedUser =
    localStorage.getItem("loggedInUser");

  let userType: number | null = null;

  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);

      userType = Number(user.userType);
    } catch {
      userType = null;
    }
  }


  /* =========================================================
     FILTER MENU BASED ON ROLE
  ========================================================= */

  const visibleNavItems =
    userType !== null
      ? navItems.filter((item) =>
          item.roles.includes(userType)
        )
      : [];


  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    /*
      Clear all browser storage used by this app.

      This removes:
      - token
      - loggedInUser
      - employeeLoginSession
      - any other localStorage values
    */

    localStorage.clear();

    /*
      Clear sessionStorage also
    */

    sessionStorage.clear();

    /*
      Reload the application fresh.

      replace() is better than navigate("/login")
      for logout because the current authenticated
      page is replaced in browser history.
    */

    window.location.replace("/login");
  };


  /* =========================================================
     UI
  ========================================================= */

  return (
    <Drawer
      variant={isDesktop ? "permanent" : "temporary"}
      open={isDesktop ? true : mobileOpen}
      onClose={onClose}
      className="sidebar-drawer"
      ModalProps={{ keepMounted: true }}
    >
      {/* =========================
          LOGO
      ========================= */}

      <Box className="sidebar-logo">
        <img
          src="/techleafelogo.png"
          alt="Tech Leafe Technologies"
        />
      </Box>


      {/* =========================
          NAVIGATION
      ========================= */}

      <List className="sidebar-nav">
        {visibleNavItems.map((item) => {
          const isActive =
            pathname === item.path;

          return (
            <ListItemButton
              key={`${item.label}-${item.path}`}
              selected={isActive}
              className={`sidebar-nav-item ${
                isActive
                  ? "sidebar-nav-item-active"
                  : ""
              }`}
              onClick={() => {
                navigate(item.path);
                if (!isDesktop) onClose();
              }}
            >
              <ListItemIcon className="sidebar-nav-icon">
                {item.icon}
              </ListItemIcon>

              <ListItemText
                primary={item.label}
                className="sidebar-nav-text"
              />
            </ListItemButton>
          );
        })}
      </List>


      {/* =========================
          LOGOUT
      ========================= */}

      <Box className="sidebar-bottom">
        <Divider className="sidebar-divider" />

        <ListItemButton
          className="sidebar-logout"
          onClick={handleLogout}
        >
          <ListItemIcon className="sidebar-logout-icon">
            <LogoutOutlinedIcon />
          </ListItemIcon>

          <ListItemText
            primary="Log out"
            className="sidebar-logout-text"
          />
        </ListItemButton>
      </Box>
    </Drawer>
  );
}

export default Sidebar;