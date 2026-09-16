import { useMemo } from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CalendarLegend from "./CalendarLegend";
import { CALENDAR_TONES } from "./calendarTheme";
import type { CalendarDayInfo, CalendarDayState, CalendarLegendItem } from "./calendarTheme";
import { isSameDay } from "../../data/calendarEvents";

const FONT     = "var(--font-family)";
const GREEN    = "#1B6B33";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* Neutral grey "overlay" tooltip – matches the rest of the portal */
const TOOLTIP_SX = {
  backgroundColor: "rgba(17, 24, 39, 0.9)",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  color: "#F9FAFB",
  borderRadius: "9px",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.28)",
  px: 1.5,
  py: 0.85,
};

const TOOLTIP_ARROW_SX = { color: "rgba(17, 24, 39, 0.9)" };

export interface MonthCalendarProps {
  /** Any date inside the month that should be rendered */
  visibleMonth: Date;
  /** Called with the first day of the previous / next month */
  onMonthChange: (month: Date) => void;
  selectedDate?: Date | null;
  onSelectDate?: (date: Date) => void;
  today?: Date;
  /** Resolves the colour tone and tooltip of a single day cell */
  getDayInfo?: (date: Date, state: CalendarDayState) => CalendarDayInfo | undefined;
  /** Optional colour legend rendered under the grid */
  legendItems?: CalendarLegendItem[];
  /** Minimum width of the month label – keeps the arrows from jumping around */
  monthLabelMinWidth?: number;
}

/** Builds a 5–6 week matrix (Sun first) that always covers the visible month. */
const buildWeeks = (visibleMonth: Date) => {
  const year  = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDayOffset  = new Date(year, month, 1).getDay();
  const daysInMonth     = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { date: Date; inMonth: boolean }[] = [];

  for (let i = firstDayOffset - 1; i >= 0; i--)
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), inMonth: false });

  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ date: new Date(year, month, d), inMonth: true });

  while (cells.length % 7 !== 0 || cells.length < 35) {
    const last = cells[cells.length - 1].date;
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
  }

  const rows: { date: Date; inMonth: boolean }[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
};

/**
 * Reusable month calendar card – month navigation, weekday header, the day
 * grid with tone-coloured cells / status dots and an optional colour legend.
 * The day colours are supplied by the page through `getDayInfo`.
 */
