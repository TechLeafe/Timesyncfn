import { Box, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import "./ChartCard.css";

export interface AllocationPoint {
  project: string;
  members: number;
}

interface TeamAllocationChartProps {
  title?: string;
  subtitle?: string;
  data: AllocationPoint[];
}

const TeamAllocationChart = ({
  title = "Team allocation",
  subtitle = "People working on each project",
  data,
}: TeamAllocationChartProps) => {
  return (
    <Box className="chart-card">
      <Typography className="chart-card__title">{title}</Typography>
      <Typography className="chart-card__subtitle">{subtitle}</Typography>
      <Box className="chart-card__body">
        <BarChart
          dataset={data as unknown as Record<string, unknown>[]}
          xAxis={[{ scaleType: "band", dataKey: "project", tickLabelStyle: { fontSize: 12 } }]}
          series={[{ dataKey: "members", label: "Team members", color: "#4CAF50" }]}
          height={260}
          borderRadius={6}
          hideLegend
        />
      </Box>
    </Box>
  );
};

export default TeamAllocationChart;
