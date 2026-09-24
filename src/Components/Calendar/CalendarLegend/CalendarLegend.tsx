import { Box, Typography } from "@mui/material";
import type { CalendarLegendItem } from "../calendarTheme";
import "./CalendarLegend.css";

export interface CalendarLegendProps {
  items: CalendarLegendItem[];
  /**
   * `inline` renders a single wrapped row.
   * `stacked` renders one item per row with its optional note.
   */
  layout?: "inline" | "stacked";
  /** Optional heading – only used by the `stacked` layout */
  title?: string;
  /** Draws a top divider – used when the legend sits inside the calendar card */
  divider?: boolean;
}

// Calendar colour key
function CalendarLegend({
  items,
  layout = "inline",
  title,
  divider = false,
}: CalendarLegendProps) {
  if (layout === "stacked") {
    return (
      <Box className="calendar-legend calendar-legend-stacked">
        {title && (
          <Typography className="calendar-legend-title">
            {title}
          </Typography>
        )}

        <Box className="calendar-legend-stacked-list">
          {items.map((item) => (
            <Box
              key={item.label}
              className="calendar-legend-stacked-item"
            >
              <Box
                className="calendar-legend-dot calendar-legend-dot-stacked"
                sx={{ backgroundColor: item.color }}
              />

              <Typography className="calendar-legend-label">
                {item.label}
              </Typography>

              {item.note && (
                <Typography className="calendar-legend-note">
                  {item.note}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      className={`calendar-legend calendar-legend-inline ${
        divider ? "calendar-legend-with-divider" : ""
      }`}
    >
      {items.map((item) => (
        <Box
          key={item.label}
          className="calendar-legend-inline-item"
        >
          <Box
            className="calendar-legend-dot calendar-legend-dot-inline"
            sx={{ backgroundColor: item.color }}
          />

          <Typography className="calendar-legend-label">
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export default CalendarLegend;

