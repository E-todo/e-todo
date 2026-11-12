import { HomeSimple, TaskList, LogOut, Palette, Xmark, Check, SunLight, HalfMoon } from "iconoir-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  wallpaper: 1 | 2;
  onWallpaperChange: (wallpaper: 1 | 2) => void;
};

const wallpapers = import.meta.glob<string>("../assets/images/theme_*/*", { eager: true, query: "?url", import: "default" });

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

export default function Sidebar({
  theme,
  onThemeChange,
  mode,
  onModeChange,
  user,
  onLogout,
  wallpaper,
  onWallpaperChange,
}: SidebarProps) {
  const [themesOpen, setThemesOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [panelPosition, setPanelPosition] = useState({ top: 16, left: 96 });
  useEffect(() => {
    if (!themesOpen) return;
    const positionPanel = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const panelWidth = Math.min(320, window.innerWidth - 24);
      const left = window.innerWidth < 600
        ? 12
        : Math.min(rect.right + 12, window.innerWidth - panelWidth - 12);
      setPanelPosition({ left: Math.max(12, left), top: Math.max(12, Math.min(rect.top, window.innerHeight - Math.min(panelRef.current?.offsetHeight ?? 380, window.innerHeight - 24) - 12)) });
    };
    positionPanel();
    const observer = new ResizeObserver(positionPanel);
    if (panelRef.current) observer.observe(panelRef.current);
    const sidebar = triggerRef.current?.closest("aside");
    if (sidebar) observer.observe(sidebar);
    window.addEventListener("resize", positionPanel);
    window.addEventListener("scroll", positionPanel, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", positionPanel);
      window.removeEventListener("scroll", positionPanel, true);
    };
  }, [themesOpen]);
  useEffect(() => {
    if (!themesOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setThemesOpen(false); triggerRef.current?.focus(); }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node) && !triggerRef.current?.contains(event.target as Node)) {
        setThemesOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [themesOpen]);

  const wallpaperPreview = (option: number) => {
    const name = theme === "neutral" ? (mode === "dark" ? "black" : "white") : mode === "dark" ? `dark_${theme}` : theme;
    const extension = option === 1 && name === "orange" ? "jpeg" : "png";
    return wallpapers[`../assets/images/theme_${option}/${name}.${extension}`];
  };
  return (
    <aside className="sidebar">
      <NavLink to="/home" className="sidebar-brand">
        MY E-TODO
      </NavLink>

      <NavLink to="/profile" className="sidebar-profile" title="Mon profil">
        <span className="sidebar-profile-info">
          <strong>{user.firstname}</strong>
          <small>Mon profil</small>
        </span>
      </NavLink>

      <nav className="sidebar-nav" aria-label="Navigation principale">
        <NavLink to="/home" title="Accueil" aria-label="Accueil">
          <HomeSimple width={21} height={21} />
          <span>Accueil</span>
        </NavLink>

        <NavLink to="/dashboard" title="Mes tâches" aria-label="Mes tâches">
          <TaskList width={21} height={21} />
          <span>Mes tâches</span>
        </NavLink>
        <div className="sidebar-theme-container">
          <button ref={triggerRef} type="button" className={`sidebar-theme-trigger ${themesOpen ? "active" : ""}`} aria-label="Ouvrir les thèmes" title="Thèmes" aria-expanded={themesOpen} aria-controls="sidebar-theme-panel" onClick={() => setThemesOpen(open => !open)}>
            <Palette width={21} height={21} /><span>Thèmes</span>
          </button>
        {themesOpen && createPortal(
        <div ref={panelRef} className="sidebar-theme-panel sidebar-theme-panel-portal appearance-panel" id="sidebar-theme-panel" role="region" aria-label="Gestion des thèmes" style={{ top: panelPosition.top, left: panelPosition.left }}>
          <div className="sidebar-theme-heading">
            <strong>Apparence</strong>
            <button type="button" onClick={() => { setThemesOpen(false); triggerRef.current?.focus(); }} aria-label="Fermer les thèmes"><Xmark width={18} height={18}/></button>
          </div>
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
                <span className="theme-name">{item.label}</span>
                <span className="theme-check">{theme === item.id && <Check width={16} aria-hidden="true" />}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="wallpaper-picker" role="group" aria-label="Choisir le fond d’écran">
          <span className="theme-picker-label">Fond d’écran</span>
          <div className="wallpaper-options">
            {([1, 2] as const).map(option => <button key={option} type="button" aria-pressed={wallpaper === option} className={wallpaper === option ? "selected" : ""} onClick={() => onWallpaperChange(option)}><img src={wallpaperPreview(option)} alt="" loading="lazy" /><span>{option === 1 ? "Douceur" : "Fluidité"}</span>{wallpaper === option && <Check width={16} aria-hidden="true" />}</button>)}
          </div>
        </div>
        <div
          className={`mode-picker animated-mode mode-${mode}`}
          role="group"
          aria-label="Choisir le mode d'affichage"
        >
          <button
            type="button"
            className={mode === "light" ? "active" : ""}
            aria-pressed={mode === "light"}
            onClick={() => onModeChange("light")}
          >
            <SunLight width={17} aria-hidden="true" /> Clair
          </button>

          <button
            type="button"
            className={mode === "dark" ? "active" : ""}
            aria-pressed={mode === "dark"}
            onClick={() => onModeChange("dark")}
          >
            <HalfMoon width={17} aria-hidden="true" /> Sombre
          </button>
        </div>
        </div>, document.body
        )}
        </div>
      </nav>

      <button type="button" className="sidebar-logout" aria-label="Quitter la session" title="Quitter la session" onClick={onLogout}>
        <LogOut width={18} height={18} /> <span>Déconnexion</span>
      </button>
    </aside>
  );
}
