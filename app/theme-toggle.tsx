"use client";

import { useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme-preference";
const THEME_EVENT = "theme-preference-change";

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "light" || value === "dark" ? value : null;
}

function subscribeThemePreference(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(THEME_EVENT, handler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(THEME_EVENT, handler);
  };
}

function subscribeSystemTheme(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => onStoreChange();
  media.addEventListener("change", handler);

  return () => media.removeEventListener("change", handler);
}

function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeToggle() {
  const storedTheme = useSyncExternalStore(
    subscribeThemePreference,
    getStoredTheme,
    () => null,
  );

  const systemPrefersDark = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemPrefersDark,
    () => false,
  );

  useEffect(() => {
    if (storedTheme) {
      document.documentElement.dataset.theme = storedTheme;
      return;
    }

    document.documentElement.removeAttribute("data-theme");
  }, [storedTheme]);

  const effectiveTheme: Theme = storedTheme ?? (systemPrefersDark ? "dark" : "light");

  function toggleTheme() {
    const nextTheme: Theme = effectiveTheme === "dark" ? "light" : "dark";
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={effectiveTheme === "dark"}
      aria-label="Toggle dark mode"
      className={`theme-toggle ${effectiveTheme === "dark" ? "on" : "off"}`}
      onClick={toggleTheme}
    >
      <span className="theme-toggle-label">Dark mode</span>
      <span className="theme-toggle-track">
        <span className="theme-toggle-thumb" />
      </span>
    </button>
  );
}
