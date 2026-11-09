import { NavLink } from "react-router-dom";
import type { User } from "../api/auth";

type Theme = "blue" | "purple" | "green" | "orange" | "neutral";
type Mode = "light" | "dark";

type SidebarProps = {
    theme: Theme;
    onThemeChange: (theme: Theme) => void;
    mode: Mode;
    onModeChange: (mode: Mode) => void;
    user: User;
    onLogout: () => void;
};

const themes: { id: Theme; label: string; color: string }[] = [
    { id: "blue", label: "Bleu", color: "#347DBB" },
    { id: "purple", label: "Violet", color: "#8178B8" },
    { id: "green", label: "Vert", color: "#5F9B70" },
    { id: "orange", label: "Orange", color: "#D28B50" },
    {
        id: "neutral",
        label: "Neutre",
        color: "linear-gradient(135deg, #FFFFFF 50%, #111111 50%)",
    },
];

function Icon({ name }: { name: "home" | "tasks" }) {
    const paths = {
        home: (
            <>
                <path d="m3 10 9-7 9 7" />
                <path d="M5 9v11h14V9M9 20v-6h6v6" />
            </>
        ),
        tasks: (
            <>
                <rect x="4" y="4" width="16" height="17" rx="2" />
                <path d="m8 9 1.5 1.5L12 8M14 9h3M8 15h9" />
            </>
        ),
    };

    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {paths[name]}
        </svg>
    );
}

export default function Sidebar({
    theme,
    onThemeChange,
    mode,
    onModeChange,
    user,
    onLogout,
}: SidebarProps) {
    const initials =
        `${user.firstname.slice(0, 1)}${user.lastname?.slice(0, 1) || ""}`.toUpperCase();

    return (
        <aside className="sidebar">
            <NavLink to="/home" className="sidebar-brand">
                MY E-TODO
            </NavLink>

            <NavLink
                to="/profile"
                className="sidebar-profile"
                title="Mon profil"
            >
                <span className="sidebar-profile-avatar">{initials}</span>
                <span className="sidebar-profile-info">
                    <strong>{user.firstname}</strong>
                    <small>Mon profil</small>
                </span>
            </NavLink>

            <nav className="sidebar-nav" aria-label="Navigation principale">
                <NavLink to="/home" title="Accueil" aria-label="Accueil">
                    <Icon name="home" />
                    <span>Accueil</span>
                </NavLink>
                <NavLink
                    to="/dashboard"
                    title="Mes tâches"
                    aria-label="Mes tâches"
                >
                    <Icon name="tasks" />
                    <span>Mes tâches</span>
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                <div className="theme-picker">
                    <span className="theme-picker-label">Thèmes</span>
                    <div
                        className="theme-options"
                        role="group"
                        aria-label="Choisir un thème"
                    >
                        {themes.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={`theme-option ${theme === item.id ? "selected" : ""}`}
                                title={item.label}
                                aria-label={`Thème ${item.label}`}
                                aria-pressed={theme === item.id}
                                onClick={() => onThemeChange(item.id)}
                            >
                                <span
                                    className="theme-option-swatch"
                                    style={{ background: item.color }}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                <div
                    className="mode-picker"
                    role="group"
                    aria-label="Choisir le mode d'affichage"
                >
                    <button
                        type="button"
                        className={mode === "light" ? "active" : ""}
                        aria-pressed={mode === "light"}
                        onClick={() => onModeChange("light")}
                    >
                        Clair
                    </button>
                    <button
                        type="button"
                        className={mode === "dark" ? "active" : ""}
                        aria-pressed={mode === "dark"}
                        onClick={() => onModeChange("dark")}
                    >
                        Sombre
                    </button>
                </div>
            </div>

            <button type="button" className="sidebar-logout" onClick={onLogout}>
                Déconnexion
            </button>
        </aside>
    );
}
