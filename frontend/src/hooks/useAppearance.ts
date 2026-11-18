import { useEffect, useState } from "react";
import { readStorage, writeStorage } from "../utils/storage";
import type {
  AppearanceControls,
  Mode,
  Theme,
  Wallpaper,
} from "../types/appearance";

function getInitialTheme(): Theme {
  const saved = readStorage("my-e-todo-theme");
  return saved === "purple" ||
    saved === "green" ||
    saved === "orange" ||
    saved === "neutral"
    ? saved
    : "blue";
}

export function useAppearance(): AppearanceControls {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [mode, setMode] = useState<Mode>(() =>
    readStorage("my-e-todo-mode") === "dark" ? "dark" : "light",
  );
  const [wallpaper, setWallpaper] = useState<Wallpaper>(() =>
    readStorage("my-e-todo-wallpaper") === "2" ? 2 : 1,
  );

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.mode = mode;
    root.dataset.wallpaper = String(wallpaper);
    writeStorage("my-e-todo-theme", theme);
    writeStorage("my-e-todo-mode", mode);
    writeStorage("my-e-todo-wallpaper", String(wallpaper));
  }, [theme, mode, wallpaper]);

  return {
    theme,
    mode,
    wallpaper,
    onThemeChange: setTheme,
    onModeChange: setMode,
    onWallpaperChange: setWallpaper,
  };
}
