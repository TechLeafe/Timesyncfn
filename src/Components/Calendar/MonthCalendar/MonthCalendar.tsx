
import { useMemo } from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CalendarLegend from "../CalendarLegend/CalendarLegend";
import { CALENDAR_TONES } from "../calendarTheme";
import type {
  CalendarDayInfo,
  CalendarDayState,
  CalendarLegendItem,
} from "../calendarTheme";
import { isSameDay } from "../../../data/calendarEvents";
import "./MonthCalendar.css";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface MonthCalendarProps {
  /** Any date inside the month that should be rendered */
  visibleMonth: Date;

  /** Called with the first day of the previous / next month */
  onMonthChange: (month: Date) => void;

  selectedDate?: Date | null;
  onSelectDate?: (date: Date) => void;
  today?: Date;

  /** Resolves the colour tone and tooltip of a single day cell */
  getDayInfo?: (
    date: Date,
    state: CalendarDayState
  ) => CalendarDayInfo | undefined;

  /** Optional colour legend rendered under the grid */
  legendItems?: CalendarLegendItem[];

  /** Minimum width of the month label */
  monthLabelMinWidth?: number;
}

// Builds the calendar week matrix
const buildWeeks = (visibleMonth: Date) => {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  const firstDayOffset = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { date: Date; inMonth: boolean }[] = [];

  for (let i = firstDayOffset - 1; i >= 0; i--) {
    cells.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      inMonth: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      date: new Date(year, month, d),
      inMonth: true,
    });
  }

  while (cells.length % 7 !== 0 || cells.length < 35) {
    const last = cells[cells.length - 1].date;

    cells.push({
      date: new Date(
        last.getFullYear(),
        last.getMonth(),
        last.getDate() + 1
      ),
      inMonth: false,
    });
  }

  const rows: { date: Date; inMonth: boolean }[][] = [];

  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return rows;
};

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
  const weeks = useMemo(
    () => buildWeeks(visibleMonth),
    [visibleMonth]
  );

  const monthLabel = visibleMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const shiftMonth = (offset: number) =>
    onMonthChange(
      new Date(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth() + offset,
        1
      )
    );

  return (
    <Box className="month-calendar">
      {/* Month navigation */}
      <Box className="month-calendar-header">
        <IconButton
          size="small"
          aria-label="Previous month"
          onClick={() => shiftMonth(-1)}
          className="month-calendar-nav-button"
        >
          <ChevronLeftIcon className="month-calendar-nav-icon" />
        </IconButton>

        <Typography
          className="month-calendar-month-label"
          sx={{ minWidth: monthLabelMinWidth }}
        >
          {monthLabel}
        </Typography>

        <IconButton
          size="small"
          aria-label="Next month"
          onClick={() => shiftMonth(1)}
          className="month-calendar-nav-button"
        >
          <ChevronRightIcon className="month-calendar-nav-icon" />
        </IconButton>
      </Box>

      {/* Grid body */}
      <Box className="month-calendar-body">
        {/* Weekday headers */}
        <Box className="month-calendar-weekdays">
          {WEEKDAYS.map((weekday) => (
            <Typography
              key={weekday}
              align="center"
              className="month-calendar-weekday"
            >
              {weekday}
            </Typography>
          ))}
        </Box>

        {/* Day rows */}
        <Box className="month-calendar-rows">
          {weeks.map((row, rowIndex) => (
            <Box
              key={rowIndex}
              className="month-calendar-row"
            >
              {row.map(({ date, inMonth }, cellIndex) => {
                const isSelected = selectedDate
                  ? isSameDay(date, selectedDate)
                  : false;

                const isToday = today
                  ? isSameDay(date, today)
                  : false;

                const isWeekend =
                  date.getDay() === 0 ||
                  date.getDay() === 6;

                const info = getDayInfo?.(date, {
                  isSelected,
                  isToday,
                  inMonth,
                  isWeekend,
                });

                const palette = info?.tone
                  ? CALENDAR_TONES[info.tone]
                  : undefined;

                const dotColor =
                  info?.dotColor ?? palette?.dot;

                const showDot =
                  Boolean(dotColor) &&
                  (info?.dot ?? true);

                // Corner label
                const cornerLabel = inMonth
                  ? info?.cornerLabel
                  : undefined;

                // Default cell colors
                let cellBg = "transparent";
                let cellBorder = "1px solid var(--card-border)";
                let cellHoverBg = isSelected
                  ? "var(--card-border)"
                  : "var(--bg-main)";
                let cellHoverBorder = isSelected
                  ? "var(--text-secondary)"
                  : "var(--card-border)";
                let dateColor = "var(--text-primary)";
                let dateWeight = 500;

                if (palette) {
                  cellBg = isSelected
                    ? palette.bgStrong
                    : palette.bg;

                  cellBorder = isSelected
                    ? `1.5px solid ${palette.accent}`
                    : `1.5px solid ${palette.border}`;

                  cellHoverBg = isSelected
                    ? palette.bgHoverStrong
                    : palette.bgHover;

                  cellHoverBorder = `${palette.accent}55`;
                  dateColor =
                    info?.dateColor ?? palette.text;
                  dateWeight = 700;
                } else if (isSelected) {
                  cellBg = "var(--card-border)";
                  cellBorder =
                    "1.5px solid var(--text-secondary)";
                  dateColor = "var(--text-primary)";
                  dateWeight = 700;
                }

                if (isToday && !isSelected && !palette) {
                  cellBorder =
                    "1.5px solid var(--brand-green-light)";
                  dateColor = "var(--primary-color)";
                }

                const cellStyle = {
                  "--cell-bg": cellBg,
                  "--cell-border": cellBorder,
                  "--cell-hover-bg": cellHoverBg,
                  "--cell-hover-border": cellHoverBorder,
                  "--date-color": dateColor,
                  "--date-weight": dateWeight,
                  "--dot-color": dotColor || "transparent",
                  "--corner-color":
                    info?.cornerColor ??
                    palette?.text ??
                    "var(--text-secondary)",
                  "--cell-opacity": inMonth ? "1" : "0.28",
                } as React.CSSProperties;

                const cellContent = (
                  <Box
                    onClick={() =>
                      onSelectDate?.(date)
                    }
                    className={`month-calendar-cell ${
                      onSelectDate
                        ? "month-calendar-cell-clickable"
                        : ""
                    }`}
                    style={cellStyle}
                  >
                    <Typography className="month-calendar-date">
                      {date.getDate()}
                    </Typography>

                    {/* Dot indicator */}
                    {showDot && (
                      <Box className="month-calendar-dot" />
                    )}

                    {/* Corner label */}
                    {cornerLabel && (
                      <Typography className="month-calendar-corner-label">
                        {cornerLabel}
                      </Typography>
                    )}
                  </Box>
                );

                // Tooltip for marked days
                return info?.tooltip && inMonth ? (
                  <Tooltip
                    key={cellIndex}
                    title={
                      <Typography className="month-calendar-tooltip-text">
                        {info.tooltip}
                      </Typography>
                    }
                    arrow
                    placement="top"
                    slotProps={{
                      tooltip: {
                        className:
                          "month-calendar-tooltip",
                      },
                      arrow: {
                        className:
                          "month-calendar-tooltip-arrow",
                      },
                    }}
                  >
                    {cellContent}
                  </Tooltip>
                ) : (
                  <Box key={cellIndex}>
                    {cellContent}
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>

        {/* Colour legend */}
        {legendItems && legendItems.length > 0 && (
          <CalendarLegend
            items={legendItems}
            divider
          />
        )}
      </Box>
    </Box>
  );
}

export default MonthCalendar;

