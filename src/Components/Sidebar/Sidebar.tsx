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

import SpaceDashboardRoundedIcon
  from "@mui/icons-material/SpaceDashboardRounded";

import AccessTimeOutlinedIcon
  from "@mui/icons-material/AccessTimeOutlined";

import FactCheckOutlinedIcon
  from "@mui/icons-material/FactCheckOutlined";

import CalendarMonthOutlinedIcon
  from "@mui/icons-material/CalendarMonthOutlined";

import EventAvailableOutlinedIcon
  from "@mui/icons-material/EventAvailableOutlined";

import EventNoteOutlinedIcon
  from "@mui/icons-material/EventNoteOutlined";

import LogoutOutlinedIcon
  from "@mui/icons-material/LogoutOutlined";

import PersonAddAltOutlinedIcon
  from "@mui/icons-material/PersonAddAltOutlined";

import ManageAccountsOutlinedIcon
  from "@mui/icons-material/ManageAccountsOutlined";

import TaskAltOutlinedIcon
  from "@mui/icons-material/TaskAltOutlined";

import {
  HR,
  ADMIN,
  EMPLOYEE,
} from "../../data/permissions";

import "./Sidebar.css";


/* =========================================================
   PROPS
========================================================= */

interface SidebarProps {
  mobileOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
}


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
  {
    label: "Dashboard",
    icon: <SpaceDashboardRoundedIcon />,
    path: "/hrdashboard",
    roles: [HR],
  },

  {
    label: "Dashboard",
    icon: <SpaceDashboardRoundedIcon />,
    path: "/admindashboard",
    roles: [ADMIN],
  },

  {
    label: "Dashboard",
    icon: <SpaceDashboardRoundedIcon />,
    path: "/employeedashboard",
    roles: [EMPLOYEE],
  },

  {
    label: "Daily Task",
    icon: <TaskAltOutlinedIcon />,
    path: "/daily-task",
    roles: [ADMIN],
  },

  {
    label: "Employee Creation",
    icon: <PersonAddAltOutlinedIcon />,
    path: "/employee-creation",
    roles: [HR, ADMIN],
  },

  {
    label: "Employee Management",
    icon: <ManageAccountsOutlinedIcon />,
    path: "/employee-management",
    roles: [HR, ADMIN],
  },

  {
    label: "Attendance",
    icon: <FactCheckOutlinedIcon />,
    path: "/attendance",
    roles: [HR, ADMIN, EMPLOYEE],
  },

  {
    label: "Company Calendar",
    icon: <CalendarMonthOutlinedIcon />,
    path: "/calendar",
    roles: [HR, ADMIN, EMPLOYEE],
  },

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

  {
    label: "Holidays",
    icon: <EventNoteOutlinedIcon />,
    path: "/holiday",
    roles: [HR, ADMIN],
  },

  {
    label: "Leave Requests",
    icon: <EventAvailableOutlinedIcon />,
    path: "/admin-leaves-permissions",
    roles: [HR, ADMIN],
  },

  {
    label: "Leaves and Permissions",
    icon: <EventAvailableOutlinedIcon />,
    path: "/employee-leaves-permissions",
    roles: [EMPLOYEE],
  },
];


/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({
  mobileOpen,
  isMobile,
  onClose,
}: SidebarProps) {

  const { pathname } = useLocation();

  const navigate = useNavigate();


  /* =========================================================
     GET USER ROLE
  ========================================================= */

  const storedUser =
    localStorage.getItem("loggedInUser");

  let userType: number | null = null;

  if (storedUser) {
    try {
      const user =
        JSON.parse(storedUser);

      userType =
        Number(user.userType);

    } catch {
      userType = null;
    }
  }


  /* =========================================================
     FILTER NAVIGATION
  ========================================================= */

  const visibleNavItems =
    userType !== null
      ? navItems.filter((item) =>
          item.roles.includes(userType)
        )
      : [];


  /* =========================================================
     NAVIGATION
  ========================================================= */

  const handleNavigate = (
    path: string
  ) => {
    navigate(path);

    if (isMobile) {
      onClose();
    }
  };


  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {

    localStorage.clear();

    sessionStorage.clear();

    window.location.replace("/login");
  };


  /* =========================================================
     SIDEBAR CONTENT
  ========================================================= */

  const sidebarContent = (
    <Box className="sidebar-container">

      {/* LOGO */}

      <Box className="sidebar-logo">

        <img
          src="/techleafelogo.png"
          alt="Tech Leafe Technologies"
        />

      </Box>


      {/* NAVIGATION */}

      <List className="sidebar-nav">

        {visibleNavItems.map((item) => {

          const isActive =
            pathname === item.path ||
            pathname.startsWith(
              `${item.path}/`
            );

          return (

            <ListItemButton
              key={`${item.label}-${item.path}`}
              selected={isActive}
              className={
                `sidebar-nav-item ${
                  isActive
                    ? "sidebar-nav-item-active"
                    : ""
                }`
              }
              onClick={() =>
                handleNavigate(item.path)
              }
            >

              <ListItemIcon
                className="sidebar-nav-icon"
              >
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


      {/* LOGOUT */}

      <Box className="sidebar-bottom">

        <Divider
          className="sidebar-divider"
        />

        <ListItemButton
          className="sidebar-logout"
          onClick={handleLogout}
        >

          <ListItemIcon
            className="sidebar-logout-icon"
          >
            <LogoutOutlinedIcon />
          </ListItemIcon>

          <ListItemText
            primary="Log out"
            className="sidebar-logout-text"
          />

        </ListItemButton>

      </Box>

    </Box>
  );


  /* =========================================================
     DRAWER
  ========================================================= */

  return (
    <Drawer
      variant={
        isMobile
          ? "temporary"
          : "permanent"
      }
      open={
        isMobile
          ? mobileOpen
          : true
      }
      onClose={onClose}
      ModalProps={{
        keepMounted: true,
      }}
      className={
        isMobile
          ? "sidebar-drawer sidebar-drawer-mobile"
          : "sidebar-drawer"
      }
    >
      {sidebarContent}
    </Drawer>
  );
}

export default Sidebar;