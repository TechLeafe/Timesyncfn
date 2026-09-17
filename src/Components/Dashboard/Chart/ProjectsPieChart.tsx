import { Box, Typography } from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import "./ChartCard.css";

export interface ProjectSlice {
  label: string;
  value: number;
}

interface ProjectsPieChartProps {
  title?: string;
  subtitle?: string;
  data: ProjectSlice[];
}

const GREEN_SHADES = [
  "#1B6B33",
  "#2E7D32",
  "#4CAF50",
];

const ProjectsPieChart = ({
  title = "Projects overview",
  subtitle = "Distribution by status",
  data,
}: ProjectsPieChartProps) => {
  return (
    <Box className="chart-card">
      <Typography className="chart-card__title">{title}</Typography>
      <Typography className="chart-card__subtitle">{subtitle}</Typography>
      <Box className="chart-card__body">
        <PieChart
          series={[
            {
              data: data.map((slice, index) => ({
                id: index,
                label: slice.label,
                value: slice.value,
                color: GREEN_SHADES[index % GREEN_SHADES.length],
              })),
              innerRadius: 55,
              outerRadius: 100,
              paddingAngle: 2,
              cornerRadius: 4,
              highlightScope: { fade: "global", highlight: "item" },
            },
          ]}
          height={260}
          slotProps={{
            legend: {
              direction: "vertical",
              position: { vertical: "middle", horizontal: "end" },
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default ProjectsPieChart;
