import {
  createBrowserRouter,
  Navigate,
} from "react-router-dom";

import MainLayout from "../layout/Mainlayout";

import CompanyCalendar from "../Pages/Companycalendar";
import Attendance from "../Pages/Attendance";

import Admin from "../Pages/Dashboard/AdminDashboard";
import EmployeeDashboard from "../Pages/Dashboard/EmployeeDashboard";
import HRDashboard from "../Pages/Dashboard/HRDashboard";

import { Login } from "../Pages/Login/Login";

import Employee_Creation from "../Pages/Employee_Creation/Employee_Creation";
import LeavesPermissions from "../Pages/LeavesPermissions";
import Holiday from "../Pages/Holiday/Holiday";

import EmployeeCheckInOut from "../Pages/EmployeeCheckInOut/EmployeeCheckInOut";

import {
  ADMIN,
  HR,
} from "../data/permissions";


/* ==========================================
   HOLIDAY ROUTE
   Only Admin and HR can access
========================================== */

function HolidayRoute() {
  const storedUser =
    localStorage.getItem("loggedInUser");

  // Not logged in
  if (!storedUser) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  try {
    const user = JSON.parse(storedUser);

    const userType = Number(user.userType);

    // Admin or HR
    if (
      userType === ADMIN ||
      userType === HR
    ) {
      return <Holiday />;
    }

    // Employee is not allowed
    return (
      <Navigate
        to="/employeedashboard"
        replace
      />
    );
  } catch {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }
}


/* ==========================================
   ROUTES
========================================== */

export const route = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },

  {
    path: "/",
    element: <MainLayout />,

    children: [
      {
        index: true,
        element: (
          <Navigate
            to="/admindashboard"
            replace
          />
        ),
      },

      /* ADMIN DASHBOARD */
      {
        path: "admindashboard",
        element: <Admin />,
      },

      /* HR DASHBOARD */
      {
        path: "hrdashboard",
        element: <HRDashboard />,
      },

      /* EMPLOYEE DASHBOARD */
      {
        path: "employeedashboard",
        element: <EmployeeDashboard />,
      },

      /* COMPANY CALENDAR */
      {
        path: "calendar",
        element: <CompanyCalendar />,
      },

      /* ATTENDANCE */
      {
        path: "attendance",
        element: <Attendance />,
      },

      /* EMPLOYEE CREATION */
      {
        path: "employee-creation",
        element: <Employee_Creation />,
      },

      {
        path: "employee-creation/create",
        element: <Employee_Creation />,
      },

      {
        path: "employee-creation/edit",
        element: <Employee_Creation />,
      },

      /* LEAVES AND PERMISSIONS */
      {
        path: "leaves-permissions",
        element: <LeavesPermissions />,
      },

      /* CHECK IN / OUT */
      {
        path: "checkinout",
        element: <EmployeeCheckInOut />,
      },

      /* ==========================
         HOLIDAY
         ADMIN + HR ONLY
      ========================== */
      {
        path: "holiday",
        element: <HolidayRoute />,
      },
    ],
  },
]);