function MonthCalendar({
  visibleMonth,
  onMonthChange,
  selectedDate = null,
  onSelectDate,
  today,
  getDayInfo,
  legendItems,
  monthLabelMinWidth = 160,
}: MonthCalendarProps) {
  const weeks = useMemo(() => buildWeeks(visibleMonth), [visibleMonth]);
  const monthLabel = visibleMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const shiftMonth = (offset: number) =>
    onMonthChange(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1));

  return (
    <Box
      sx={{
        border: "1px solid #E5E7EB",
        borderRadius: "14px",
        backgroundColor: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        overflow: "hidden",
      }}
    >
      {/* Month navigation – Centered */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          px: 3,
          py: 2,
          borderBottom: "1px solid #F3F4F6",
        }}
      >
        <IconButton
          size="small"
          aria-label="Previous month"
          onClick={() => shiftMonth(-1)}
          sx={{
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            p: 0.6,
            color: "#374151",
            "&:hover": { backgroundColor: "#F9FAFB", borderColor: "#D1D5DB" },
          }}
        >
          <ChevronLeftIcon sx={{ fontSize: 20 }} />
        </IconButton>

        <Typography
          sx={{
            fontFamily: FONT,
            fontSize: 16,
            fontWeight: 700,
            color: "#111827",
            minWidth: monthLabelMinWidth,
            textAlign: "center",
            letterSpacing: "-0.01em",
          }}
        >
          {monthLabel}
        </Typography>

        <IconButton
          size="small"
          aria-label="Next month"
          onClick={() => shiftMonth(1)}
          sx={{
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            p: 0.6,
            color: "#374151",
            "&:hover": { backgroundColor: "#F9FAFB", borderColor: "#D1D5DB" },
          }}
        >
          <ChevronRightIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* Grid body */}
      <Box sx={{ px: 2, pt: 1.5, pb: 2 }}>
        {/* Weekday headers */}
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", mb: 1 }}>
          {WEEKDAYS.map((weekday) => (
            <Typography
              key={weekday}
              align="center"
              sx={{
                fontFamily: FONT,
                fontSize: 12.5,
                fontWeight: 600,
                color: "#9CA3AF",
                py: 0.5,
                letterSpacing: "0.03em",
              }}
            >
              {weekday}
            </Typography>
          ))}
        </Box>

        {/* Day rows */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {weeks.map((row, rowIndex) => (
            <Box key={rowIndex} sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
              {row.map(({ date, inMonth }, cellIndex) => {
                const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
                const isToday    = today ? isSameDay(date, today) : false;
                const isWeekend  = date.getDay() === 0 || date.getDay() === 6;
                const info       = getDayInfo?.(date, { isSelected, isToday, inMonth, isWeekend });

                const palette  = info?.tone ? CALENDAR_TONES[info.tone] : undefined;
                const dotColor = info?.dotColor ?? palette?.dot;
                const showDot  = Boolean(dotColor) && (info?.dot ?? true);

                /* Corner label (e.g. "LP" for a late but present day) – plain
                   text only, it never changes the cell colour */
                const cornerLabel = inMonth ? info?.cornerLabel : undefined;

                /* Cell style – a toned cell always keeps its colour, even when selected */
                let cellBg          = "transparent";
                let cellBorder      = "1px solid #F3F4F6";
                let cellHoverBg     = isSelected ? "#E5E7EB" : "#F9FAFB";
                let cellHoverBorder = isSelected ? "#D1D5DB" : "#E5E7EB";
                let dateColor       = "#111827";
                let dateWeight: number = 500;

                if (palette) {
                  cellBg          = isSelected ? palette.bgStrong : palette.bg;
                  cellBorder      = isSelected ? `1.5px solid ${palette.accent}` : `1.5px solid ${palette.border}`;
                  cellHoverBg     = isSelected ? palette.bgHoverStrong : palette.bgHover;
                  cellHoverBorder = `${palette.accent}55`;
                  dateColor       = info?.dateColor ?? palette.text;
                  dateWeight      = 700;
                } else if (isSelected) {
                  /* Empty date selected – neutral grey (never green) */
                  cellBg     = "#F3F4F6";
                  cellBorder = "1.5px solid #D1D5DB";
                  dateColor  = "#111827";
                  dateWeight = 700;
                }

                if (isToday && !isSelected && !palette) {
                  cellBorder = "1.5px solid #A5D6A7";
                  dateColor  = GREEN;
                }

                const cellContent = (
                  <Box
                    onClick={() => onSelectDate?.(date)}
                    sx={{
                      cursor: onSelectDate ? "pointer" : "default",
                      borderRadius: "10px",
                      position: "relative",
                      height: 68,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: cellBg,
                      border: cellBorder,
                      opacity: inMonth ? 1 : 0.28,
                      transition: "all 0.12s ease",
                      "&:hover": {
                        backgroundColor: cellHoverBg,
                        borderColor: cellHoverBorder,
                        transform: "translateY(-1px)",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.07)",
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: FONT,
                        fontSize: 15,
                        fontWeight: dateWeight,
                        color: dateColor,
                        lineHeight: 1,
                      }}
                    >
                      {date.getDate()}
                    </Typography>

                    {/* Dot indicator */}
                    {showDot && (
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          backgroundColor: dotColor,
                          mt: 0.75,
                        }}
                      />
                    )}

                    {/* Corner label – plain text only, no colour of its own
                        (e.g. "LP" on a green present day) */}
                    {cornerLabel && (
                      <Typography
                        sx={{
                          position: "absolute",
                          top: 3,
                          right: 5,
                          fontFamily: FONT,
                          fontSize: 9.5,
                          fontWeight: 700,
                          letterSpacing: "0.02em",
                          lineHeight: 1,
                          color: info?.cornerColor ?? palette?.text ?? "#6B7280",
                          opacity: 0.85,
                        }}
                      >
                        {cornerLabel}
                      </Typography>
                    )}
                  </Box>
                );

                /* Marked cells show their meaning on hover */
                return info?.tooltip && inMonth ? (
                  <Tooltip
                    key={cellIndex}
                    title={
                      <Typography
                        sx={{
                          fontFamily: FONT,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "inherit",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {info.tooltip}
                      </Typography>
                    }
                    arrow
                    placement="top"
                    slotProps={{
                      tooltip: { sx: TOOLTIP_SX },
                      arrow: { sx: TOOLTIP_ARROW_SX },
                    }}
                  >
                    {cellContent}
                  </Tooltip>
                ) : (
                  <Box key={cellIndex}>{cellContent}</Box>
                );
              })}
            </Box>
          ))}
        </Box>

        {/* Colour legend (optional) */}
        {legendItems && legendItems.length > 0 && <CalendarLegend items={legendItems} divider />}
      </Box>
    </Box>
  );
}

export default MonthCalendar;