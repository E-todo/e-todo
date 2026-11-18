import {
  ProfileCircle,
  HomeSimple,
  TaskList,
  LogOut,
  Palette,
} from "iconoir-react";
import { NavLink } from "react-router-dom";
import AppearancePanel from "./AppearancePanel";
import { useAppearanceMenu } from "../hooks/useAppearanceMenu";
import type { AppearanceControls } from "../types/appearance";

export default function Sidebar({
  theme,
  mode,
  wallpaper,
  onThemeChange,
  onModeChange,
  onWallpaperChange,
  onLogout,
}: AppearanceControls & { onLogout: () => void }) {
  const { isOpen, setIsOpen, panelRef, triggerRef, panelPosition, close } =
    useAppearanceMenu();
  return (
    <aside className="sidebar">
      <NavLink
        to="/home"
        className="sidebar-brand"
        aria-label="E-todo - Accueil"
      >
        E-todo
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
        <NavLink to="/profile" title="Mon profil" aria-label="Mon profil">
          <ProfileCircle width={21} height={21} />
          <span>Profil</span>
        </NavLink>
        <div className="sidebar-theme-container">
          <button
            ref={triggerRef}
            type="button"
            className={`sidebar-theme-trigger ${isOpen ? "active" : ""}`}
            aria-label="Ouvrir les thèmes"
            title="Thèmes"
            aria-expanded={isOpen}
            aria-controls="sidebar-theme-panel"
            onClick={() => setIsOpen((open) => !open)}
          >
            <Palette width={21} height={21} />
            <span>Thèmes</span>
          </button>
          {isOpen && (
            <AppearancePanel
              theme={theme}
              mode={mode}
              wallpaper={wallpaper}
              onThemeChange={onThemeChange}
              onModeChange={onModeChange}
              onWallpaperChange={onWallpaperChange}
              panelRef={panelRef}
              panelPosition={panelPosition}
              onClose={close}
            />
          )}
        </div>
      </nav>

      <button
        type="button"
        className="sidebar-logout"
        aria-label="Quitter la session"
        title="Quitter la session"
        onClick={onLogout}
      >
        <LogOut width={18} height={18} /> <span>Déconnexion</span>
      </button>
    </aside>
  );
}
