import { lazy } from "react";
import {
  createBrowserRouter,
  Navigate,
} from "react-router-dom";

import MainLayout from "../layout/Mainlayout";
import ProtectedRoute from "../Components/ProtectedRoute/ProtectedRoute";
import {
  ADMIN,
  HR,
  EMPLOYEE,
} from "../data/permissions";


const CompanyCalendar = lazy(() => import("../Pages/CompanyCalendar/Companycalendar"));
const Attendance = lazy(() => import("../Pages/Attendance/Attendance"));
const Admin = lazy(() => import("../Pages/Dashboard/AdminDashboard"));
const EmployeeDashboard = lazy(() => import("../Pages/Dashboard/EmployeeDashboard"));
const HRDashboard = lazy(() => import("../Pages/Dashboard/HRDashboard"));
const Login = lazy(() =>
  import("../Pages/Login/Login").then((module) => ({ default: module.Login }))
);
const OrganisationChart = lazy(() => import("../Pages/OrganisationChart/OrganisationChart"));
const Employee_Creation = lazy(() => import("../Pages/Employee_Creation/Employee_Creation"));
const BirthdayCreation = lazy(() => import("../Pages/BirthdayCreation/BirthdayCreation"));
const EmployeeCheckInOut = lazy(() => import("../Pages/EmployeeCheckInOut/EmployeeCheckInOut"));
const AdminCheckinout = lazy(() => import("../Pages/Employee Management/CheckInOut/AdminCheckinout"));
const Holiday = lazy(() => import("../Pages/Holiday/Holiday"));
const AdminLeavesPermissions = lazy(() => import("../Pages/LeavesPermissions/Admin/AdminLeavesPermissions"));
const EmployeeLeavesPermissions = lazy(() => import("../Pages/LeavesPermissions/Employee/EmployeeLeavesPermissions"));
const Details = lazy(() => import("../Pages/LeavesPermissions/Admin/EmployeeLeaveDetail/EmployeeLeaveDetail"));
const LeaveDetail = lazy(() => import("../Pages/LeavesPermissions/Employee/LeaveDetail/LeaveDetail"));
const DailyTask = lazy(() => import("../Pages/DailyTask/DailyTask"));
const AddTask = lazy(() => import("../Pages/DailyTask/AddTask"));
const TaskDetails = lazy(() => import("../Pages/DailyTask/TaskDetails"));


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

const LeavePolicies = lazy(() => import("../Pages/LeavePolicies/LeavePolicies"));

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
            { path: "organisation-chart",
              element: ( <ProtectedRoute allowedRoles={[EMPLOYEE, HR, ADMIN]}>
                         <OrganisationChart />
                         </ProtectedRoute>
                      ),
            },
            { path: "birthday-creation",
              element: ( <ProtectedRoute allowedRoles={[HR, ADMIN]}>
                         <BirthdayCreation />
                         </ProtectedRoute>
                       ),
           },
        ],
    },
]);