export const ATTENDANCE_UPDATED_EVENT = "attendance:updated";
export const ATTENDANCE_UPDATED_STORAGE_KEY = "attendance:updated";

export type AttendanceUpdate = {
  userId: string;
  date: string;
};

export const notifyAttendanceUpdated = (
  update: AttendanceUpdate
): void => {
  const notification = {
    ...update,
    timestamp: Date.now(),
  };

  window.dispatchEvent(
    new CustomEvent<AttendanceUpdate>(
      ATTENDANCE_UPDATED_EVENT,
      { detail: update }
    )
  );

  try {
    localStorage.setItem(
      ATTENDANCE_UPDATED_STORAGE_KEY,
      JSON.stringify(notification)
    );
  } catch (error: unknown) {
    console.error("Unable to notify other tabs about attendance update:", error);
  }
};
