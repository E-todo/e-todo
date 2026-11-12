import { useEffect, useState, type ReactNode } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import "./styles/App.css";
import "./styles/polish.css";
import GlassSkeleton from "./components/GlassSkeleton";
import { readStorage, writeStorage } from "./utils/storage";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import ProfilePage from "./pages/ProfilePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { getUser, isLoggedIn, logout, type User } from "./api/auth";

type Theme = "blue" | "purple" | "green" | "orange" | "neutral";
type Mode = "light" | "dark";

function getInitialTheme(): Theme {
  const saved = readStorage("my-e-todo-theme");

  return saved === "purple" ||
    saved === "green" ||
    saved === "orange" ||
    saved === "neutral"
    ? saved
    : "blue";
}

function getInitialMode(): Mode {
  return readStorage("my-e-todo-mode") === "dark"
    ? "dark"
    : "light";
}

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
}: {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  user: User;
  onLogout: () => void;
  onUserChange: (user: User) => void;
  wallpaper: 1 | 2;
  onWallpaperChange: (wallpaper: 1 | 2) => void;
}) {
  const location = useLocation();

  return (
    <div className="app">
      <Sidebar
        theme={theme}
        onThemeChange={onThemeChange}
        mode={mode}
        onModeChange={onModeChange}
        user={user}
        onLogout={onLogout}
        wallpaper={wallpaper}
        onWallpaperChange={onWallpaperChange}
      />

      {location.pathname === "/home" && <Home />}

      {location.pathname === "/dashboard" && <Dashboard />}

      {location.pathname === "/profile" && (
        <ProfilePage
          user={user}
          onUserChange={onUserChange}
        />
      )}
    </div>
  );
}

// Empêche un utilisateur connecté d'accéder aux pages
// de connexion et d'inscription.
function GuestOnlyRoute({ children }: { children: ReactNode }) {
  return isLoggedIn() ? <Navigate to="/home" replace /> : <>{children}</>;
}

// Choisit la page de départ selon la présence du token.
function RootRedirect() {
  return <Navigate to={isLoggedIn() ? "/home" : "/login"} replace />;
}

// Protège les pages nécessitant une connexion.
function ProtectedLayout({
  theme,
  onThemeChange,
  mode,
  onModeChange,
  wallpaper,
  onWallpaperChange,
}: {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  wallpaper: 1 | 2;
  onWallpaperChange: (wallpaper: 1 | 2) => void;
}) {
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

  // Si le token a été supprimé, redirection immédiate.
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  // Chargement uniquement si un token existe encore.
  if (loading) {
    return (
      <main className="auth-page">
        <GlassSkeleton compact />
      </main>
    );
  }

  // Sécurité supplémentaire si aucun utilisateur n'est trouvé.
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

export default function App() {
  useEffect(() => {
    try { localStorage.removeItem("my-e-todo-glass-opacity"); } catch { /* Storage unavailable. */ }
    document.documentElement.style.removeProperty("--glass-opacity");
    document.documentElement.style.removeProperty("--glass-opacity-percent");
  }, []);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [mode, setMode] = useState<Mode>(getInitialMode);
  const [wallpaper, setWallpaper] = useState<1 | 2>(() =>
    readStorage("my-e-todo-wallpaper") === "2" ? 2 : 1,
  );

  useEffect(() => {
    const root = document.documentElement;
    const previous = getComputedStyle(root).getPropertyValue("--page-bg-image").trim();
    const changed = root.dataset.theme !== undefined && (root.dataset.theme !== theme || root.dataset.mode !== mode || root.dataset.wallpaper !== String(wallpaper));
    root.style.setProperty("--previous-wallpaper", previous);
    root.dataset.theme = theme;
    root.dataset.mode = mode;
    root.dataset.wallpaper = String(wallpaper);
    writeStorage("my-e-todo-theme", theme);
    writeStorage("my-e-todo-mode", mode);
    writeStorage("my-e-todo-wallpaper", String(wallpaper));
    if (!changed || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = document.querySelector(".app")?.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 380, easing: "cubic-bezier(.2,.7,.3,1)", pseudoElement: "::after" },
    );
    return () => animation?.cancel();
  }, [theme, mode, wallpaper]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        <Route
          path="/home"
          element={
            <ProtectedLayout
              theme={theme}
              onThemeChange={setTheme}
              mode={mode}
              onModeChange={setMode}
              wallpaper={wallpaper}
              onWallpaperChange={setWallpaper}
            />
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedLayout
              theme={theme}
              onThemeChange={setTheme}
              mode={mode}
              onModeChange={setMode}
              wallpaper={wallpaper}
              onWallpaperChange={setWallpaper}
            />
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedLayout
              theme={theme}
              onThemeChange={setTheme}
              mode={mode}
              onModeChange={setMode}
              wallpaper={wallpaper}
              onWallpaperChange={setWallpaper}
            />
          }
        />

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
