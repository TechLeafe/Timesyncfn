
import axiosInstance from "./axiosInstance";

export const downloadAttendanceExcel = async (
  startDate: string,
  endDate: string
) => {
  const response = await axiosInstance.get(
    "attendance/export",
    {
      params: { startDate, endDate },
      responseType: "blob",
    }
  );

  const blob = new Blob([response.data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download =
    `Employee_Attendance_${startDate}_to_${endDate}.xlsx`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
};
