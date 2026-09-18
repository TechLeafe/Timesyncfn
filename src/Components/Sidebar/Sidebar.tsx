import { useLocation, useNavigate } from "react-router-dom";
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
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import techLeafeLogo from "../../../public/techleafelogo.png";

const DRAWER_WIDTH = 240;

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard",       icon: <SpaceDashboardRoundedIcon        sx={{ fontSize: 20 }}/>, path: "/admindashboard" },
  { label: "Employee Creation", icon: <AccessTimeOutlinedIcon        sx={{ fontSize: 20 }} />, path: "/employee-creation" },
  { label: "Timesheet",        icon: <AccessTimeOutlinedIcon      sx={{ fontSize: 20 }} /> },
  {
    label: "Attendance",
    icon:  <FactCheckOutlinedIcon sx={{ fontSize: 20 }} />,
    path:  "/attendance",
  },
  { label: "Monthly Report",   icon: <BarChartOutlinedIcon        sx={{ fontSize: 20 }} /> },
  {
    label: "Company Calendar",
    icon:  <CalendarMonthOutlinedIcon sx={{ fontSize: 20 }} />,
    path:  "/calendar",
  },
  {
    label: "Check In/Out",
    icon:  <AccessTimeOutlinedIcon sx={{ fontSize: 20 }} />,
    path:  "/checkinout",
  },
  {
    label: "Leaves and Permissions",
    icon:  <EventAvailableOutlinedIcon sx={{ fontSize: 20 }} />,
    path:  "/leaves-permissions",
  },
];

const FONT       = "var(--font-family)";
const GREEN      = "#1B6B33";
const GREEN_PALE = "#E8F5E9";
const GRAY_TEXT  = "#4B5563";
const GRAY_ICON  = "#6B7280";

function Sidebar() {
  const { pathname } = useLocation();
  const navigate     = useNavigate();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          borderRight: "1px solid #E5E7EB",
          backgroundColor: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          overflowX: "hidden",
        },
      }}
    >
      {/* ── Logo Header ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 2.5,
          py: 2,
          height: 64,
          borderBottom: "1px solid #F3F4F6",
        }}
      >
        <img
          src={techLeafeLogo}
          alt="Tech Leafe Technologies"
          style={{ width: 148, objectFit: "contain" }}
        />
      </Box>

      {/* ── Nav items ── */}
      <List sx={{ px: 1.5, pt: 2, pb: 1, flex: 1 }}>
        {navItems.map((item) => {
          const isActive = item.path !== undefined && item.path === pathname;
          return (
            <ListItemButton
              key={item.label}
              selected={isActive}
              onClick={() => { if (item.path) navigate(item.path); }}
              sx={{
                borderRadius: "10px",
                mb: 0.75,
                py: 1,
                px: 1.5,
                minHeight: 44,
                color: isActive ? GREEN : GRAY_TEXT,
                backgroundColor: isActive ? GREEN_PALE : "transparent",
                transition: "all 0.15s ease",
                "&.Mui-selected": {
                  backgroundColor: GREEN_PALE,
                  color: GREEN,
                },
                "&.Mui-selected:hover": {
                  backgroundColor: GREEN_PALE,
                },
                "&:hover": {
                  backgroundColor: isActive ? GREEN_PALE : "#F9FAFB",
                  color: isActive ? GREEN : "#111827",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 34,
                  color: isActive ? GREEN : GRAY_ICON,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    color: isActive ? GREEN : GRAY_TEXT,
                    sx: {
                      fontFamily: FONT,
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 500,
                      lineHeight: 1.3,
                      WebkitFontSmoothing: "antialiased",
                      letterSpacing: "-0.01em",
                    },
                  },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* ── Bottom Section: Only Log out (Leaf removed) ── */}
      <Box sx={{ px: 1.5, pb: 2, mt: "auto" }}>
        <Divider sx={{ borderColor: "#F3F4F6", mb: 1.5 }} />
        <ListItemButton
          sx={{
            borderRadius: "10px",
            py: 1,
            px: 1.5,
            minHeight: 42,
            color: GRAY_TEXT,
            transition: "all 0.15s ease",
            "&:hover": {
              backgroundColor: "#FEF2F2",
              color: "#D42B2B",
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 34, color: "inherit" }}>
            <LogoutOutlinedIcon sx={{ fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText
            primary="Log out"
            slotProps={{
              primary: {
                color: "inherit",
                sx: {
                  fontFamily: FONT,
                  fontSize: 14,
                  fontWeight: 500,
                  WebkitFontSmoothing: "antialiased",
                },
              },
            }}
          />
        </ListItemButton>
      </Box>
    </Drawer>
  );
}

export default Sidebar;