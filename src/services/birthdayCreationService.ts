
import axiosInstance from "../api/axiosInstance";

export interface BirthdayReward {
  _id: string;
  employeeName: string;
  employeeId: string;
  dob: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BirthdayPayload {
  employeeName: string;
  employeeId: string;
  dob: string;
}

// GET ALL BIRTHDAYS
export const getAllBirthdays = async () => {
  const response = await axiosInstance.get(
    "birthday-rewards/list"
  );

  return response.data;
};

// CREATE BIRTHDAY
export const createBirthday = async (
  payload: BirthdayPayload
) => {
  const response = await axiosInstance.post(
    "birthday-rewards/create",
    payload
  );

  return response.data;
};

// GET BIRTHDAY BY EMPLOYEE ID
export const getBirthdayByEmployeeId = async (
  employeeId: string
) => {
  const response = await axiosInstance.get(
    `birthday-rewards/${encodeURIComponent(employeeId)}`
  );

  return response.data;
};

// UPDATE BIRTHDAY
export const updateBirthday = async (
  employeeId: string,
  payload: BirthdayPayload
) => {
  const response = await axiosInstance.put(
    `birthday-rewards/${encodeURIComponent(employeeId)}`,
    payload
  );

  return response.data;
};

// DELETE BIRTHDAY
export const deleteBirthday = async (
  employeeId: string
) => {
  const response = await axiosInstance.delete(
    `birthday-rewards/${encodeURIComponent(employeeId)}`
  );

  return response.data;
};




