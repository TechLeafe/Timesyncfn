import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../layout/Mainlayout";
import CompanyCalendar from "../Pages/Companycalendar";
import Admin from "../Pages/Admin/AdminDashboard";
import Attendance from "../Pages/Admin/Attendance";

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
                path: "calendar",
                element: <CompanyCalendar />,
            },
            {
                path: "attendance",
                element: <Attendance />,
            },
        ],
    },
]);