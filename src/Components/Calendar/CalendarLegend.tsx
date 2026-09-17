import { Box, Typography } from "@mui/material";
import type { CalendarLegendItem } from "./calendarTheme";

const FONT = "var(--font-family)";

export interface CalendarLegendProps {
  items: CalendarLegendItem[];
  /**
   * `inline` renders a single wrapped row (fits inside a calendar card),
   * `stacked` renders one item per row with its optional note.
   */
  layout?: "inline" | "stacked";
  /** Optional heading – only used by the `stacked` layout */
  title?: string;
  /** Draws a top divider – used when the legend sits inside the calendar card */
  divider?: boolean;
}

/** Colour key of a calendar – reused by the company calendar and attendance pages. */
function CalendarLegend({ items, layout = "inline", title, divider = false }: CalendarLegendProps) {
  if (layout === "stacked") {
    return (
      <Box>
        {title && (
          <Typography
            sx={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 700, color: "#111827", mb: 1.5 }}
          >
            {title}
          </Typography>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          {items.map((item) => (
            <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: item.color,
                  flexShrink: 0,
                }}
              />

              <Typography
                sx={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: "#374151" }}
              >
                {item.label}
              </Typography>

              {item.note && (
                <Typography sx={{ fontFamily: FONT, fontSize: 12, color: "#9CA3AF" }}>
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
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 2.5,
        mt: divider ? 2 : 0,
        pt: divider ? 1.5 : 0,
        borderTop: divider ? "1px solid #F3F4F6" : "none",
      }}
    >
      {items.map((item) => (
        <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: item.color }}
          />
          <Typography
            sx={{ fontFamily: FONT, fontSize: 12.5, color: "#374151", fontWeight: 600 }}
          >
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export default CalendarLegend;