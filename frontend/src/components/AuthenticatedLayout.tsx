import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getUser, isLoggedIn, logout, type User } from "../api/auth";
import type { AppearanceControls } from "../types/appearance";
import GlassSkeleton from "./GlassSkeleton";
import Sidebar from "./Sidebar";
import Home from "../pages/Home";
import Dashboard from "../pages/Dashboard";
import ProfilePage from "../pages/ProfilePage";

function AppLayout({
  theme,
  onThemeChange,
  mode,
  onModeChange,
  user,
  onLogout,
  onUserChange,
  wallpaper,
  onWallpaperChange,
}: AppearanceControls & {
  user: User;
  onLogout: () => void;
  onUserChange: (user: User) => void;
}) {
  const location = useLocation();

  return (
    <div className="app">
      <Sidebar
        theme={theme}
        onThemeChange={onThemeChange}
        mode={mode}
        onModeChange={onModeChange}
        onLogout={onLogout}
        wallpaper={wallpaper}
        onWallpaperChange={onWallpaperChange}
      />

      {location.pathname === "/home" && <Home />}

      {location.pathname === "/dashboard" && <Dashboard />}

      {location.pathname === "/profile" && (
        <ProfilePage user={user} onUserChange={onUserChange} />
      )}
    </div>
  );
}

export default function AuthenticatedLayout({
  theme,
  onThemeChange,
  mode,
  onModeChange,
  wallpaper,
  onWallpaperChange,
}: AppearanceControls) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser()
      .then(setUser)
      .catch(() => {
        logout();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <main className="auth-page">
        <GlassSkeleton compact />
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout
      theme={theme}
      onThemeChange={onThemeChange}
      mode={mode}
      onModeChange={onModeChange}
      user={user}
      onUserChange={setUser}
      wallpaper={wallpaper}
      onWallpaperChange={onWallpaperChange}
      onLogout={() => {
        logout();
        setUser(null);
      }}
    />
  );
}
