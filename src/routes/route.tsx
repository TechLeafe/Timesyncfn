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
// import Employee_Creation from "../Pages/Employee_Creation";
// import LeavesPermissions from "../Pages/LeavesPermissions";

import EmployeeCheckInOut from "../Pages/EmployeeCheckInOut/EmployeeCheckInOut";

import AdminCheckinout from "../Pages/Employee Management/CheckInOut/AdminCheckinout";

import ProtectedRoute from "../Components/ProtectedRoute/ProtectedRoute";

import Holiday from "../Pages/Holiday/Holiday";

import AdminLeavesPermissions from "../Pages/LeavesPermissions/Admin/AdminLeavesPermissions";

import EmployeeLeavesPermissions from "../Pages/LeavesPermissions/Employee/EmployeeLeavesPermissions";

import Details from "../Pages/LeavesPermissions/Admin/EmployeeLeaveDetail/EmployeeLeaveDetail";

import LeaveDetail from "../Pages/LeavesPermissions/Employee/LeaveDetail/LeaveDetail";
import DailyTask from "../Pages/DailyTask/DailyTask";
import AddTask from "../Pages/DailyTask/AddTask";
import TaskDetails from "../Pages/DailyTask/TaskDetails";
import {
  ADMIN,
  HR,
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
   ROUTER
========================================================= */

//import Details  from "../Pages/LeavesPermissions/Admin/Details/Details";
import LeavePolicies from "../Pages/LeavePolicies/LeavePolicies";
// import EmployeeCheckInOut from "../Pages/EmployeeCheckInOut/EmployeeCheckInOut";
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
                element: <Navigate to="/login" replace />,
            },
            {
                path: "admindashboard",
                element: <Admin />
            },
            {
                path: "hrdashboard",
                element: <HRDashboard />
            },
            {
                path: "calendar",
                element: <CompanyCalendar />,
            },
            {
              path: "holiday",
              element: <HolidayRoute />,
            },
            {
                path: "attendance",
                element: <Attendance />,
            }, {
                path: "employeedashboard",
                element: <EmployeeDashboard />
            },
            {
        path: "daily-task",
        element: <DailyTask />,
      },
 
      {
        path: "daily-task/add",
        element: <AddTask />,
      },
 
      {
        path: "daily-task/:id",
        element: <TaskDetails />,
      },
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
            {
                path: "admin-leaves-permissions",
                element: <AdminLeavesPermissions />,
            },
            {
                path: "admin-leaves-permissions/employee-Details/:id",
                element: <Details />,
            },
            {
                path: "employee-leaves-permissions",
                element: <EmployeeLeavesPermissions />
            },
            {
                path: "employee-leaves-permissions/leave-detail/:id",
                element: <LeaveDetail />,
            },
            {
                path: "checkinout",
                element: <EmployeeCheckInOut />,
            },
            {
                path: "employee-management",
                element: (
                    <ProtectedRoute allowedRoles={[HR, ADMIN]}>
                        <AdminCheckinout />
                    </ProtectedRoute>
                ),
            },
            {
              path : "leave-policies",
              element: <LeavePolicies />
            },
        ],
    },
]);