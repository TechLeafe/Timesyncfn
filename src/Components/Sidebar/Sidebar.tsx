// import { useLocation, useNavigate } from "react-router-dom";
// import type { ReactNode } from "react";

// import {
//   Box,
//   Drawer,
//   List,
//   ListItemButton,
//   ListItemIcon,
//   ListItemText,
//   Divider,
// } from "@mui/material";

// import SpaceDashboardRoundedIcon from "@mui/icons-material/SpaceDashboardRounded";
// import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
// import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
// import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
// import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
// import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
// import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

// import "./Sidebar.css";

// interface NavItem {
//   label: string;
//   icon: ReactNode;
//   path?: string;
// }

// const navItems: NavItem[] = [
//   {
//     label: "Dashboard",
//     icon: <SpaceDashboardRoundedIcon />,
//     path: "/admindashboard",
//   },
//   {
//     label: "Employee Creation",
//     icon: <AccessTimeOutlinedIcon />,
//     path: "/employee-creation",
//   },
//   {
//     label: "Timesheet",
//     icon: <AccessTimeOutlinedIcon />,
//   },
//   {
//     label: "Attendance",
//     icon: <FactCheckOutlinedIcon />,
//     path: "/attendance",
//   },
//   {
//     label: "Monthly Report",
//     icon: <BarChartOutlinedIcon />,
//   },
//   {
//     label: "Company Calendar",
//     icon: <CalendarMonthOutlinedIcon />,
//     path: "/calendar",
//   },
//   {
//     label: "Check In/Out",
//     icon: <AccessTimeOutlinedIcon />,
//     path: "/checkinout",
//   },
//   {
//     label: "Leaves and Permissions",
//     icon: <EventAvailableOutlinedIcon />,
//     path: "/leaves-permissions",
//   },
// ];

// function Sidebar() {
//   const { pathname } = useLocation();
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("loggedInUser");
//     localStorage.removeItem("employeeLoginSession");

//     navigate("/login");
//   };

//   return (
//     <Drawer
//       variant="permanent"
//       className="sidebar-drawer"
//     >
//       {/* Logo */}
//       <Box className="sidebar-logo">
//         <img
//           src="/techleafelogo.png"
//           alt="Tech Leafe Technologies"
//         />
//       </Box>

//       {/* Navigation */}
//       <List className="sidebar-nav">
//         {navItems.map((item) => {
//           const isActive =
//             item.path !== undefined &&
//             item.path === pathname;

//           return (
//             <ListItemButton
//               key={item.label}
//               selected={isActive}
//               className={`sidebar-nav-item ${
//                 isActive ? "sidebar-nav-item-active" : ""
//               }`}
//               onClick={() => {
//                 if (item.path) {
//                   navigate(item.path);
//                 }
//               }}
//             >
//               <ListItemIcon className="sidebar-nav-icon">
//                 {item.icon}
//               </ListItemIcon>

//               <ListItemText
//                 primary={item.label}
//                 className="sidebar-nav-text"
//               />
//             </ListItemButton>
//           );
//         })}
//       </List>

//       {/* Bottom Logout */}
//       <Box className="sidebar-bottom">
//         <Divider className="sidebar-divider" />

//         <ListItemButton
//           className="sidebar-logout"
//           onClick={handleLogout}
//         >
//           <ListItemIcon className="sidebar-logout-icon">
//             <LogoutOutlinedIcon />
//           </ListItemIcon>

//           <ListItemText
//             primary="Log out"
//             className="sidebar-logout-text"
//           />
//         </ListItemButton>
//       </Box>
//     </Drawer>
//   );
// }

// export default Sidebar;
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

import {
  HR,
  ADMIN,
  EMPLOYEE,
} from "../../data/permissions";

import "./Sidebar.css";

interface NavItem {
  label: string;
  icon: ReactNode;
  path: string;
  roles: number[];
}

const navItems: NavItem[] = [
  // =========================
  // HR Dashboard
  // =========================
  {
    label: "Dashboard",
    icon: <SpaceDashboardRoundedIcon />,
    path: "/hrdashboard",
    roles: [HR],
  },

  // =========================
  // Admin Dashboard
  // =========================
  {
    label: "Dashboard",
    icon: <SpaceDashboardRoundedIcon />,
    path: "/admindashboard",
    roles: [ADMIN],
  },

  // =========================
  // Employee Dashboard
  // =========================
  {
    label: "Dashboard",
    icon: <SpaceDashboardRoundedIcon />,
    path: "/employeedashboard",
    roles: [EMPLOYEE],
  },

  // =========================
  // HR + Admin only
  // =========================
  {
    label: "Employee Creation",
    icon: <PersonAddAltOutlinedIcon />,
    path: "/employee-creation",
    roles: [HR, ADMIN],
  },

  // =========================
  // All roles
  // =========================
  {
    label: "Attendance",
    icon: <FactCheckOutlinedIcon />,
    path: "/attendance",
    roles: [HR, ADMIN, EMPLOYEE],
  },

  // =========================
  // All roles
  // =========================
  {
    label: "Company Calendar",
    icon: <CalendarMonthOutlinedIcon />,
    path: "/calendar",
    roles: [HR, ADMIN, EMPLOYEE],
  },

  // =========================
  // All roles
  // =========================
  {
    label: "Check In/Out",
    icon: <AccessTimeOutlinedIcon />,
    path: "/checkinout",
    roles: [HR, ADMIN, EMPLOYEE],
  },

  // =========================
  // Holiday - HR + Admin only
  // =========================
  {
    label: "Holidays",
    icon: <EventNoteOutlinedIcon />,
    path: "/holiday",
    roles: [HR, ADMIN],
  },

  // =========================
  // HR + Admin
  // =========================
  {
    label: "Leave Requests",
    icon: <EventAvailableOutlinedIcon />,
    path: "/leaves-permissions",
    roles: [HR, ADMIN],
  },

  // =========================
  // Employee
  // =========================
  {
    label: "Leaves and Permissions",
    icon: <EventAvailableOutlinedIcon />,
    path: "/leaves-permissions",
    roles: [EMPLOYEE],
  },
];

function Sidebar() {
  const { pathname } = useLocation();

  const navigate = useNavigate();

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

  // Show sidebar items based on user role
  const visibleNavItems =
    userType !== null
      ? navItems.filter((item) =>
          item.roles.includes(userType)
        )
      : [];

  const handleLogout = () => {
    localStorage.removeItem("token");

    localStorage.removeItem(
      "loggedInUser"
    );

    localStorage.removeItem(
      "employeeLoginSession"
    );

    navigate("/login");
  };

  return (
    <Drawer
      variant="permanent"
      className="sidebar-drawer"
    >
      {/* Logo */}
      <Box className="sidebar-logo">
        <img
          src="/techleafelogo.png"
          alt="Tech Leafe Technologies"
        />
      </Box>

      {/* Navigation */}
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

      {/* Logout */}
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