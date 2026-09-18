import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../layout/Mainlayout";
import CompanyCalendar from "../Pages/Companycalendar";
import Attendance from "../Pages/Attendance";
import Admin from "../Pages/Dashboard/AdminDashboard";
import EmployeeDashboard from "../Pages/Dashboard/EmployeeDashboard";
import { Login } from "../Pages/Login/Login";
import Employee_Creation from "../Pages/Employee_Creation";
// import LeavesPermissions from "../Pages/LeavesPermissions";

import EmployeeCheckInOut from "../Pages/EmployeeCheckInOut/EmployeeCheckInOut";
import AdminLeavesPermissions from "../Pages/LeavesPermissions/Admin/AdminLeavesPermissions";
import EmployeeLeavesPermissions from "../Pages/LeavesPermissions/Employee/EmployeeLeavesPermissions";
import Details  from "../Pages/LeavesPermissions/Admin/Details/Details";
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
                element: <Navigate to="/admindashboard" replace />,
            },
            {
                path: "admindashboard",
                element: <Admin />
            },
            {
                path: "calendar",
                element: <CompanyCalendar />,
            },
            {
                path: "attendance",
                element: <Attendance />,
            }, {
                path: "employeedashboard",
                element: <EmployeeDashboard />
            },
            {
                path: "employee-creation",
                element: <Employee_Creation />,
            },
            {
                path: "admin-leaves-permissions",
                element: <AdminLeavesPermissions />,
            },
            {
                path: "admin-leaves-permissions/employee-Details",
                element: <Details />,
            },

            // {
            //     path: "admin-leaves-permissions",
            //     element: <AdminLeavesPermissions />,
            //     children:[{
            //     path: "details",
            //     element: <Details />

            //     }]
            // },
            {
                path: "employee-leaves-permissions",
                element: <EmployeeLeavesPermissions />
            },
            {
                path: "checkinout",
                element: <EmployeeCheckInOut />,
            },
        ],
    },
]);