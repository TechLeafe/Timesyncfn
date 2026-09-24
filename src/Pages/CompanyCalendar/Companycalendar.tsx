
import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Typography } from "@mui/material";
import BeachAccessOutlinedIcon from "@mui/icons-material/BeachAccessOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import MonthCalendar from "../../Components/Calendar/MonthCalendar/MonthCalendar";
import type {
  CalendarDayInfo,
  CalendarDayState,
  CalendarLegendItem,
} from "../../Components/Calendar/calendarTheme";
import { isSameDay, toDateKey } from "../../data/calendarEvents";
import api from "../../api/axiosInstance";
import "./Companycalendar.css";

const GREEN = "#92f7b0";
const PURPLE = "#e089ee";

type HolidayStatus = "Active" | "Inactive";

interface HolidayData {
  _id: string;
  holidayName: string;
  holidayDate: string;
  holidayType: string;
  companyYear: string;
  description: string;
  status: HolidayStatus;
}

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: ApiResponse<unknown>;
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return error instanceof Error ? error.message : fallback;
};

function CompanyCalendar() {
  const today = new Date();

  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [selectedDate, setSelectedDate] = useState(today);
  const [holidays, setHolidays] = useState<HolidayData[]>([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const loadHolidays = async () => {
      try {
        const response = await api.post<ApiResponse<HolidayData[]>>(
          "/holidays/list",
          {
            companyYear: "",
            holidayType: "",
          }
        );

        const data = response.data.data;

        if (!Array.isArray(data)) {
          throw new Error("Invalid holiday response.");
        }

        setHolidays(
          data.filter((holiday) => holiday.status === "Active")
        );
      } catch (error) {
        setLoadError(
          getErrorMessage(error, "Unable to load holidays.")
        );
      }
    };

    void loadHolidays();
  }, []);

  const holidaysByDate = useMemo(() => {
    const map: Record<string, HolidayData[]> = {};

    holidays.forEach((holiday) => {
      const key = holiday.holidayDate;

      map[key] = map[key]
        ? [...map[key], holiday]
        : [holiday];
    });

    return map;
  }, [holidays]);

  const selectedDateLabel = selectedDate.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  const selectedHolidays =
    holidaysByDate[toDateKey(selectedDate)] ?? [];

  const hasHoliday = selectedHolidays.length > 0;

  const getDayInfo = (
    date: Date,
    state: CalendarDayState
  ): CalendarDayInfo | undefined => {
    const dayHolidays =
      holidaysByDate[toDateKey(date)] ?? [];

    const holiday = dayHolidays[0];

    if (holiday) {
      return {
        tone: "green",
        tooltip: `🎉 ${holiday.holidayName}`,
      };
    }

    if (state.isToday) {
      return {
        tone: "purple",
        tooltip: "Today",
      };
    }

    return undefined;
  };

  const legendItems: CalendarLegendItem[] = [
    {
      color: GREEN,
      label: "Holiday",
    },
    {
      color: PURPLE,
      label: "Today",
    },
  ];

  return (
    <Box className="company-calendar-page">
      {loadError && (
        <Typography className="company-calendar-error">
          {loadError}
        </Typography>
      )}

      <Box className="company-calendar-layout">
        <Box className="company-calendar-month-wrapper">
          <Box className="company-calendar-scroll">
            <Box className="company-calendar-month">
              <MonthCalendar
                visibleMonth={visibleMonth}
                onMonthChange={setVisibleMonth}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                today={today}
                getDayInfo={getDayInfo}
                legendItems={legendItems}
              />
            </Box>
          </Box>
        </Box>

        <Box className="company-calendar-side-panel">
          <Box className="company-calendar-side-header">
            <Typography className="company-calendar-side-title">
              Events on {selectedDateLabel}
            </Typography>

            {isSameDay(selectedDate, today) && (
              <Chip
                label="Today"
                size="small"
                className="company-calendar-today-chip"
              />
            )}
          </Box>

          <Box className="company-calendar-side-content">
            <Chip
              label={
                hasHoliday
                  ? "🎉 Today is Holiday"
                  : "No holiday today"
              }
              size="small"
              className={`company-calendar-holiday-status ${
                hasHoliday
                  ? "company-calendar-holiday-active"
                  : "company-calendar-holiday-inactive"
              }`}
            />

            {selectedHolidays.length === 0 ? (
              <Box className="company-calendar-empty-state">
                <EventAvailableOutlinedIcon className="company-calendar-empty-icon" />

                <Typography className="company-calendar-empty-title">
                  No event today
                </Typography>

                <Typography className="company-calendar-empty-description">
                  No holidays on this date.
                </Typography>
              </Box>
            ) : (
              <Box className="company-calendar-holiday-list">
                {selectedHolidays.map((holiday) => (
                  <Box
                    key={holiday._id}
                    className="company-calendar-holiday-item"
                  >
                    <Box className="company-calendar-holiday-icon">
                      <BeachAccessOutlinedIcon className="company-calendar-holiday-icon-svg" />
                    </Box>

                    <Box className="company-calendar-holiday-details">
                      <Typography className="company-calendar-holiday-name">
                        {holiday.holidayName}
                      </Typography>

                      <Typography className="company-calendar-holiday-type">
                        {holiday.holidayType}
                      </Typography>

                      {holiday.description && (
                        <Typography className="company-calendar-holiday-description">
                          {holiday.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default CompanyCalendar;

