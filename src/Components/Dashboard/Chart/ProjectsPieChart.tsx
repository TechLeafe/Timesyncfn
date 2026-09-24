import {
  Box,
  Typography,
} from "@mui/material";

import {
  PieChart,
} from "@mui/x-charts/PieChart";

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
  "#16803C",
];


const ProjectsPieChart = ({
  title = "Projects overview",
  subtitle = "Distribution by status",
  data,
}: ProjectsPieChartProps) => {

  const chartData =
    data.map(
      (slice, index) => ({
        id: index,

        label:
          slice.label,

        value:
          slice.value,

        color:
          GREEN_SHADES[
            index %
            GREEN_SHADES.length
          ],
      })
    );


  return (
    <Box className="chart-card">

      {/* TITLE */}

      <Typography
        className="chart-card__title"
      >
        {title}
      </Typography>


      {/* SUBTITLE */}

      <Typography
        className="chart-card__subtitle"
      >
        {subtitle}
      </Typography>


      {/* CHART */}

      <Box
        className="
          chart-card__body
          chart-card__body--pie
        "
      >

        <Box className="chart-card__pie-layout">

          {/* PIE */}

          <Box className="chart-card__pie-chart">

            <PieChart
              series={[
                {
                  data:
                    chartData,

                  innerRadius: 52,

                  outerRadius: 88,

                  paddingAngle: 2,

                  cornerRadius: 4,

                  highlightScope: {
                    fade: "global",
                    highlight: "item",
                  },
                },
              ]}

              height={230}

              hideLegend
            />

          </Box>


          {/* CUSTOM LEGEND */}

          <Box className="chart-card__legend">

            {chartData.map(
              (item) => (

                <Box
                  key={item.id}
                  className="chart-card__legend-item"
                >

                  <Box
                    className="chart-card__legend-dot"
                    sx={{
                      backgroundColor:
                        item.color,
                    }}
                  />

                  <Typography
                    className="chart-card__legend-text"
                  >
                    {item.label}
                  </Typography>

                </Box>

              )
            )}

          </Box>

        </Box>

      </Box>

    </Box>
  );
};


export default ProjectsPieChart;