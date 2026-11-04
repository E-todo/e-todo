import { useEffect, useState } from "react";
import {
    BrowserRouter,
    Link,
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
type Theme = "blue" | "lavender" | "peach" | "sage";
function getInitialTheme(): Theme {
    const saved = window.localStorage.getItem("my-e-todo-theme");
    return saved === "lavender" || saved === "peach" || saved === "sage"
        ? saved
        : "blue";
}
function AppLayout({
    theme,
    onThemeChange,
    user,
    onLogout,
}: {
    theme: Theme;
    onThemeChange: (theme: Theme) => void;
    user: User;
    onLogout: () => void;
}) {
    const location = useLocation();
    const navigate = useNavigate();
    return (
        <div className="app">
            <Sidebar theme={theme} onThemeChange={onThemeChange} />
            <div className="top-user-controls">
                <Link
                    to="/profile"
                    className="top-user-avatar"
                    aria-label="Ouvrir le profil"
                    title="Profil"
                >
                    {user.firstname.slice(0, 1).toUpperCase()}
                </Link>
                <button
                    type="button"
                    className="top-logout-button"
                    onClick={() => {
                        onLogout();
                        navigate("/login");
                    }}
                >
                    Déconnexion
                </button>
            </div>
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
}: {
    theme: Theme;
    onThemeChange: (theme: Theme) => void;
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
    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        window.localStorage.setItem("my-e-todo-theme", theme);
    }, [theme]);
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
                        />
                    }
                />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedLayout
                            theme={theme}
                            onThemeChange={setTheme}
                        />
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <ProtectedLayout
                            theme={theme}
                            onThemeChange={setTheme}
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
