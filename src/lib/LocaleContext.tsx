"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "fr" | "en";

type Messages = Record<string, string>;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  toggleLocale: () => void;
  t: (key: string) => string;
};

const LOCALE_STORAGE_KEY = "radio-beguin:locale";
const DEFAULT_LOCALE: Locale = "fr";

const FALLBACK_MESSAGES: Messages = {};

const TRANSLATIONS: Record<Locale, Messages> = {
  fr: {
    "header.radio": "Radio",
    "header.shows": "Shows",
    "header.info": "Infos",
    "header.language.toggle": "Passer en anglais",
    "header.search.placeholder": "",
    "player.backToLive": "Retour Live",
    "player.soundcloud": "SoundCloud",
    "home.program.title": "Programme",
    "home.schedule.placeholder": "Programme indisponible",
    "home.selection.title": "Sélection",
    "home.selection.all": "Tout découvrir",
    "shows.tabs.all": "Tous les épisodes",
    "shows.tabs.playlists": "Émissions",
    "shows.tabs.tags": "Styles",
    "shows.moods.title": "Les moods",
  },
  en: {
    "header.radio": "Radio",
    "header.shows": "Shows",
    "header.info": "Info",
    "header.search.placeholder": "",
    "header.language.toggle": "Switch to French",
    "player.backToLive": "Back live",
    "player.soundcloud": "SoundCloud",
    "home.program.title": "Schedule",
    "home.schedule.placeholder": "Schedule currently unavailable",
    "home.selection.title": "Selection",
    "home.selection.all": "Discover all",
    "shows.tabs.all": "All episodes",
    "shows.tabs.playlists": "Shows",
    "shows.tabs.tags": "Styles",
    "shows.moods.title": "Moods",
  },
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

const loadInitialLocale = (): Locale => {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (raw === "fr" || raw === "en") return raw;
    if (typeof navigator !== "undefined" && navigator.language?.startsWith("en")) {
      return "en";
    }
  } catch {
    // ignore
  }
  return DEFAULT_LOCALE;
};

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const initial = loadInitialLocale();
    setLocaleState(initial);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // ignore
    }
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: next => setLocaleState(next),
      toggleLocale: () => setLocaleState(current => (current === "fr" ? "en" : "fr")),
      t: key => {
        const currentSet = TRANSLATIONS[locale] ?? FALLBACK_MESSAGES;
        return currentSet[key] ?? TRANSLATIONS.fr[key] ?? key;
      },
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}

export const SUPPORTED_LOCALES: Locale[] = ["fr", "en"];
