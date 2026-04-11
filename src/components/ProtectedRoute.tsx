import React, { useEffect } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { authApi } from "../api/client";

export default function ProtectedRoute() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      authApi.profile().then((res) => {
        if (!res.success) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      });
    }
  }, [token, navigate]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
