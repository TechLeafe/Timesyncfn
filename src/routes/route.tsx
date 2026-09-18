import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../layout/Mainlayout";
import CompanyCalendar from "../Pages/Companycalendar";
import Attendance from "../Pages/Attendance";
import Admin from "../Pages/Dashboard/AdminDashboard";
import EmployeeDashboard from "../Pages/Dashboard/EmployeeDashboard";
import { Login } from "../Pages/Login/Login";
<<<<<<< HEAD
import Employee_Creation from "../Pages/Employee_Creation";
import LeavesPermissions from "../Pages/LeavesPermissions";

=======
import EmployeeCheckInOut from "../Pages/EmployeeCheckInOut/EmployeeCheckInOut";
>>>>>>> 1f75c198fc612493e7ce8a7dcbdf71809ee964e5
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
            },            {
                path: "employeedashboard",
                element: <EmployeeDashboard />
            },
             {
                path: "employee-creation",
                element: <Employee_Creation />,
            },            {
                path: "leaves-permissions",
                element: <LeavesPermissions />
            },
            {
                path: "checkinout",
                element: <EmployeeCheckInOut />,
            },
        ],
    },
]);