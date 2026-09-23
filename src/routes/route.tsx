import {
  createBrowserRouter,
  Navigate,
} from "react-router-dom";

import MainLayout from "../layout/Mainlayout";

import CompanyCalendar from "../Pages/Companycalendar";
import Attendance from "../Pages/Attendance";

import Admin from "../Pages/Dashboard/AdminDashboard";
import EmployeeDashboard from "../Pages/Dashboard/EmployeeDashboard";
// import HRDashboard from "../Pages/Dashboard/HRDashboard";

import { Login } from "../Pages/Login/Login";

import Employee_Creation from "../Pages/Employee_Creation/Employee_Creation";

import EmployeeCheckInOut from "../Pages/EmployeeCheckInOut/EmployeeCheckInOut";

import Holiday from "../Pages/Holiday/Holiday";

import AdminLeavesPermissions from "../Pages/LeavesPermissions/Admin/AdminLeavesPermissions";

import EmployeeLeavesPermissions from "../Pages/LeavesPermissions/Employee/EmployeeLeavesPermissions";

import Details from "../Pages/LeavesPermissions/Admin/Details/Details";

import LeavePolicies from "../Pages/LeavePolicies/LeavePolicies";


/* =========================================================
   DAILY TASK IMPORTS
========================================================= */

import DailyTask from "../Pages/DailyTask/DailyTask";
import AddTask from "../Pages/DailyTask/AddTask";
import TaskDetails from "../Pages/DailyTask/TaskDetails";


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
   DAILY TASK PROTECTED ROUTE
   ADMIN ONLY
========================================================= */

function DailyTaskRoute() {
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

    if (userType === ADMIN) {
      return <DailyTask />;
    }

    if (userType === EMPLOYEE) {
      return (
        <Navigate
          to="/employeedashboard"
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
   ADD TASK PROTECTED ROUTE
   ADMIN ONLY
========================================================= */

function AddTaskRoute() {
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

    if (userType === ADMIN) {
      return <AddTask />;
    }

    if (userType === EMPLOYEE) {
      return (
        <Navigate
          to="/employeedashboard"
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
   TASK DETAILS PROTECTED ROUTE
   ADMIN ONLY
========================================================= */

function TaskDetailsRoute() {
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

    if (userType === ADMIN) {
      return <TaskDetails />;
    }

    if (userType === EMPLOYEE) {
      return (
        <Navigate
          to="/employeedashboard"
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
      /* =========================
         DEFAULT
      ========================= */

      {
        index: true,
        element: (
          <Navigate
            to="/admindashboard"
            replace
          />
        ),
      },


      /* =========================
         ADMIN DASHBOARD
      ========================= */

      {
        path: "admindashboard",
        element: <Admin />,
      },


      /* =========================
         EMPLOYEE DASHBOARD
      ========================= */

      {
        path: "employeedashboard",
        element: <EmployeeDashboard />,
      },


      /* =====================================================
         DAILY TASK
      ===================================================== */

      {
        path: "daily-task",
        element: <DailyTaskRoute />,
      },

      {
        path: "daily-task/add",
        element: <AddTaskRoute />,
      },

      {
        path: "daily-task/:id",
        element: <TaskDetailsRoute />,
      },


      /* =========================
         COMPANY CALENDAR
      ========================= */

      {
        path: "calendar",
        element: <CompanyCalendar />,
      },


      /* =========================
         HOLIDAY
      ========================= */

      {
        path: "holiday",
        element: <HolidayRoute />,
      },


      /* =========================
         ATTENDANCE
      ========================= */

      {
        path: "attendance",
        element: <Attendance />,
      },


      /* =========================
         EMPLOYEE CREATION
      ========================= */

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


      /* =========================
         ADMIN LEAVES
      ========================= */

      {
        path: "admin-leaves-permissions",
        element: <AdminLeavesPermissions />,
      },

      {
        path: "admin-leaves-permissions/employee-Details",
        element: <Details />,
      },


      /* =========================
         EMPLOYEE LEAVES
      ========================= */

      {
        path: "employee-leaves-permissions",
        element: <EmployeeLeavesPermissions />,
      },


      /* =========================
         CHECK IN / OUT
      ========================= */

      {
        path: "checkinout",
        element: <EmployeeCheckInOut />,
      },


      /* =========================
         LEAVE POLICIES
      ========================= */

      {
        path: "leave-policies",
        element: <LeavePolicies />,
      },


      /* =========================
         OLD LEAVE ROUTE REDIRECT
      ========================= */

      {
        path: "leaves-permissions",
        element: <LeavesPermissionsRoute />,
      },
    ],
  },
]);