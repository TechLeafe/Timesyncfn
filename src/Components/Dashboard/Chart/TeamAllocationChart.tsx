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

/* ==========================================
   LEAVE STATUS COLORS
========================================== */

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  approved: "#16A34A",
  rejected: "#EF4444",
};

const TeamAllocationChart = ({
  title = "Team allocation",
  subtitle = "People working on each project",
  data,
}: TeamAllocationChartProps) => {

  const hasData = data.some(
    (item) => Number(item.members) > 0
  );

  const chartColors = data.map(
    (item) =>
      STATUS_COLORS[
        item.project.trim().toLowerCase()
      ] || "#4CAF50"
  );

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

      {hasData ? (
        <Box className="chart-card__bar-chart">

          <BarChart
            dataset={
              data as unknown as Record<
                string,
                unknown
              >[]
            }

            xAxis={[
              {
                scaleType: "band",

                dataKey: "project",

                tickLabelStyle: {
                  fontSize: 11,
                },

                colorMap: {
                  type: "ordinal",

                  values: data.map(
                    (item) => item.project
                  ),

                  colors: chartColors,

                  unknownColor: "#4CAF50",
                },
              },
            ]}

            yAxis={[
              {
                min: 0,

                tickLabelStyle: {
                  fontSize: 11,
                },
              },
            ]}

            series={[
              {
                dataKey: "members",

                label: "Requests",

                color: "#4CAF50",
              },
            ]}

            height={250}

            borderRadius={6}

            hideLegend

            margin={{
              left: 38,
              right: 10,
              top: 15,
              bottom: 35,
            }}
          />

        </Box>
      ) : (
        <Box className="chart-card__empty">

          <Typography>
            No leave requests yet
          </Typography>

        </Box>
      )}

    </Box>
  );
};

export default TeamAllocationChart;