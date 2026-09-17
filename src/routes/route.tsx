import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../layout/Mainlayout";
import CompanyCalendar from "../Pages/Companycalendar";
import Admin from "../Pages/Dashboard/AdminDashboard";
import EmployeeDashboard from "../Pages/Dashboard/EmployeeDashboard";

export const route = createBrowserRouter([
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
                path: "employeedashboard",
                element: <EmployeeDashboard />
            },
            {
                path: "calendar",
                element: <CompanyCalendar />,
            },
        ],
    },
]);