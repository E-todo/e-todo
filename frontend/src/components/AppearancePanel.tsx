import { Xmark, Check, SunLight, HalfMoon } from "iconoir-react";
import type { RefObject } from "react";
import { createPortal } from "react-dom";
import type { AppearanceControls, Theme } from "../types/appearance";

const wallpapers = import.meta.glob<string>("../assets/images/theme_*/*", {
  eager: true,
  query: "?url",
  import: "default",
});

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

type AppearancePanelProps = AppearanceControls & {
  panelRef: RefObject<HTMLDivElement | null>;
  panelPosition: { top: number; left: number };
  onClose: () => void;
};
export default function AppearancePanel({
  theme,
  mode,
  wallpaper,
  onThemeChange,
  onModeChange,
  onWallpaperChange,
  panelRef,
  panelPosition,
  onClose,
}: AppearancePanelProps) {
  const wallpaperPreview = (option: number) => {
    const name =
      theme === "neutral"
        ? mode === "dark"
          ? "black"
          : "white"
        : mode === "dark"
          ? `dark_${theme}`
          : theme;
    const extension = option === 1 && name === "orange" ? "jpeg" : "png";
    return wallpapers[`../assets/images/theme_${option}/${name}.${extension}`];
  };

  return createPortal(
    <div
      ref={panelRef}
      className="sidebar-theme-panel sidebar-theme-panel-portal appearance-panel"
      id="sidebar-theme-panel"
      role="region"
      aria-label="Gestion des thèmes"
      style={{ top: panelPosition.top, left: panelPosition.left }}
    >
      <div className="sidebar-theme-heading">
        <strong>Apparence</strong>
        <button
          type="button"
          onClick={() => {
            onClose();
          }}
          aria-label="Fermer les thèmes"
        >
          <Xmark width={18} height={18} />
        </button>
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
              <span className="theme-check">
                {theme === item.id && <Check width={16} aria-hidden="true" />}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div
        className="wallpaper-picker"
        role="group"
        aria-label="Choisir le fond d’écran"
      >
        <span className="theme-picker-label">Fond d’écran</span>
        <div className="wallpaper-options">
          {([1, 2] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={wallpaper === option}
              className={wallpaper === option ? "selected" : ""}
              onClick={() => onWallpaperChange(option)}
            >
              <img src={wallpaperPreview(option)} alt="" loading="lazy" />
              <span>{option === 1 ? "Douceur" : "Fluidité"}</span>
              {wallpaper === option && <Check width={16} aria-hidden="true" />}
            </button>
          ))}
        </div>
      </div>
      <div className="appearance-mode">
        <span className="theme-picker-label">Mode</span>
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
      </div>
    </div>,
    document.body,
  );
}
