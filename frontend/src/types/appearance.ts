export type Theme = "blue" | "purple" | "green" | "orange" | "neutral";
export type Mode = "light" | "dark";
export type Wallpaper = 1 | 2;

export type AppearanceControls = {
  theme: Theme;
  mode: Mode;
  wallpaper: Wallpaper;
  onThemeChange: (theme: Theme) => void;
  onModeChange: (mode: Mode) => void;
  onWallpaperChange: (wallpaper: Wallpaper) => void;
};
