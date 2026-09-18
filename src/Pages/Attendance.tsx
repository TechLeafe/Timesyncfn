import { useMemo, useState } from "react";

import {
  Box,
  Typography,
} from "@mui/material";

import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";

import MonthCalendar from "../Components/Calendar/MonthCalendar";
import CalendarLegend from "../Components/Calendar/CalendarLegend";

import {
  CALENDAR_TONES,
} from "../Components/Calendar/calendarTheme";

import type {
  CalendarDayInfo,
  CalendarLegendItem,
} from "../Components/Calendar/calendarTheme";

import { useCalendarEvents } from "../context/CalendarEventsContext";

import { toDateKey } from "../data/calendarEvents";

import {
  ATTENDANCE_META,
  ATTENDANCE_STATUSES,
  HOLIDAY_TONE,
  LATE_CORNER_LABEL,
  resolveAttendanceDay,
  summarizeAttendanceMonth,
} from "../data/attendance";

import {
  HR,
  ADMIN,
  EMPLOYEE,
} from "../data/permissions";


const FONT = "var(--font-family)";
const GREEN = "#1B6B33";


const CARD_SX = {
  border: "1px solid #E5E7EB",
  borderRadius: "14px",
  backgroundColor: "#fff",
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  overflow: "hidden",
};


const CARD_HEADER_SX = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  px: 2,
  py: 1.5,
  borderBottom: "1px solid #F3F4F6",
};


