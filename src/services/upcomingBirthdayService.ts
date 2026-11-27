import api from "../api/axiosInstance";

export interface UpcomingBirthday {
  _id: string;
  employeeName: string;
  employeeId: string;
  birthday: string;
  formattedBirthday: string;
  daysRemaining: number;
  isToday: boolean;
}

interface UpcomingBirthdayResponse {
  success: boolean;
  message: string;
  count: number;
  data: UpcomingBirthday[];
}

export const getUpcomingBirthdays = async (): Promise<
  UpcomingBirthday[]
> => {
  const response = await api.get<UpcomingBirthdayResponse>(
    "/birthday-creation/upcoming"
  );

  if (
    !response.data.success ||
    !Array.isArray(response.data.data)
  ) {
    throw new Error(
      response.data.message ||
        "Unable to load upcoming birthdays"
    );
  }

  return response.data.data;
};