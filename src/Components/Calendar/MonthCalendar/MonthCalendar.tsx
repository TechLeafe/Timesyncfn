
import { useMemo, type CSSProperties } from "react";

import {
  Box,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";

import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

import CalendarLegend from "../CalendarLegend/CalendarLegend";
import { CALENDAR_TONES } from "../calendarTheme";

import type {
  CalendarDayInfo,
  CalendarDayState,
  CalendarLegendItem,
} from "../calendarTheme";

import { isSameDay } from "../../../data/calendarEvents";

import "./MonthCalendar.css";

/* =========================================
   CONSTANTS
========================================= */

const WEEKDAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

/* =========================================
   TYPES
========================================= */

interface CalendarCell {
  date: Date;
  inMonth: boolean;
}

export interface MonthCalendarProps {
  visibleMonth: Date;
  onMonthChange: (month: Date) => void;

  selectedDate?: Date | null;
  onSelectDate?: (date: Date) => void;
  today?: Date;

  getDayInfo?: (
    date: Date,
    state: CalendarDayState
  ) => CalendarDayInfo | undefined;

  // Optional icon for an actual company holiday.
  // Example: /assets/festival-icons/diwali.png
  getHolidayIcon?: (date: Date) => string | undefined;

  legendItems?: CalendarLegendItem[];
  monthLabelMinWidth?: number;
}

/* =========================================
   BUILD CALENDAR WEEKS
========================================= */

const buildWeeks = (
  visibleMonth: Date
): CalendarCell[][] => {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  const firstDayOffset = new Date(
    year,
    month,
    1
  ).getDay();

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const daysInPrevMonth = new Date(
    year,
    month,
    0
  ).getDate();

  const cells: CalendarCell[] = [];

  // Previous month
  for (let i = firstDayOffset - 1; i >= 0; i--) {
    cells.push({
      date: new Date(
        year,
        month - 1,
        daysInPrevMonth - i
      ),
      inMonth: false,
    });
  }

  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      date: new Date(year, month, day),
      inMonth: true,
    });
  }

  // Next month
  while (
    cells.length % 7 !== 0 ||
    cells.length < 35
  ) {
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

  const rows: CalendarCell[][] = [];

  for (
    let index = 0;
    index < cells.length;
    index += 7
  ) {
    rows.push(cells.slice(index, index + 7));
  }

  return rows;
};

/* =========================================
   COMPONENT
========================================= */

