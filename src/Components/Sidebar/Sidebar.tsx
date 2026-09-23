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
} from "@mui/material";

import SpaceDashboardRoundedIcon from "@mui/icons-material/SpaceDashboardRounded";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";

/* NEW - DAILY TASK ICON */
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";

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
     DAILY TASK
     ADMIN ONLY
  ========================= */

  {
    label: "Daily Task",
    icon: <TaskAltOutlinedIcon />,
    path: "/daily-task",
    roles: [ADMIN],
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
     EMPLOYEE MANAGEMENT
     (admin view of everyone's check-in/out)
     HR + ADMIN ONLY
  ========================= */

  {
    label: "Employee Management",
    icon: <ManageAccountsOutlinedIcon />,
    path: "/employee-management",
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


  /* =========================
     LEAVE POLICIES
     ALL ROLES
  ========================= */

  {
    label: "Leave Policies",
    icon: <EventAvailableOutlinedIcon />,
    path: "/leave-policies",
    roles: [HR, ADMIN, EMPLOYEE],
  },


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
========================================================= */

function Sidebar() {

  const { pathname } = useLocation();

  const navigate = useNavigate();


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
      Clear localStorage:
      - token
      - loggedInUser
      - employeeLoginSession
      - other stored values
    */

    localStorage.clear();

    /*
      Clear sessionStorage
    */

    sessionStorage.clear();

    /*
      Go to login and remove previous
      authenticated page from history
    */

    window.location.replace("/login");
  };


  /* =========================================================
     UI
  ========================================================= */

  return (
    <Drawer
      variant="permanent"
      className="sidebar-drawer"
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

          /*
            Example:

            /daily-task
            /daily-task/add
            /daily-task/123

            All will keep Daily Task active.
          */

          const isActive =
            pathname === item.path ||
            pathname.startsWith(`${item.path}/`);

          return (
            <ListItemButton
              key={`${item.label}-${item.path}`}
              selected={isActive}
              className={`sidebar-nav-item ${
                isActive
                  ? "sidebar-nav-item-active"
                  : ""
              }`}
              onClick={() =>
                navigate(item.path)
              }
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