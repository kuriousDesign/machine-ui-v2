"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type UiSettings = {
  kioskId: string;
};

interface UiSettingsContextValue extends UiSettings {
  isSettingsLoaded: boolean;
  updateSetting: <K extends keyof UiSettings>(key: K, value: UiSettings[K]) => void;
}

const STORAGE_KEY = "machine-ui-v2.settings";

const UiSettingsContext = createContext<UiSettingsContextValue | null>(null);

const DEFAULT_SETTINGS: UiSettings = {
  kioskId: "",
};

export function UiSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UiSettings>(DEFAULT_SETTINGS);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedSettings = window.localStorage.getItem(STORAGE_KEY);

      if (storedSettings) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...JSON.parse(storedSettings),
        });
      }
    } catch {
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsSettingsLoaded(true);
    }
  }, []);

  const value = useMemo<UiSettingsContextValue>(
    () => ({
      ...settings,
      isSettingsLoaded,
      updateSetting: (key, updatedValue) => {
        setSettings((current) => {
          const nextSettings = {
            ...current,
            [key]: updatedValue,
          };

          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));

          return nextSettings;
        });
      },
    }),
    [isSettingsLoaded, settings],
  );

  return <UiSettingsContext.Provider value={value}>{children}</UiSettingsContext.Provider>;
}

export function useUiSettings() {
  const context = useContext(UiSettingsContext);

  if (!context) {
    throw new Error("useUiSettings must be used within UiSettingsProvider");
  }

  return context;
}