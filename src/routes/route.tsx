import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../layout/Mainlayout";
import CompanyCalendar from "../Pages/Admin/Companycalendar";

export const route = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: <Navigate to="/calendar" replace />,
            },
            {
                path: "calendar",
                element: <CompanyCalendar />,
            },
        ],
    },
]);