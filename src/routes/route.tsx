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

import Employee_Creation from "../Pages/Employee_Creation";
import LeavesPermissions from "../Pages/LeavesPermissions";

import EmployeeCheckInOut from "../Pages/EmployeeCheckInOut/EmployeeCheckInOut";

import ProtectedRoute from "../Components/ProtectedRoute/ProtectedRoute";


/* =========================================
   ROLE BASED HOME REDIRECT

   1 = HR
   2 = Admin
   3 = Employee
========================================= */

function RoleBasedHome() {
  const storedUser =
    localStorage.getItem("loggedInUser");

  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(storedUser);

    const userType = Number(user.userType);

    if (userType === 1) {
      return (
        <Navigate
          to="/hrdashboard"
          replace
        />
      );
    }

    if (userType === 2) {
      return (
        <Navigate
          to="/admindashboard"
          replace
        />
      );
    }

    if (userType === 3) {
      return (
        <Navigate
          to="/employeedashboard"
          replace
        />
      );
    }

    return <Navigate to="/login" replace />;
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUser");

    return <Navigate to="/login" replace />;
  }
}


/* =========================================
   ROUTER
========================================= */

export const route = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },

  {
    path: "/",

    element: (
      <ProtectedRoute allowedRoles={[1, 2, 3]}>
        <MainLayout />
      </ProtectedRoute>
    ),

    children: [
      /* DEFAULT */

      {
        index: true,
        element: <RoleBasedHome />,
      },

      /* HR DASHBOARD */

      {
        path: "hrdashboard",
        element: (
          <ProtectedRoute allowedRoles={[1]}>
            <HRDashboard />
          </ProtectedRoute>
        ),
      },

      /* ADMIN DASHBOARD */

      {
        path: "admindashboard",
        element: (
          <ProtectedRoute allowedRoles={[2]}>
            <Admin />
          </ProtectedRoute>
        ),
      },

      /* EMPLOYEE DASHBOARD */

      {
        path: "employeedashboard",
        element: (
          <ProtectedRoute allowedRoles={[3]}>
            <EmployeeDashboard />
          </ProtectedRoute>
        ),
      },

      /* EMPLOYEE CREATION */

      {
        path: "employee-creation",
        element: (
          <ProtectedRoute allowedRoles={[1, 2]}>
            <Employee_Creation />
          </ProtectedRoute>
        ),
      },

      /* ATTENDANCE */

      {
        path: "attendance",
        element: (
          <ProtectedRoute allowedRoles={[1, 2, 3]}>
            <Attendance />
          </ProtectedRoute>
        ),
      },

      /* COMPANY CALENDAR */

      {
        path: "calendar",
        element: (
          <ProtectedRoute allowedRoles={[1, 2, 3]}>
            <CompanyCalendar />
          </ProtectedRoute>
        ),
      },

      /* CHECK IN / OUT */

      {
        path: "checkinout",
        element: (
          <ProtectedRoute allowedRoles={[1, 2, 3]}>
            <EmployeeCheckInOut />
          </ProtectedRoute>
        ),
      },

      /* LEAVES AND PERMISSIONS */

      {
        path: "leaves-permissions",
        element: (
          <ProtectedRoute allowedRoles={[1, 2, 3]}>
            <LeavesPermissions />
          </ProtectedRoute>
        ),
      },
    ],
  },

  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);