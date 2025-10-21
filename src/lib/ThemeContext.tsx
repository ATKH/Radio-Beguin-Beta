"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { PALETTES, type Palette } from "@/lib/palette";

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  palette: Palette;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => undefined,
  toggleTheme: () => undefined,
  palette: PALETTES[0],
});

function mixColor(hex: string, target: string, ratio: number) {
  const clean = hex.replace("#", "");
  const targetClean = target.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const tr = parseInt(targetClean.slice(0, 2), 16);
  const tg = parseInt(targetClean.slice(2, 4), 16);
  const tb = parseInt(targetClean.slice(4, 6), 16);
  const mix = (base: number, targetValue: number) => Math.round(base * (1 - ratio) + targetValue * ratio);
  return `#${mix(r, tr).toString(16).padStart(2, "0")}${mix(g, tg).toString(16).padStart(2, "0")}${mix(b, tb).toString(16).padStart(2, "0")}`;
}

function adjustAlpha(color: string, alpha: number) {
  const rgbaMatch = color.match(/rgba\(([^,]+),([^,]+),([^,]+),[^\)]+\)/i);
  if (rgbaMatch) {
    const [, r, g, b] = rgbaMatch;
    return `rgba(${parseFloat(r)}, ${parseFloat(g)}, ${parseFloat(b)}, ${alpha})`;
  }
  const hexMatch = color.match(/#([0-9a-f]{6})/i);
  if (hexMatch) {
    const clean = hexMatch[1];
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

function getReadableForeground(hex: string) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0a0a0a" : "#f5f5f5";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [paletteIndex, setPaletteIndex] = useState<number>(0);
  const pathname = usePathname();

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolvedTheme =
      storedTheme === "light" || storedTheme === "dark" ? (storedTheme as Theme) : prefersDark ? "dark" : "light";
    setTheme(resolvedTheme);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark");
    root.classList.add(`theme-${theme}`);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!pathname) return;

    try {
      const storage = window.sessionStorage;
      const raw = storage.getItem("palette-cycle-index");
      const nextIndex = raw ? (Number.parseInt(raw, 10) + 1) % PALETTES.length : hashString(pathname) % PALETTES.length;
      storage.setItem("palette-cycle-index", String(nextIndex));
      setPaletteIndex(nextIndex);
    } catch {
      setPaletteIndex(hashString(pathname + Date.now().toString()) % PALETTES.length);
    }
  }, [pathname]);

  useEffect(() => {
    const palette = PALETTES[paletteIndex];
    const root = document.documentElement;
    const isDark = theme === "dark";

    const primary = isDark ? mixColor(palette.primary, "#ffffff", 0.35) : palette.primary;
    const primaryHover = isDark ? mixColor(palette.primaryHover, "#ffffff", 0.5) : palette.primaryHover;
    const accent = isDark ? mixColor(palette.accent, "#ffffff", 0.3) : palette.accent;
    const foreground = isDark ? "#f6f6f6" : palette.foreground;
    const primaryForeground = isDark ? "#050505" : getReadableForeground(primary);

    root.style.setProperty("--primary", primary);
    root.style.setProperty("--primary-hover", primaryHover);
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--foreground", foreground);
    root.style.setProperty("--primary-foreground", primaryForeground);

    if (isDark) {
      const prismViolet = mixColor(palette.accent, "#7f5af0", 0.45);
      const cobaltPulse = mixColor(palette.primary, "#00b7ff", 0.55);
      const neonFuchsia = mixColor(palette.accent, "#ff6ec7", 0.55);
      const midnightTeal = mixColor(palette.primary, "#0f766e", 0.5);

      const darkStops = [
        adjustAlpha(prismViolet, 0.82),
        adjustAlpha(cobaltPulse, 0.78),
        adjustAlpha(neonFuchsia, 0.8),
        adjustAlpha(midnightTeal, 0.85),
      ];
      root.style.setProperty("--ticker-from", darkStops[0]);
      root.style.setProperty("--ticker-mid", darkStops[1]);
      root.style.setProperty("--ticker-to", darkStops[2]);
      root.style.setProperty("--ticker-end", darkStops[3]);
      root.style.setProperty("--ticker-highlight", adjustAlpha("#6fffe9", 0.28));
      root.style.setProperty("--ticker-foreground", "#f8f8f8");
      const vivid = mixColor(palette.primary, "#8affff", 0.35);
      root.style.setProperty("--schedule-highlight", vivid);
      root.style.setProperty("--schedule-highlight-glow", adjustAlpha(vivid, 0.55));
    } else {
      root.style.setProperty("--ticker-from", adjustAlpha(palette.ticker[0], 0.92));
      root.style.setProperty("--ticker-mid", adjustAlpha(palette.ticker[1], 0.92));
      root.style.setProperty("--ticker-to", adjustAlpha(palette.ticker[2], 0.92));
      root.style.setProperty("--ticker-end", adjustAlpha(palette.ticker[3], 0.92));
      root.style.setProperty("--ticker-highlight", adjustAlpha("#ffffff", 0.35));
      root.style.setProperty("--ticker-foreground", "#111111");
      const vivid = mixColor(palette.primary, "#000000", 0.15);
      root.style.setProperty("--schedule-highlight", vivid);
      root.style.setProperty("--schedule-highlight-glow", adjustAlpha(vivid, 0.4));
    }
  }, [paletteIndex, theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme(prev => (prev === "light" ? "dark" : "light")),
      palette: PALETTES[paletteIndex],
    }),
    [theme, paletteIndex]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
