import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../layout/Mainlayout";
import CompanyCalendar from "../Pages/Companycalendar";
import Admin from "../Pages/Admin/AdminDashboard";
import EmployeeCreation from "../Pages/Admin/Employee_Creation";
import LeavesPermissions from "../Pages/LeavesPermissions";

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
                path: "employee-creation",
                element: <EmployeeCreation />,
            },
            {
                path: "calendar",
                element: <CompanyCalendar />,
            },
            {
                path: "leaves-permissions",
                element: <LeavesPermissions />,
            },
        ],
    },
]);