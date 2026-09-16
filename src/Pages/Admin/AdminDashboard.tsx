import { Box } from "@mui/material";
import FolderCopyRoundedIcon from "@mui/icons-material/FolderCopyRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import Diversity3RoundedIcon from "@mui/icons-material/Diversity3Rounded";

import StatCard from "../../Components/Admin/StatCard/StatCard"
import ProjectsPieChart from "../../Components/Admin/Chart/ProjectsPieChart"
import TeamAllocationChart from "../../Components/Admin/Chart/TeamAllocationChart"
import type { StatCardProps } from "../../Components/Admin/StatCard/StatCard";
import "./AdminDashboard.css";

const STATS: StatCardProps[] = [
  {
    label: "Total projects",
    value: 18,
    icon: <FolderCopyRoundedIcon fontSize="small" />,
    trend: "+2 this month",
    trendDirection: "up",
  },
  {
    label: "Current projects",
    value: 6,
    icon: <PendingActionsRoundedIcon fontSize="small" />,
    trend: "In progress",
    trendDirection: "neutral",
  },
  {
    label: "Finished projects",
    value: 12,
    icon: <TaskAltRoundedIcon fontSize="small" />,
    trend: "On schedule",
    trendDirection: "up",
  },
  {
    label: "Total employees",
    value: 47,
    icon: <GroupsRoundedIcon fontSize="small" />,
    trend: "Company-wide",
    trendDirection: "neutral",
  },
  {
    label: "Active employees",
    value: 34,
    icon: <Diversity3RoundedIcon fontSize="small" />,
    trend: "Staffed on projects",
    trendDirection: "neutral",
  },
];
//////////////////////////
const PROJECT_DISTRIBUTION = [
  { label: "Total projects", value: 18 },
  { label: "Current projects", value: 6 },
  { label: "Finished projects", value: 12 },
];

const TEAM_ALLOCATION = [
  { project: "Coinstep app", members: 14 },
  { project: "Blockchain project", members: 9 },
  { project: "Internal tools", members: 6 },
  { project: "Other", members: 5 },
];

const AdminDashboard = () => {
  return (
      <Box component="main" className="admin-dashboard__main">
        <Box className="admin-dashboard__stats">
          {STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </Box>

        <Box className="admin-dashboard__charts">
          <ProjectsPieChart
            title="Pie chart based on projects"
            subtitle="Share of active work by project"
            data={PROJECT_DISTRIBUTION}
          />
          <TeamAllocationChart
            title="Graph chart"
            subtitle="How many people worked on Coinstep app vs. Blockchain project"
            data={TEAM_ALLOCATION}
          />
        </Box>
      </Box>
  );
};

export default AdminDashboard;
