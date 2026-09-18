import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../layout/Mainlayout";
import CompanyCalendar from "../Pages/Companycalendar";
import Attendance from "../Pages/Attendance";
import Admin from "../Pages/Dashboard/AdminDashboard";
import EmployeeDashboard from "../Pages/Dashboard/EmployeeDashboard";
import { Login } from "../Pages/Login/Login";
import EmployeeCheckInOut from "../Pages/EmployeeCheckInOut/EmployeeCheckInOut";
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
                path: "hrdashboard",
                element: <Admin />
            },
            {
                path: "employeedashboard",
                element: <EmployeeDashboard />
            },
            {
                path: "calendar",
                element: <CompanyCalendar />,
            },
            {
                path: "attendance",
                element: <Attendance />,
            },
            {
                path: "checkinout",
                element: <EmployeeCheckInOut />,
            },
        ],
    },
]);