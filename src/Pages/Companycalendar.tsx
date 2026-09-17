import { useState } from "react";
import { Box, Button, Chip, Dialog, IconButton, Tooltip, Typography } from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import BeachAccessOutlinedIcon from "@mui/icons-material/BeachAccessOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import MonthCalendar from "../Components/Calendar/MonthCalendar";
import type { CalendarDayInfo, CalendarLegendItem } from "../Components/Calendar/calendarTheme";
import { useCalendarEvents } from "../context/CalendarEventsContext";
import { useCurrentUser } from "../context/UserContext";
import { HALF_DAY_SLOTS, isSameDay, toDateKey } from "../data/calendarEvents";
import type { CalendarEvent, CalendarEventType, HalfDaySlot } from "../data/calendarEvents";
import { canManageCalendar } from "../data/users";

const FONT      = "var(--font-family)";
const GREEN     = "#1B6B33";
const GREEN_MID = "#2E7D32";
const RED       = "#D42B2B";
const BLUE      = "#1565C0";
const BLUE_PALE = "#E3F2FD";
const BLUE_SOFT = "#BBDEFB";

/* Neutral grey "overlay" tooltip – used for the row actions */
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

const TYPE_META: Record<CalendarEventType, { label: string; dot: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
  holiday: {
    label: "Holiday",
    dot:   RED,
    bg:    "#FFEBEE",
    text:  RED,
    border: "#FFCDD2",
    icon:  <BeachAccessOutlinedIcon sx={{ fontSize: 18 }} />,
  },
  halfDay: {
    label: "Half Day",
    dot:   BLUE,
    bg:    BLUE_PALE,
    text:  BLUE,
    border: BLUE_SOFT,
    icon:  <AccessTimeOutlinedIcon sx={{ fontSize: 18 }} />,
  },
};

