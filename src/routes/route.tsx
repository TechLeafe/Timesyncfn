import { lazy, type ComponentType } from "react";
import {
  createBrowserRouter,
  Navigate,
  useRouteError,
} from "react-router-dom";

import MainLayout from "../layout/Mainlayout";
import ProtectedRoute from "../Components/ProtectedRoute/ProtectedRoute";
import {
  ADMIN,
  HR,
  EMPLOYEE,
} from "../data/permissions";

const LAZY_IMPORT_RELOAD_KEY = "timesync:lazy-import-reload";

function lazyPage<T extends { default: ComponentType }>(load: () => Promise<T>) {
  return lazy(async () => {
    try {
      const page = await load();
      try {
        sessionStorage.removeItem(LAZY_IMPORT_RELOAD_KEY);
      } catch {
        // Storage can be unavailable in restricted browser contexts.
      }
      return page;
    } catch (error) {
      let alreadyReloaded = false;
      let retryAvailable = false;
      try {
        alreadyReloaded = sessionStorage.getItem(LAZY_IMPORT_RELOAD_KEY) === "1";
        if (!alreadyReloaded) {
          sessionStorage.setItem(LAZY_IMPORT_RELOAD_KEY, "1");
          retryAvailable = true;
        }
      } catch {
        // Continue to the route error screen if storage is unavailable.
      }

      if (!alreadyReloaded && retryAvailable) {
        window.location.reload();
        return new Promise<T>(() => {});
      }

      throw error;
    }
  });
}

function RouteErrorPage() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : "The page could not be loaded.";

  return (
    <main role="alert" style={{ maxWidth: 640, margin: "12vh auto", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>We couldn’t open this page</h1>
      <p>{message}</p>
      <button type="button" onClick={() => window.location.reload()}>
        Reload page
      </button>
    </main>
  );
}

const CompanyCalendar = lazyPage(() => import("../Pages/CompanyCalendar/Companycalendar"));
const Attendance = lazyPage(() => import("../Pages/Attendance/Attendance"));
const Admin = lazyPage(() => import("../Pages/Dashboard/AdminDashboard"));
const EmployeeDashboard = lazyPage(() => import("../Pages/Dashboard/EmployeeDashboard"));
const HRDashboard = lazyPage(() => import("../Pages/Dashboard/HRDashboard"));
const Login = lazyPage(() =>
  import("../Pages/Login/Login").then((module) => ({ default: module.Login }))
);
const OrganisationChart = lazyPage(() => import("../Pages/OrganisationChart/OrganisationChart"));
const Employee_Creation = lazyPage(() => import("../Pages/Employee_Creation/Employee_Creation"));
const BirthdayCreation = lazyPage(() => import("../Pages/BirthdayCreation/BirthdayCreation"));
const EmployeeCheckInOut = lazyPage(() => import("../Pages/EmployeeCheckInOut/EmployeeCheckInOut"));
const AdminCheckinout = lazyPage(() => import("../Pages/Employee Management/CheckInOut/AdminCheckinout"));
const Holiday = lazyPage(() => import("../Pages/Holiday/Holiday"));
const AdminLeavesPermissions = lazyPage(() => import("../Pages/LeavesPermissions/Admin/AdminLeavesPermissions"));
const EmployeeLeavesPermissions = lazyPage(() => import("../Pages/LeavesPermissions/Employee/EmployeeLeavesPermissions"));
const Details = lazyPage(() => import("../Pages/LeavesPermissions/Admin/EmployeeLeaveDetail/EmployeeLeaveDetail"));
const LeaveDetail = lazyPage(() => import("../Pages/LeavesPermissions/Employee/LeaveDetail/LeaveDetail"));
const DailyTask = lazyPage(() => import("../Pages/DailyTask/DailyTask"));
const AddTask = lazyPage(() => import("../Pages/DailyTask/AddTask"));
const TaskDetails = lazyPage(() => import("../Pages/DailyTask/TaskDetails"));


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

const LeavePolicies = lazyPage(() => import("../Pages/LeavePolicies/LeavePolicies"));

export const route = createBrowserRouter([
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "/",
        element: <MainLayout />,
        errorElement: <RouteErrorPage />,
        children: [
            {
                index: true,
                element: <Navigate to="/login" replace />,
            },
            {
                path: "admindashboard",
                element: (
                    <ProtectedRoute allowedRoles={[ADMIN]}>
                        <Admin />
                    </ProtectedRoute>
                ),
            },
            {
                path: "hrdashboard",
                element: (
                    <ProtectedRoute allowedRoles={[HR]}>
                        <HRDashboard />
                    </ProtectedRoute>
                ),
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