export default function MonthCalendar({
  visibleMonth,
  onMonthChange,
  selectedDate = null,
  onSelectDate,
  today,
  getDayInfo,
  getHolidayIcon,
  legendItems,
  monthLabelMinWidth = 160,
}: MonthCalendarProps) {
  const weeks = useMemo(
    () => buildWeeks(visibleMonth),
    [visibleMonth]
  );

  const currentDay = today ?? new Date();

  const monthLabel = visibleMonth.toLocaleDateString(
    "en-IN",
    {
      month: "long",
      year: "numeric",
    }
  );

  const shiftMonth = (offset: number) => {
    onMonthChange(
      new Date(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth() + offset,
        1
      )
    );
  };

  return (
    <Box className="month-calendar">
      {/* HEADER */}

      <Box className="month-calendar-header">
        <Box className="month-calendar-title-group">
          <Typography
            component="h2"
            className="month-calendar-heading"
          >
            Monthly Calendar
          </Typography>

          <Typography className="month-calendar-subtitle">
            View attendance and company events
          </Typography>
        </Box>

        <Box className="month-calendar-controls">
          <IconButton
            className="month-calendar-nav-button"
            aria-label="Previous month"
            onClick={() => shiftMonth(-1)}
            size="small"
          >
            <ChevronLeftRoundedIcon />
          </IconButton>

          <Typography
            className="month-calendar-month-label"
            sx={{
              minWidth: {
                xs: 0,
                sm: monthLabelMinWidth,
              },
            }}
          >
            {monthLabel}
          </Typography>

          <IconButton
            className="month-calendar-nav-button"
            aria-label="Next month"
            onClick={() => shiftMonth(1)}
            size="small"
          >
            <ChevronRightRoundedIcon />
          </IconButton>
        </Box>
      </Box>

      {/* CALENDAR BODY */}

      <Box className="month-calendar-body">
        <Box className="month-calendar-weekdays">
          {WEEKDAYS.map((weekday) => (
            <Typography
              key={weekday}
              className="month-calendar-weekday"
              align="center"
            >
              {weekday}
            </Typography>
          ))}
        </Box>

        {/* DATE ROWS */}

        <Box className="month-calendar-rows">
          {weeks.map((row, rowIndex) => (
            <Box
              key={rowIndex}
              className="month-calendar-row"
            >
              {row.map(({ date, inMonth }) => {
                const isSelected = selectedDate
                  ? isSameDay(date, selectedDate)
                  : false;

                const isToday = isSameDay(
                  date,
                  currentDay
                );

                const isSunday = date.getDay() === 0;

                const isWeekend =
                  isSunday || date.getDay() === 6;

                const state: CalendarDayState = {
                  isSelected,
                  isToday,
                  inMonth,
                  isWeekend,
                };

                const info = getDayInfo?.(date, state);

                const palette = info?.tone
                  ? CALENDAR_TONES[info.tone]
                  : undefined;

                const holidayIcon =
                  inMonth && getHolidayIcon
                    ? getHolidayIcon(date)
                    : undefined;

                const dotColor =
                  info?.dotColor ?? palette?.dot;

                const showDot =
                  inMonth &&
                  Boolean(dotColor) &&
                  (info?.dot ?? true) &&
                  !holidayIcon;

                const cornerLabel = inMonth
                  ? info?.cornerLabel
                  : undefined;

                let cellBg = "transparent";
                let cellBorder =
                  "1px solid var(--card-border, #e8edf2)";
                let cellHoverBg =
                  "var(--bg-main, #f4f8f6)";
                let cellHoverBorder =
                  "var(--card-border, #dce6e1)";
                let dateColor =
                  "var(--text-primary, #243247)";
                let dateWeight = 500;

                // SUNDAY: blue unless the parent has
                // already supplied a status/holiday tone.
                if (isSunday && inMonth && !palette) {
                  cellBg = "#E9F1FF";
                  cellBorder = "1px solid #B9D4FF";
                  cellHoverBg = "#DDEAFF";
                  cellHoverBorder = "#6B9DE4";
                  dateColor = "#245EB7";
                  dateWeight = 700;
                }

                // PRESENT / ABSENT / HOLIDAY COLORS
                if (palette) {
                  cellBg = isSelected
                    ? palette.bgStrong
                    : palette.bg;

                  cellBorder = isSelected
                    ? `2px solid ${palette.accent}`
                    : `1px solid ${palette.border}`;

                  cellHoverBg = isSelected
                    ? palette.bgHoverStrong
                    : palette.bgHover;

                  cellHoverBorder = palette.accent;

                  dateColor =
                    info?.dateColor ?? palette.text;

                  dateWeight = 700;
                } else if (isSelected) {
                  // Preserve Sunday blue selection,
                  // green selection for ordinary days.
                  if (isSunday && inMonth) {
                    cellBg = "#D7E7FF";
                    cellBorder = "2px solid #3675D1";
                    cellHoverBg = "#C9DEFF";
                    cellHoverBorder = "#3675D1";
                    dateColor = "#245EB7";
                  } else {
                    cellBg = "#E3F4E9";
                    cellBorder = "2px solid #087B4D";
                    cellHoverBg = "#D7EDDF";
                    cellHoverBorder = "#087B4D";
                    dateColor = "#087B4D";
                  }

                  dateWeight = 700;
                }

                if (
                  isToday &&
                  !isSelected &&
                  !palette
                ) {
                  cellBorder = isSunday
                    ? "2px solid #3675D1"
                    : "2px solid #2C9C69";

                  dateColor = isSunday
                    ? "#245EB7"
                    : "#087B4D";

                  dateWeight = 700;
                }

                const cellStyle = {
                  "--cell-bg": cellBg,
                  "--cell-border": cellBorder,
                  "--cell-hover-bg": cellHoverBg,
                  "--cell-hover-border":
                    cellHoverBorder,
                  "--date-color": dateColor,
                  "--date-weight": dateWeight,
                  "--dot-color":
                    dotColor ?? "transparent",
                  "--corner-color":
                    info?.cornerColor ??
                    palette?.text ??
                    "#64748B",
                  "--cell-opacity":
                    inMonth ? "1" : "0.35",
                } as CSSProperties;

                const cellClass = [
                  "month-calendar-cell",

                  onSelectDate
                    ? "month-calendar-cell-clickable"
                    : "",

                  isSelected
                    ? "month-calendar-cell-selected"
                    : "",

                  isToday
                    ? "month-calendar-cell-today"
                    : "",

                  !inMonth
                    ? "month-calendar-cell-outside"
                    : "",

                  isSunday && inMonth && !palette
                    ? "month-calendar-cell-sunday"
                    : "",

                  isWeekend
                    ? "month-calendar-cell-weekend"
                    : "",

                  holidayIcon
                    ? "month-calendar-cell-festival"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                const accessibleDate =
                  date.toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  });

                const tooltipText =
                  info?.tooltip ||
                  (isSunday && inMonth
                    ? "Sunday"
                    : "");

                const cellContent = (
                  <button
                    type="button"
                    className={cellClass}
                    style={cellStyle}
                    onClick={() =>
                      onSelectDate?.(date)
                    }
                    disabled={!onSelectDate}
                    aria-pressed={
                      onSelectDate
                        ? isSelected
                        : undefined
                    }
                    aria-label={[
                      accessibleDate,
                      isToday ? "Today" : "",
                      tooltipText,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  >
                    {/* DATE NUMBER */}

                    <Typography
                      component="span"
                      className="month-calendar-date"
                    >
                      {date.getDate()}
                    </Typography>

                    {/* STATUS DOT */}

                    {showDot && (
                      <span
                        className="month-calendar-dot"
                        aria-hidden="true"
                      />
                    )}

                    {/* FLATICON FESTIVAL ICON */}

                    {holidayIcon && (
                      <img
                        src={holidayIcon}
                        alt=""
                        className="month-calendar-festival-icon"
                        aria-hidden="true"
                      />
                    )}

                    {/* BOTTOM-RIGHT P / A */}

                    {cornerLabel && (
                      <Typography
                        component="span"
                        className="month-calendar-corner-label"
                      >
                        {cornerLabel}
                      </Typography>
                    )}

                    {/* TODAY INDICATOR */}

                    {isToday && inMonth && (
                      <span
                        className="month-calendar-today-marker"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );

                const key = [
                  date.getFullYear(),
                  date.getMonth(),
                  date.getDate(),
                ].join("-");

                return (
                  <Box
                    key={key}
                    className="month-calendar-cell-wrapper"
                  >
                    {tooltipText && inMonth ? (
                      <Tooltip
                        title={
                          <Typography className="month-calendar-tooltip-text">
                            {tooltipText}
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
                        <span className="month-calendar-tooltip-target">
                          {cellContent}
                        </span>
                      </Tooltip>
                    ) : (
                      cellContent
                    )}
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>

        {/* EXISTING LEGEND */}

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