function Attendance() {
  const today = useMemo(
    () => new Date(),
    []
  );


  /* =====================================
     LOGGED IN USER
  ===================================== */

  const storedUser =
    localStorage.getItem("loggedInUser");

  let loggedInUser: any = null;

  if (storedUser) {
    try {
      loggedInUser =
        JSON.parse(storedUser);
    } catch {
      loggedInUser = null;
    }
  }


  const userType = Number(
    loggedInUser?.userType
  );


  const employeeId =
    loggedInUser?.employeeId ??
    loggedInUser?.userId ??
    "";


  const employeeName =
    loggedInUser?.name ??
    "Employee";


  const isHR =
    userType === HR;


  const isAdmin =
    userType === ADMIN;


  const isEmployee =
    userType === EMPLOYEE;


  const canViewAllAttendance =
    isHR || isAdmin;


  /* =====================================
     COMPANY CALENDAR EVENTS
  ===================================== */

  const { events } =
    useCalendarEvents();


  /* =====================================
     CALENDAR STATE
  ===================================== */

  const [
    visibleMonth,
    setVisibleMonth,
  ] = useState(
    () =>
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
  );


  const [
    selectedDate,
    setSelectedDate,
  ] = useState<Date | null>(
    () =>
      new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      )
  );


  /* =====================================
     HOLIDAYS
  ===================================== */

  const holidayTitles =
    useMemo(() => {
      const map =
        new Map<string, string>();

      Object.entries(events).forEach(
        ([key, list]) => {
          const holiday =
            list.find(
              (event) =>
                event.type ===
                "holiday"
            );

          if (holiday) {
            map.set(
              key,
              holiday.title
            );
          }
        }
      );

      return map;
    }, [events]);


  const holidayKeys =
    useMemo(
      () =>
        new Set(
          holidayTitles.keys()
        ),
      [holidayTitles]
    );


  /* =====================================
     MONTH LABEL
  ===================================== */

  const monthLabel =
    visibleMonth.toLocaleDateString(
      "en-US",
      {
        month: "short",
        year: "numeric",
      }
    );


  /* =====================================
     ATTENDANCE SUMMARY
  ===================================== */

  const summary =
    useMemo(
      () =>
        summarizeAttendanceMonth(
          visibleMonth.getFullYear(),
          visibleMonth.getMonth(),
          {
            holidayKeys,
            today,
          }
        ),
      [
        visibleMonth,
        holidayKeys,
        today,
      ]
    );


  /* =====================================
     LEGEND
  ===================================== */

  const legendItems:
    CalendarLegendItem[] =
    useMemo(
      () => [
        ...ATTENDANCE_STATUSES.map(
          (status) => ({
            color:
              ATTENDANCE_META[
                status
              ].color,

            label:
              ATTENDANCE_META[
                status
              ].label,

            note:
              ATTENDANCE_META[
                status
              ].note,
          })
        ),

        {
          color:
            CALENDAR_TONES.green
              .dot,

          label:
            "Late Present",

          note:
            `(${LATE_CORNER_LABEL} in the corner · still present)`,
        },

        {
          color:
            CALENDAR_TONES[
              HOLIDAY_TONE
            ].dot,

          label:
            "Holiday",

          note:
            "(Company holiday)",
        },
      ],
      []
    );


  /* =====================================
     DAY INFORMATION
  ===================================== */

  const getDayInfo = (
    date: Date
  ):
    | CalendarDayInfo
    | undefined => {

    const {
      status,
      isHoliday,
      late,
    } =
      resolveAttendanceDay(
        date,
        {
          holidayKeys,
          today,
        }
      );


    if (isHoliday) {
      const title =
        holidayTitles.get(
          toDateKey(date)
        ) ??
        "Company holiday";

      return {
        tone: HOLIDAY_TONE,
        tooltip:
          `🎉 ${title}`,
      };
    }


    if (!status) {
      return undefined;
    }


    const meta =
      ATTENDANCE_META[
        status
      ];


    return {
      tone: meta.tone,

      tooltip: late
        ? `${meta.label} ${meta.note} · ${LATE_CORNER_LABEL} (late arrival)`
        : `${meta.label} ${meta.note}`,

      cornerLabel: late
        ? LATE_CORNER_LABEL
        : undefined,
    };
  };


  return (
    <Box
      sx={{
        p: 0,
        fontFamily: FONT,
        WebkitFontSmoothing:
          "antialiased",
      }}
    >

      {/* ===============================
          PAGE HEADER
      =============================== */}

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

            borderRadius:
              "12px",

            backgroundColor:
              "#E8F5E9",

            display: "flex",
            alignItems:
              "center",

            justifyContent:
              "center",

            color: GREEN,

            flexShrink: 0,
          }}
        >

          <FactCheckOutlinedIcon
            sx={{
              fontSize: 24,
              color: GREEN,
            }}
          />

        </Box>


        <Box>

          <Typography
            sx={{
              fontFamily: FONT,
              fontSize: 18,
              fontWeight: 700,
              color: GREEN,
            }}
          >
            Attendance
          </Typography>


          <Typography
            sx={{
              fontFamily: FONT,
              fontSize: 13,
              color: "#6B7280",
            }}
          >

            {isEmployee
              ? `View your attendance record, ${employeeName}.`
              : "View employee attendance, leaves and working days."}

          </Typography>

        </Box>

      </Box>


      {/* Temporary role information
          Can be removed later */}

      {isEmployee && (
        <Box
          sx={{
            mb: 2,
            px: 1.5,
            py: 1,

            backgroundColor:
              "#F0FDF4",

            border:
              "1px solid #DCFCE7",

            borderRadius:
              "9px",
          }}
        >
          <Typography
            sx={{
              fontFamily: FONT,
              fontSize: 12.5,
              color: "#166534",
            }}
          >
            Showing attendance for{" "}
            <strong>
              {employeeName}
            </strong>

            {employeeId
              ? ` (${employeeId})`
              : ""}
          </Typography>
        </Box>
      )}


      {canViewAllAttendance && (
        <Box
          sx={{
            mb: 2,
            px: 1.5,
            py: 1,

            backgroundColor:
              "#F8FAFC",

            border:
              "1px solid #E2E8F0",

            borderRadius:
              "9px",
          }}
        >
          <Typography
            sx={{
              fontFamily: FONT,
              fontSize: 12.5,
              color: "#475569",
            }}
          >
            You have permission to
            view attendance records
            for all employees.
          </Typography>
        </Box>
      )}


      {/* ===============================
          MAIN LAYOUT
      =============================== */}

      <Box
        sx={{
          display: "grid",

          gridTemplateColumns: {
            xs: "1fr",
            lg: "1fr 320px",
          },

          gap: 2.5,

          alignItems:
            "start",
        }}
      >

        {/* CALENDAR */}

        <MonthCalendar
          visibleMonth={
            visibleMonth
          }

          onMonthChange={
            setVisibleMonth
          }

          selectedDate={
            selectedDate
          }

          onSelectDate={
            setSelectedDate
          }

          today={today}

          getDayInfo={
            getDayInfo
          }
        />


        {/* ===============================
            RIGHT PANEL
        =============================== */}

        <Box
          sx={{
            display: "flex",

            flexDirection:
              "column",

            gap: 2.5,
          }}
        >

          {/* ===============================
              SUMMARY
          =============================== */}

          <Box sx={CARD_SX}>

            <Box
              sx={
                CARD_HEADER_SX
              }
            >

              <Typography
                sx={{
                  fontFamily:
                    FONT,

                  fontSize: 14,

                  fontWeight:
                    700,

                  color:
                    "#111827",
                }}
              >

                Attendance Summary
                {" "}
                ({monthLabel})

              </Typography>

            </Box>


            <Box sx={{ p: 2 }}>

              <Box
                sx={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(84px, 1fr))",

                  gap: 1,
                }}
              >

                {ATTENDANCE_STATUSES.map(
                  (status) => {

                    const meta =
                      ATTENDANCE_META[
                        status
                      ];


                    const palette =
                      CALENDAR_TONES[
                        meta.tone
                      ];


                    return (
                      <Box
                        key={
                          status
                        }

                        sx={{
                          textAlign:
                            "center",

                          py: 1.25,

                          px: 0.5,

                          borderRadius:
                            "10px",

                          backgroundColor:
                            palette.bg,

                          border:
                            `1px solid ${palette.border}`,
                        }}
                      >

                        <Typography
                          sx={{
                            fontFamily:
                              FONT,

                            fontSize:
                              18,

                            fontWeight:
                              700,

                            color:
                              palette.text,

                            lineHeight:
                              1.1,
                          }}
                        >

                          {
                            summary[
                              status
                            ]
                          }

                        </Typography>


                        <Typography
                          sx={{
                            fontFamily:
                              FONT,

                            fontSize:
                              11,

                            fontWeight:
                              600,

                            color:
                              palette.text,

                            mt: 0.4,

                            letterSpacing:
                              "-0.01em",
                          }}
                        >

                          {
                            meta.label
                          }

                        </Typography>

                      </Box>
                    );
                  }
                )}

              </Box>

            </Box>

          </Box>


          {/* ===============================
              LEGEND
          =============================== */}

          <Box sx={CARD_SX}>

            <Box
              sx={
                CARD_HEADER_SX
              }
            >

              <Typography
                sx={{
                  fontFamily:
                    FONT,

                  fontSize: 14,

                  fontWeight:
                    700,

                  color:
                    "#111827",
                }}
              >
                Legend
              </Typography>

            </Box>


            <Box sx={{ p: 2 }}>

              <CalendarLegend
                items={
                  legendItems
                }

                layout="stacked"
              />

            </Box>

          </Box>

        </Box>

      </Box>

    </Box>
  );
}


export default Attendance;