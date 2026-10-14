
import { useLocation, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Typography,
  Tooltip,
} from "@mui/material";

import SpaceDashboardRoundedIcon from "@mui/icons-material/SpaceDashboardRounded";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";

import { HR, ADMIN, EMPLOYEE } from "../../data/permissions";

import "./Sidebar.css";

interface SidebarProps {
  mobileOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  icon: ReactNode;
  path: string;
  roles: number[];
}

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
    label: "Company Calendar",
    icon: <CalendarMonthOutlinedIcon />,
    path: "/calendar",
    roles: [HR, ADMIN, EMPLOYEE],
  },
  {
    label: "Time Checker",
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
    label: "Leaves Apply",
    icon: <EventAvailableOutlinedIcon />,
    path: "/employee-leaves-permissions",
    roles: [EMPLOYEE],
  },
];

function Sidebar({
  mobileOpen,
  isMobile,
  onClose,
}: SidebarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("loggedInUser");

  let userType: number | null = null;

  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      const parsedType = Number(user.userType);

      userType = Number.isFinite(parsedType)
        ? parsedType
        : null;
    } catch {
      userType = null;
    }
  }

  const visibleNavItems =
    userType !== null
      ? navItems.filter((item) =>
          item.roles.includes(userType)
        )
      : [];

  const handleNavigate = (path: string) => {
    navigate(path);

    if (isMobile) {
      onClose();
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("/login");
  };

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={isMobile ? mobileOpen : true}
      onClose={onClose}
      className={`sidebar-drawer ${
        isMobile
          ? "sidebar-drawer-mobile"
          : "sidebar-drawer-desktop"
      }`}
      ModalProps={
        isMobile ? { keepMounted: true } : undefined
      }
    >
      <Box className="sidebar-container">

        {/* LOGO AND WORKSPACE TITLE */}
        <Box className="sidebar-logo">

          <Box className="sidebar-brand-info">

            <Box className="sidebar-logo-image">
              <img
                src="/hrms logo v 1.6.jpg"
                alt="HRMS Company Logo"
              />
            </Box>

            <Typography className="sidebar-brand-subtitle">
              Employee Workspace
            </Typography>

          </Box>

          {isMobile && (
            <IconButton
              onClick={onClose}
              aria-label="Close navigation"
              className="sidebar-close-button"
              size="small"
            >
              <CloseRoundedIcon />
            </IconButton>
          )}

        </Box>

        {/* MENU TITLE */}
        <Typography
          className="sidebar-section-title"
          component="div"
        >
          WORKSPACE
        </Typography>

        {/* ROLE BASED NAVIGATION */}
        <List
          className="sidebar-nav"
          component="nav"
          aria-label="Main navigation"
        >
          {visibleNavItems.map((item) => {
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
                  handleNavigate(item.path)
                }
              >
                <ListItemIcon className="sidebar-nav-icon">
                  {item.icon}
                </ListItemIcon>

                <ListItemText
                  primary={item.label}
                  className="sidebar-nav-text"
                />

                {isActive && (
                  <span
                    className="sidebar-active-indicator"
                    aria-hidden="true"
                  />
                )}
              </ListItemButton>
            );
          })}
        </List>

        {/* FOOTER */}
        <Box className="sidebar-bottom">

          <Box className="sidebar-support-card">

            <Box className="sidebar-support-icon">
              <SupportAgentOutlinedIcon />
            </Box>

            <Typography className="sidebar-support-title">
              Employee Support
            </Typography>

            <Typography className="sidebar-support-description">
              Need assistance? Contact your HR team.
            </Typography>

          </Box>

          <Divider className="sidebar-divider" />

          <Tooltip title="Log out" placement="right">
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
          </Tooltip>

        </Box>
      </Box>
    </Drawer>
  );
}

export default Sidebar;
