import { Box, Typography } from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";

import "./ChartCard.css";

/* ==========================================
   INTERFACE
========================================== */

export interface ProjectSlice {
  label: string;
  value: number;
  color?: string;
}

interface ProjectsPieChartProps {
  title?: string;
  subtitle?: string;
  data: ProjectSlice[];
}

/* ==========================================
   DEFAULT CHART COLORS
========================================== */

const GREEN_SHADES = [
  "#1B6B33",
  "#2E7D32",
  "#4CAF50",
  "#16803C",
];

/* ==========================================
   ATTENDANCE STATUS COLORS
========================================== */

const ATTENDANCE_COLORS: Record<string, string> = {
  present: "#16A34A",
  absent: "#EF4444",
  "on leave": "#F59E0B",
  "not checked in": "#3B82F6",
};

/* ==========================================
   PIE CHART COMPONENT
========================================== */

const ProjectsPieChart = ({
  title = "Projects overview",
  subtitle = "Distribution by status",
  data,
}: ProjectsPieChartProps) => {

  const isAttendanceChart = title
    .toLowerCase()
    .includes("attendance");

  /* ==========================================
     CHART DATA
  ========================================== */

  const chartData = data.map((slice, index) => ({
    id: index,

    label: slice.label,

    value: slice.value,

    color:
      slice.color ||
      (isAttendanceChart
        ? ATTENDANCE_COLORS[
            slice.label.trim().toLowerCase()
          ]
        : undefined) ||
      GREEN_SHADES[index % GREEN_SHADES.length],
  }));

  /* ==========================================
     FILTER ACTIVE CHART SEGMENTS
  ========================================== */

  const activeChartData = chartData.filter(
    (item) => item.value > 0
  );

  const activeSlices = activeChartData.length;

  /* ==========================================
     RENDER
  ========================================== */

  return (
    <Box className="chart-card">

      {/* TITLE */}

      <Typography className="chart-card__title">
        {title}
      </Typography>

      {/* SUBTITLE */}

      <Typography className="chart-card__subtitle">
        {subtitle}
      </Typography>

      {/* CHART BODY */}

      <Box
        className="
          chart-card__body
          chart-card__body--pie
        "
      >
        <Box className="chart-card__pie-layout">

          {/* PIE CHART */}

          <Box className="chart-card__pie-chart">

            {activeSlices > 0 ? (

              <PieChart
                series={[
                  {
                    data: activeChartData,

                    innerRadius: 52,

                    outerRadius: 88,

                    startAngle: 0,

                    endAngle: 360,

                    paddingAngle:
                      activeSlices > 1 ? 2 : 0,

                    cornerRadius:
                      activeSlices > 1 ? 4 : 0,

                    highlightScope: {
                      fade: "global",
                      highlight: "item",
                    },
                  },
                ]}

                height={250}

                hideLegend
                
              />

            ) : (

              <Box
                sx={{
                  height: 250,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    color: "#94A3B8",
                  }}
                >
                  No data available
                </Typography>
              </Box>

            )}

          </Box>

          {/* CUSTOM LEGEND */}

          <Box className="chart-card__legend">

            {chartData.map((item) => (

              <Box
                key={item.id}
                className="chart-card__legend-item"
              >

                <Box
                  className="chart-card__legend-dot"
                  sx={{
                    backgroundColor: item.color,
                  }}
                />

                <Typography
                  className="chart-card__legend-text"
                >
                  {item.label}
                </Typography>

              </Box>

            ))}

          </Box>

        </Box>

      </Box>

    </Box>
  );
};

export default ProjectsPieChart;