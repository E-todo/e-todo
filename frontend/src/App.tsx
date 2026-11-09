import { useEffect, useState } from "react";
import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
    useLocation,
    useNavigate,
} from "react-router-dom";
import "./styles/App.css";
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
    const saved = window.localStorage.getItem("my-e-todo-theme");
    return saved === "purple" ||
        saved === "green" ||
        saved === "orange" ||
        saved === "neutral"
        ? saved
        : "blue";
}

function getInitialMode(): Mode {
    return window.localStorage.getItem("my-e-todo-mode") === "dark"
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
}: {
    theme: Theme;
    onThemeChange: (theme: Theme) => void;
    mode: Mode;
    onModeChange: (mode: Mode) => void;
    user: User;
    onLogout: () => void;
}) {
    const location = useLocation();
    const navigate = useNavigate();
    return (
        <div className="app">
            <Sidebar
                theme={theme}
                onThemeChange={onThemeChange}
                mode={mode}
                onModeChange={onModeChange}
                user={user}
                onLogout={() => {
                    onLogout();
                    navigate("/login");
                }}
            />
            {location.pathname === "/home" && <Home />}
            {location.pathname === "/dashboard" && <Dashboard />}
            {location.pathname === "/profile" && (
                <ProfilePage
                    user={user}
                    onUserChange={() => window.location.reload()}
                />
            )}
        </div>
    );
}
function ProtectedLayout({
    theme,
    onThemeChange,
    mode,
    onModeChange,
}: {
    theme: Theme;
    onThemeChange: (theme: Theme) => void;
    mode: Mode;
    onModeChange: (mode: Mode) => void;
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
    if (loading)
        return (
            <main className="auth-page">
                <p>Chargement...</p>
            </main>
        );
    if (!user) return <Navigate to="/login" replace />;
    return (
        <AppLayout
            theme={theme}
            onThemeChange={onThemeChange}
            mode={mode}
            onModeChange={onModeChange}
            user={user}
            onLogout={() => {
                logout();
                setUser(null);
            }}
        />
    );
}
export default function App() {
    const [theme, setTheme] = useState<Theme>(getInitialTheme);
    const [mode, setMode] = useState<Mode>(getInitialMode);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        document.documentElement.dataset.mode = mode;
        window.localStorage.setItem("my-e-todo-theme", theme);
        window.localStorage.setItem("my-e-todo-mode", mode);

        document.documentElement.classList.add("theme-changing");
        const timeout = window.setTimeout(() => {
            document.documentElement.classList.remove("theme-changing");
        }, 450);

        return () => window.clearTimeout(timeout);
    }, [theme, mode]);
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={
                        <Navigate
                            to={isLoggedIn() ? "/home" : "/login"}
                            replace
                        />
                    }
                />
                <Route
                    path="/home"
                    element={
                        <ProtectedLayout
                            theme={theme}
                            onThemeChange={setTheme}
                            mode={mode}
                            onModeChange={setMode}
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
                        />
                    }
                />
                <Route
                    path="/login"
                    element={
                        isLoggedIn() ? (
                            <Navigate to="/home" replace />
                        ) : (
                            <Login />
                        )
                    }
                />
                <Route
                    path="/register"
                    element={
                        isLoggedIn() ? (
                            <Navigate to="/home" replace />
                        ) : (
                            <Register />
                        )
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
