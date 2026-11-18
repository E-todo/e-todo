import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import "./styles/App.css";
import { useAppearance } from "./hooks/useAppearance";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { isLoggedIn } from "./api/auth";
import AuthenticatedLayout from "./components/AuthenticatedLayout";

function GuestOnlyRoute({ children }: { children: ReactNode }) {
  return isLoggedIn() ? <Navigate to="/home" replace /> : <>{children}</>;
}

function RootRedirect() {
  return <Navigate to={isLoggedIn() ? "/home" : "/login"} replace />;
}

export default function App() {
  const appearance = useAppearance();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        {["/home", "/dashboard", "/profile"].map((path) => (
          <Route
            key={path}
            path={path}
            element={<AuthenticatedLayout {...appearance} />}
          />
        ))}

        <Route
          path="/login"
          element={
            <GuestOnlyRoute>
              <Login />
            </GuestOnlyRoute>
          }
        />

        <Route
          path="/register"
          element={
            <GuestOnlyRoute>
              <Register />
            </GuestOnlyRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
