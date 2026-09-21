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

import EmployeeCheckInOut from "../Pages/EmployeeCheckInOut/EmployeeCheckInOut";

import Holiday from "../Pages/Holiday/Holiday";

import AdminLeavesPermissions from "../Pages/LeavesPermissions/Admin/AdminLeavesPermissions";

import EmployeeLeavesPermissions from "../Pages/LeavesPermissions/Employee/EmployeeLeavesPermissions";

import Details from "../Pages/LeavesPermissions/Admin/Details/Details";

import {
  ADMIN,
  HR,
  EMPLOYEE,
} from "../data/permissions";


/* =========================================================
   HOLIDAY PROTECTED ROUTE
   ADMIN + HR ONLY
========================================================= */

function HolidayRoute() {
  const storedUser =
    localStorage.getItem("loggedInUser");

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

    if (
      userType === ADMIN ||
      userType === HR
    ) {
      return <Holiday />;
    }

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


/* =========================================================
   LEAVES / PERMISSIONS REDIRECT

   This keeps your old sidebar route:
   /leaves-permissions

   Admin/HR -> Admin Leave Requests
   Employee -> Employee Leaves & Permissions
========================================================= */

function LeavesPermissionsRoute() {
  const storedUser =
    localStorage.getItem("loggedInUser");

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

    if (
      userType === ADMIN ||
      userType === HR
    ) {
      return (
        <Navigate
          to="/admin-leaves-permissions"
          replace
        />
      );
    }

    if (userType === EMPLOYEE) {
      return (
        <Navigate
          to="/employee-leaves-permissions"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/login"
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


/* =========================================================
   ROUTER
========================================================= */

export const route = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },

  {
    path: "/",
    element: <MainLayout />,

    children: [
      /* =====================================
         DEFAULT
      ===================================== */

      {
        index: true,
        element: (
          <Navigate
            to="/admindashboard"
            replace
          />
        ),
      },


      /* =====================================
         ADMIN DASHBOARD
      ===================================== */

      {
        path: "admindashboard",
        element: <Admin />,
      },


      /* =====================================
         HR DASHBOARD
      ===================================== */

      {
        path: "hrdashboard",
        element: <HRDashboard />,
      },


      /* =====================================
         EMPLOYEE DASHBOARD
      ===================================== */

      {
        path: "employeedashboard",
        element: <EmployeeDashboard />,
      },


      /* =====================================
         COMPANY CALENDAR
      ===================================== */

      {
        path: "calendar",
        element: <CompanyCalendar />,
      },


      /* =====================================
         ATTENDANCE
      ===================================== */

      {
        path: "attendance",
        element: <Attendance />,
      },


      /* =====================================
         EMPLOYEE CREATION
      ===================================== */

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


      /* =====================================
         OLD LEAVE ROUTE
         Redirect based on role
      ===================================== */

      {
        path: "leaves-permissions",
        element: <LeavesPermissionsRoute />,
      },


      /* =====================================
         ADMIN / HR LEAVE REQUESTS
      ===================================== */

      {
        path: "admin-leaves-permissions",
        element: <AdminLeavesPermissions />,
      },


      /* =====================================
         LEAVE REQUEST DETAILS
      ===================================== */

      {
        path: "admin-leaves-permissions/employee-Details",
        element: <Details />,
      },


      /* =====================================
         EMPLOYEE LEAVES / PERMISSIONS
      ===================================== */

      {
        path: "employee-leaves-permissions",
        element: <EmployeeLeavesPermissions />,
      },


      /* =====================================
         CHECK IN / OUT
      ===================================== */

      {
        path: "checkinout",
        element: <EmployeeCheckInOut />,
      },


      /* =====================================
         HOLIDAY
         ADMIN + HR ONLY
      ===================================== */

      {
        path: "holiday",
        element: <HolidayRoute />,
      },
    ],
  },
]);