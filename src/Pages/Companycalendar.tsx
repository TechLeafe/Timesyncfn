import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Typography } from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import BeachAccessOutlinedIcon from "@mui/icons-material/BeachAccessOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import MonthCalendar from "../Components/Calendar/MonthCalendar";
import type { CalendarDayInfo, CalendarDayState, CalendarLegendItem } from "../Components/Calendar/calendarTheme";
import { isSameDay, toDateKey } from "../data/calendarEvents";
import api from "../api/axiosInstance";

const FONT   = "var(--font-family)";
const GREEN  = "#92f7b0";
const PURPLE = "#e089ee";

type HolidayStatus = "Active" | "Inactive";

interface HolidayData {
  _id: string;
  holidayName: string;
  holidayDate: string; // "YYYY-MM-DD"
  holidayType: string;
  companyYear: string;
  description: string;
  status: HolidayStatus;
}

type ApiResponse<T> = { success?: boolean; message?: string; data?: T };

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: ApiResponse<unknown> } }).response;
    if (response?.data?.message) return response.data.message;
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

  /* Holidays are created and managed on the Holidays page (HR / Admin only) —
     this page just displays whatever the backend has, read-only. */
  useEffect(() => {
    const loadHolidays = async () => {
      try {
        const response = await api.post<ApiResponse<HolidayData[]>>("/holidays/list", {
          companyYear: "",
          holidayType: "",
        });
        const data = response.data.data;
        if (!Array.isArray(data)) throw new Error("Invalid holiday response.");
        setHolidays(data.filter((holiday) => holiday.status === "Active"));
      } catch (error) {
        setLoadError(getErrorMessage(error, "Unable to load holidays."));
      }
    };

    void loadHolidays();
  }, []);

  /* Index holidays by date key so a day cell / the side panel can look
     itself up in O(1) instead of scanning the whole list each render. */
  const holidaysByDate = useMemo(() => {
    const map: Record<string, HolidayData[]> = {};
    holidays.forEach((holiday) => {
      const key = holiday.holidayDate;
      map[key] = map[key] ? [...map[key], holiday] : [holiday];
    });
    return map;
  }, [holidays]);

  const selectedDateLabel = selectedDate.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  const selectedHolidays = holidaysByDate[toDateKey(selectedDate)] ?? [];
  const hasHoliday       = selectedHolidays.length > 0;

  /* Day cell colours: any real holiday is always green; with no holiday,
     today's cell gets a pinkish-purple highlight instead of sitting plain */
  const getDayInfo = (date: Date, state: CalendarDayState): CalendarDayInfo | undefined => {
    const dayHolidays = holidaysByDate[toDateKey(date)] ?? [];
    const holiday = dayHolidays[0];

    if (holiday) {
      return { tone: "green", tooltip: `🎉 ${holiday.holidayName}` };
    }

    if (state.isToday) {
      return { tone: "purple", tooltip: "Today" };
    }

    return undefined;
  };

  const legendItems: CalendarLegendItem[] = [
    { color: GREEN, label: "Holiday" },
    { color: PURPLE, label: "Today" },
  ];

  return (
    <Box sx={{ p: 0, fontFamily: FONT, WebkitFontSmoothing: "antialiased" }}>
      {/* ── Page header row ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "12px",
            backgroundColor: "#E8F5E9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: GREEN,
            flexShrink: 0,
          }}
        >
          <CalendarMonthOutlinedIcon sx={{ fontSize: 24, color: GREEN }} />
        </Box>
        <Box>
          <Typography sx={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: "#35753B" }}>
            Company Calendar
          </Typography>
          <Typography sx={{ fontFamily: FONT, fontSize: 13, color: "#6B7280" }}>
            Stay updated with company holidays.
          </Typography>
        </Box>
      </Box>

      {loadError && (
        <Typography sx={{ fontFamily: FONT, fontSize: 13, color: "#D42B2B", mb: 2 }}>
          {loadError}
        </Typography>
      )}

      {/* ── Two-column layout: big calendar + side panel ── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 320px" },
          gap: 2.5,
          alignItems: "start",
        }}
      >
        {/* ════ CALENDAR CARD (shared reusable component) ════ */}
        <MonthCalendar
          visibleMonth={visibleMonth}
          onMonthChange={setVisibleMonth}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          today={today}
          getDayInfo={getDayInfo}
          legendItems={legendItems}
        />

        {/* ════ SIDE PANEL ════ */}
        <Box
          sx={{
            border: "1px solid #E5E7EB",
            borderRadius: "14px",
            backgroundColor: "#fff",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 1.5,
              borderBottom: "1px solid #F3F4F6",
            }}
          >
            <Typography sx={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: "#111827" }}>
              Events on {selectedDateLabel}
            </Typography>
            {isSameDay(selectedDate, today) && (
              <Chip
                label="Today"
                size="small"
                sx={{
                  height: 20,
                  fontFamily: FONT,
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor: "#F3E5F5",
                  color: PURPLE,
                }}
              />
            )}
          </Box>

          <Box sx={{ p: 2 }}>
            {/* Holiday status chip */}
            <Chip
              label={hasHoliday ? "🎉 Today is Holiday" : "No holiday today"}
              size="small"
              sx={{
                height: 26,
                mb: 2,
                fontFamily: FONT,
                fontSize: 12,
                fontWeight: 700,
                backgroundColor: hasHoliday ? "#E8F5E9" : "#F3F4F6",
                color: hasHoliday ? GREEN : "#6B7280",
                border: hasHoliday ? "1px solid #A5D6A7" : "1px solid #E5E7EB",
              }}
            />

            {/* Holiday list for the selected date */}
            {selectedHolidays.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 5,
                  px: 2,
                  backgroundColor: "#FAFAFA",
                  borderRadius: "12px",
                  border: "1px dashed #E5E7EB",
                }}
              >
                <EventAvailableOutlinedIcon
                  sx={{ fontSize: 36, color: "#D1D5DB", mb: 1.5, opacity: 0.7 }}
                />
                <Typography sx={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: "#374151" }}>
                  No event today
                </Typography>
                <Typography sx={{ fontFamily: FONT, fontSize: 12.5, color: "#6B7280", mt: 0.5 }}>
                  No holidays on this date.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {selectedHolidays.map((holiday) => (
                  <Box
                    key={holiday._id}
                    sx={{
                      display: "flex",
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: "12px",
                      backgroundColor: "#E8F5E9",
                      border: "1px solid #A5D6A7",
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "9px",
                        backgroundColor: "#FFFFFF",
                        color: GREEN,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                      }}
                    >
                      <BeachAccessOutlinedIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 700, color: "#111827", wordBreak: "break-word" }}>
                        {holiday.holidayName}
                      </Typography>
                      <Typography sx={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: GREEN, mt: 0.25 }}>
                        {holiday.holidayType}
                      </Typography>
                      {holiday.description && (
                        <Typography sx={{ fontFamily: FONT, fontSize: 12, color: "#4B5563", mt: 0.25 }}>
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
