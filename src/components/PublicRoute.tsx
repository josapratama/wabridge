import { Navigate, Outlet } from "react-router-dom";

/**
 * PublicRoute — accessible only when NOT logged in.
 * If user has a token, redirect to /dashboard.
 */
export default function PublicRoute() {
  const token = localStorage.getItem("token");
  if (token) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