function CompanyCalendar() {
  const today = new Date();
  /* Company calendar events live in the shared provider (CalendarEventsProvider)
     so the attendance page always shows the holidays created here */
  const { events, saveEvent, deleteEvent } = useCalendarEvents();
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(today);

  /* Modal state */
  const [openAddModal, setOpenAddModal] = useState(false);
  const [formTitle, setFormTitle]       = useState("");
  const [formType, setFormType]         = useState<CalendarEventType>("holiday");
  const [formHalfDaySlot, setFormHalfDaySlot] = useState<HalfDaySlot>("first");
  const [formDate, setFormDate]         = useState(toDateKey(today));
  const [formDescription, setFormDescription] = useState("");

  /* Role based permission: only HR Manager & Admin can edit / delete events */
  const { currentUser } = useCurrentUser();
  const canManageEvents = canManageCalendar(currentUser.role);

  /* Edit / delete modal state */
  const [editingTarget, setEditingTarget] = useState<{ key: string; index: number } | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<{ key: string; index: number; title: string } | null>(null);

  const selectedDateLabel = selectedDate.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  const selectedEvents = events[toDateKey(selectedDate)] ?? [];
  const hasHoliday     = selectedEvents.some((e) => e.type === "holiday");
  const hasHalfDay     = selectedEvents.some((e) => e.type === "halfDay");

  const handleOpenAddModal = () => {
    setEditingTarget(null);
    setFormTitle("");
    setFormType("holiday");
    setFormHalfDaySlot("first");
    setFormDate(toDateKey(selectedDate));
    setFormDescription("");
    setOpenAddModal(true);
  };

  /* Open the same popup in edit mode, prefilled with the selected event */
  const handleOpenEditModal = (event: CalendarEvent, index: number) => {
    setEditingTarget({ key: toDateKey(selectedDate), index });
    setFormTitle(event.title);
    setFormType(event.type);
    setFormHalfDaySlot(event.halfDaySlot ?? "first");
    setFormDate(toDateKey(selectedDate));
    setFormDescription(event.description ?? "");
    setOpenAddModal(true);
  };

  const closeEventModal = () => {
    setOpenAddModal(false);
    setEditingTarget(null);
  };

  /* Small confirmation popup for delete */
  const handleOpenDeleteModal = (event: CalendarEvent, index: number) => {
    setDeleteTarget({ key: toDateKey(selectedDate), index, title: event.title });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    deleteEvent(deleteTarget.key, deleteTarget.index);
    setDeleteTarget(null);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const title = formTitle.trim();
    if (!title || !formDate) return;

    const savedEvent: CalendarEvent = {
      title,
      type: formType,
      halfDaySlot: formType === "halfDay" ? formHalfDaySlot : undefined,
      description: formDescription.trim() || undefined,
    };

    /* The shared provider creates the event or moves the edited one */
    saveEvent(editingTarget, formDate, savedEvent);

    // Update selected date to show the saved event
    const [y, m, d] = formDate.split("-").map(Number);
    if (y && m && d) {
      setSelectedDate(new Date(y, m - 1, d));
      setVisibleMonth(new Date(y, m - 1, 1));
    }

    closeEventModal();
  };

  /* Day cell colours: holiday (red) / half day (blue) straight from the shared store */
  const getDayInfo = (date: Date): CalendarDayInfo | undefined => {
    const dayEvents = events[toDateKey(date)] ?? [];

    const holiday = dayEvents.find((event) => event.type === "holiday");
    if (holiday) return { tone: "red", tooltip: `🎉 ${holiday.title}` };

    const halfDay = dayEvents.find((event) => event.type === "halfDay");
    if (halfDay) {
      const slotLabel = halfDay.halfDaySlot ? HALF_DAY_SLOTS[halfDay.halfDaySlot].label : "";
      return { tone: "blue", tooltip: `🕐 ${halfDay.title}${slotLabel ? ` · ${slotLabel}` : ""}` };
    }

    return undefined;
  };

  /* Legend colours handed to the reusable calendar */
  const legendItems: CalendarLegendItem[] = [
    { color: RED, label: "Company Holiday" },
    { color: BLUE, label: "Half Day" },
  ];

  return (
    <Box sx={{ p: 0, fontFamily: FONT, WebkitFontSmoothing: "antialiased" }}>
      {/* ── Page header row ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {/* Green icon badge */}
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
            <Typography sx={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: GREEN }}>
              Company Calendar
            </Typography>
            <Typography sx={{ fontFamily: FONT, fontSize: 13, color: "#6B7280" }}>
              Stay updated with company holidays, half days and non-working days.
            </Typography>
          </Box>
        </Box>

        {/* Add Event – visible to HR Manager & Admin only */}
        {canManageEvents && (
          <Button
            onClick={handleOpenAddModal}
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            sx={{
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 600,
              textTransform: "none",
              backgroundColor: GREEN,
              color: "#fff",
              borderRadius: "9px",
              px: 2.5,
              py: 0.85,
              boxShadow: `0 2px 6px rgba(27,107,51,0.25)`,
              "&:hover": { backgroundColor: GREEN_MID },
            }}
          >
            Add Event
          </Button>
        )}
      </Box>

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
                  backgroundColor: "#E8F5E9",
                  color: GREEN,
                }}
              />
            )}
          </Box>

          <Box sx={{ p: 2 }}>
            {/* Holiday status chip */}
            <Chip
              label={
                hasHoliday
                  ? "🎉 Today is Holiday"
                  : hasHalfDay
                  ? "🕐 Today is Half Day"
                  : "No event today"
              }
              size="small"
              sx={{
                height: 26,
                mb: 2,
                fontFamily: FONT,
                fontSize: 12,
                fontWeight: 700,
                backgroundColor: hasHoliday ? "#FFEBEE" : hasHalfDay ? BLUE_PALE : "#F3F4F6",
                color: hasHoliday ? RED : hasHalfDay ? BLUE : "#6B7280",
                border: hasHoliday
                  ? `1px solid #FFCDD2`
                  : hasHalfDay
                  ? `1px solid ${BLUE_SOFT}`
                  : "1px solid #E5E7EB",
              }}
            />

            {/* Events list */}
            {selectedEvents.length === 0 ? (
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
                  No holidays or half days on this date.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {selectedEvents.map((event, i) => {
                  const meta = TYPE_META[event.type] || TYPE_META.holiday;
                  return (
                    <Box
                      key={i}
                      sx={{
                        display: "flex",
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: "12px",
                        backgroundColor: meta.bg,
                        border: `1px solid ${meta.border}`,
                      }}
                    >
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "9px",
                          backgroundColor: "#FFFFFF",
                          color: meta.text,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                        }}
                      >
                        {meta.icon}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                          <Typography sx={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 700, color: "#111827", flex: 1, minWidth: 0, wordBreak: "break-word" }}>
                            {event.title}
                          </Typography>

                          {/* Edit / Delete actions – visible to HR Manager & Admin only */}
                          {canManageEvents && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                              <Tooltip
                                title="Edit event"
                                arrow
                                slotProps={{ tooltip: { sx: TOOLTIP_SX }, arrow: { sx: TOOLTIP_ARROW_SX } }}
                              >
                                <IconButton
                                  aria-label="Edit event"
                                  onClick={() => handleOpenEditModal(event, i)}
                                  sx={{
                                    width: 30,
                                    height: 30,
                                    p: 0,
                                    borderRadius: "10px",
                                    backgroundColor: "#FFFFFF",
                                    border: "1px solid #E5E7EB",
                                    color: "#475569",
                                    boxShadow: "0 1px 2px rgba(16, 24, 40, 0.06)",
                                    transition: "color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease",
                                    "&:hover": { color: GREEN, backgroundColor: "#F8FAFC", borderColor: "#D1D5DB" },
                                    "&:active": { backgroundColor: "#F1F5F9" },
                                    "&.Mui-focusVisible": {
                                      boxShadow: "inset 0 0 0 2px rgba(27, 107, 51, 0.45)",
                                    },
                                  }}
                                >
                                  <EditOutlinedIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>

                              {/* Delete – the bin glyph turns red on hover, the button background does not */}
                              <Tooltip
                                title="Delete event"
                                arrow
                                slotProps={{ tooltip: { sx: TOOLTIP_SX }, arrow: { sx: TOOLTIP_ARROW_SX } }}
                              >
                                <IconButton
                                  aria-label="Delete event"
                                  onClick={() => handleOpenDeleteModal(event, i)}
                                  sx={{
                                    width: 30,
                                    height: 30,
                                    p: 0,
                                    borderRadius: "10px",
                                    backgroundColor: RED,
                                    border: "1px solid transparent",
                                    color: "#FFFFFF",
                                    boxShadow: "0 2px 5px rgba(212, 43, 43, 0.28)",
                                    transition: "color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
                                    "&:hover": {
                                      backgroundColor: "#FFFFFF",
                                      borderColor: "#FFCDD2",
                                      color: RED,
                                      boxShadow: "0 1px 2px rgba(16, 24, 40, 0.06)",
                                    },
                                    "&:active": { backgroundColor: "#FEE2E2", color: RED },
                                    "&.Mui-focusVisible": {
                                      boxShadow: "inset 0 0 0 2px rgba(212, 43, 43, 0.45)",
                                    },
                                  }}
                                >
                                  <DeleteOutlinedIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
                        </Box>
                        {/* Half day slot + working timings */}
                        {event.type === "halfDay" && event.halfDaySlot && (
                          <Typography sx={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: meta.text, mt: 0.25 }}>
                            {HALF_DAY_SLOTS[event.halfDaySlot].label} ({HALF_DAY_SLOTS[event.halfDaySlot].window})
                          </Typography>
                        )}
                        {event.type === "halfDay" && event.halfDaySlot && (
                          <Typography sx={{ fontFamily: FONT, fontSize: 11.5, color: "#64748B", mt: 0.25 }}>
                            {HALF_DAY_SLOTS[event.halfDaySlot].range}
                          </Typography>
                        )}
                        {event.type !== "halfDay" && event.time && (
                          <Typography sx={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: meta.text, mt: 0.25 }}>
                            {event.time}
                          </Typography>
                        )}
                        {event.description && (
                          <Typography sx={{ fontFamily: FONT, fontSize: 12, color: "#4B5563", mt: 0.25 }}>
                            {event.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* ════ ADD / EDIT EVENT MODAL POPUP (Compact, Crisp, Snug & Beautifully Proportioned) ════ */}
      <Dialog
        open={openAddModal}
        onClose={closeEventModal}
        maxWidth="xs"
        fullWidth
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: "rgba(15, 23, 42, 0.45)",
              backdropFilter: "blur(4px)",
            },
          },
          paper: {
            sx: {
              borderRadius: "18px",
              p: "20px 22px",
              maxWidth: "385px",
              width: "100%",
              margin: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
              border: "1px solid #E2E8F0",
              backgroundColor: "#F8FAFC",
              fontFamily: FONT,
              WebkitFontSmoothing: "antialiased",
              overflow: "hidden",
              boxSizing: "border-box",
            },
          },
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography sx={{ fontFamily: FONT, fontSize: 17, fontWeight: 700, color: "#0F172A", lineHeight: 1.2 }}>
            {editingTarget ? "Edit Event" : "Add New Event"}
          </Typography>
          <IconButton
            size="small"
            onClick={closeEventModal}
            sx={{
              color: "#64748B",
              p: 0.4,
              borderRadius: "8px",
              "&:hover": { color: "#0F172A", backgroundColor: "#E2E8F0" },
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Form Body – Compact vertical spacing */}
        <Box component="form" onSubmit={handleSaveEvent} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {/* Event Title */}
          <Box>
            <Typography sx={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 700, color: "#0F172A", mb: 0.5 }}>
              Event Title
            </Typography>
            <input
              type="text"
              required
              placeholder="e.g. Independence Day"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              style={{
                width: "100%",
                height: "40px",
                padding: "0 14px",
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                fontSize: "13.5px",
                fontFamily: "var(--font-family)",
                outline: "none",
                backgroundColor: "#FFFFFF",
                color: "#0F172A",
                boxSizing: "border-box",
                transition: "all 0.15s ease",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
              }}
            />
          </Box>

          {/* Event Type (Holiday) */}
          <Box>
            <Typography sx={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 700, color: "#0F172A", mb: 0.5 }}>
              Event Type
            </Typography>
            <div style={{ position: "relative", width: "100%" }}>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as CalendarEventType)}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 38px 0 14px",
                  borderRadius: "10px",
                  border: "1px solid #E2E8F0",
                  fontSize: "13.5px",
                  fontFamily: "var(--font-family)",
                  fontWeight: 500,
                  outline: "none",
                  backgroundColor: "#FFFFFF",
                  color: "#0F172A",
                  appearance: "none",
                  cursor: "pointer",
                  boxSizing: "border-box",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
                }}
              >
                <option value="holiday">Company Holiday</option>
                <option value="halfDay">Half Day</option>
              </select>
              <KeyboardArrowDownIcon
                sx={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 18,
                  color: "#64748B",
                  pointerEvents: "none",
                }}
              />
            </div>
          </Box>

          {/* Half Day – extra field, appears only when "Half Day" is selected */}
          {formType === "halfDay" && (
            <Box>
              <Typography sx={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 700, color: "#0F172A", mb: 0.5 }}>
                Half Day
              </Typography>
              <div style={{ position: "relative", width: "100%" }}>
                <select
                  value={formHalfDaySlot}
                  onChange={(e) => setFormHalfDaySlot(e.target.value as HalfDaySlot)}
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 38px 0 14px",
                    borderRadius: "10px",
                    border: "1px solid #E2E8F0",
                    fontSize: "13.5px",
                    fontFamily: "var(--font-family)",
                    fontWeight: 500,
                    outline: "none",
                    backgroundColor: "#FFFFFF",
                    color: "#0F172A",
                    appearance: "none",
                    cursor: "pointer",
                    boxSizing: "border-box",
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
                  }}
                >
                  <option value="first">First Half — 9:30 AM to 2:00 PM</option>
                  <option value="second">Second Half — 2:00 PM to 6:30 PM</option>
                </select>
                <KeyboardArrowDownIcon
                  sx={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 18,
                    color: "#64748B",
                    pointerEvents: "none",
                  }}
                />
              </div>
              <Typography sx={{ fontFamily: FONT, fontSize: 12, color: "#64748B", mt: 0.5 }}>
                {HALF_DAY_SLOTS[formHalfDaySlot].label} working hours: {HALF_DAY_SLOTS[formHalfDaySlot].range}
              </Typography>
            </Box>
          )}

          {/* Date */}
          <Box>
            <Typography sx={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 700, color: "#0F172A", mb: 0.5 }}>
              Date
            </Typography>
            <div style={{ position: "relative", width: "100%" }}>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 38px 0 14px",
                  borderRadius: "10px",
                  border: "1px solid #E2E8F0",
                  fontSize: "13.5px",
                  fontFamily: "var(--font-family)",
                  outline: "none",
                  backgroundColor: "#FFFFFF",
                  color: "#0F172A",
                  boxSizing: "border-box",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
                }}
              />
              <CalendarTodayOutlinedIcon
                sx={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 17,
                  color: "#64748B",
                  pointerEvents: "none",
                }}
              />
            </div>
          </Box>

          {/* Description */}
          <Box>
            <Typography sx={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 700, color: "#0F172A", mb: 0.5 }}>
              Description
            </Typography>
            <textarea
              rows={3}
              placeholder="Add event details..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                fontSize: "13.5px",
                fontFamily: "var(--font-family)",
                outline: "none",
                backgroundColor: "#FFFFFF",
                color: "#0F172A",
                resize: "none",
                boxSizing: "border-box",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
              }}
            />
          </Box>

          {/* Footer action buttons */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 1.25,
              mt: 1,
            }}
          >
            <Button
              type="button"
              onClick={closeEventModal}
              sx={{
                fontFamily: FONT,
                fontSize: 13.5,
                fontWeight: 600,
                textTransform: "none",
                backgroundColor: "#E2E8F0",
                color: "#0F172A",
                borderRadius: "10px",
                px: 2.5,
                height: "38px",
                boxShadow: "none",
                "&:hover": { backgroundColor: "#CBD5E1" },
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              sx={{
                fontFamily: FONT,
                fontSize: 13.5,
                fontWeight: 600,
                textTransform: "none",
                backgroundColor: GREEN,
                color: "#FFFFFF",
                borderRadius: "10px",
                px: 2.5,
                height: "38px",
                boxShadow: "0 3px 8px rgba(27,107,51,0.25)",
                "&:hover": { backgroundColor: GREEN_MID },
              }}
            >
              {editingTarget ? "Update Event" : "Save Event"}
            </Button>
          </Box>
        </Box>
      </Dialog>

      {/* ════ DELETE EVENT CONFIRMATION (Small popup) ════ */}
      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: "rgba(15, 23, 42, 0.45)",
              backdropFilter: "blur(4px)",
            },
          },
          paper: {
            sx: {
              borderRadius: "16px",
              p: "18px 20px",
              maxWidth: "345px",
              width: "100%",
              margin: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
              border: "1px solid #E2E8F0",
              backgroundColor: "#FFFFFF",
              fontFamily: FONT,
              WebkitFontSmoothing: "antialiased",
              overflow: "hidden",
              boxSizing: "border-box",
            },
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "10px",
              backgroundColor: "#FFEBEE",
              color: RED,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <DeleteOutlinedIcon sx={{ fontSize: 20 }} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontFamily: FONT, fontSize: 15.5, fontWeight: 700, color: "#0F172A", lineHeight: 1.2 }}>
              Are you sure you want to delete this event?
            </Typography>
          </Box>
        </Box>

        {/* Footer action buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 1.25,
            mt: 2.25,
          }}
        >
          <Button
            type="button"
            onClick={() => setDeleteTarget(null)}
            sx={{
              fontFamily: FONT,
              fontSize: 13.5,
              fontWeight: 600,
              textTransform: "none",
              backgroundColor: "#E2E8F0",
              color: "#0F172A",
              borderRadius: "10px",
              px: 2.5,
              height: "38px",
              boxShadow: "none",
              "&:hover": { backgroundColor: "#CBD5E1" },
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirmDelete}
            sx={{
              fontFamily: FONT,
              fontSize: 13.5,
              fontWeight: 600,
              textTransform: "none",
              backgroundColor: RED,
              color: "#FFFFFF",
              borderRadius: "10px",
              px: 2.5,
              height: "38px",
              boxShadow: "0 3px 8px rgba(212,43,43,0.25)",
              "&:hover": { backgroundColor: "#B71C1C" },
            }}
          >
            Delete
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}

export default CompanyCalendar;