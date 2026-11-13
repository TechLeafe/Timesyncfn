
import axiosInstance from "../api/axiosInstance";

export interface BirthdayCreation {
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
    "birthday-creation/list"
  );
 console.log(response.data);
  return response.data;
};

// CREATE BIRTHDAY
export const createBirthday = async (
  payload: BirthdayPayload
) => {
  const response = await axiosInstance.post(
    "birthday-creation/create",
    payload
  );
  return response.data;
};

// GET BIRTHDAY BY EMPLOYEE ID
export const getBirthdayByEmployeeId = async (
  employeeId: string
) => {
  const response = await axiosInstance.get(
    `birthday-creation/${encodeURIComponent(employeeId)}`
  );
  return response.data;
};

// UPDATE BIRTHDAY
export const updateBirthday = async (
  employeeId: string,
  payload: BirthdayPayload
) => {
  const response = await axiosInstance.put(
    `birthday-creation/${encodeURIComponent(employeeId)}`,
    payload
  );
  return response.data;
};

// DELETE BIRTHDAY
export const deleteBirthday = async (
  employeeId: string
) => {
  const response = await axiosInstance.delete(
    `birthday-creation/${encodeURIComponent(employeeId)}`
  );
  return response.data;
};




