import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { ADMIN, EMPLOYEE, HR } from "../../data/permissions";

interface ProtectedRouteProps {
  allowedRoles: number[];
  children: ReactNode;
}

function getDashboardPath(userType: number) {
  if (userType === HR) {
    return "/hrdashboard";
  }

  if (userType === ADMIN) {
    return "/admindashboard";
  }

  if (userType === EMPLOYEE) {
    return "/employeedashboard";
  }

  return "/login";
}

function ProtectedRoute({
  allowedRoles,
  children,
}: ProtectedRouteProps) {
  const storedUser = localStorage.getItem("loggedInUser");

  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(storedUser);

    const userType = Number(user.userType);

    if (!allowedRoles.includes(userType)) {
      return (
        <Navigate
          to={getDashboardPath(userType)}
          replace
        />
      );
    }

    return children;
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUser");

    return <Navigate to="/login" replace />;
  }
}

export default ProtectedRoute;
