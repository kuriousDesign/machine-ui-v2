"use client";

import { createContext, useContext, useMemo, useState } from "react";

interface FullScreenContextValue {
  isFullScreen: boolean;
  setIsFullScreen: (value: boolean) => void;
  toggleFullScreen: () => void;
}

const FullScreenContext = createContext<FullScreenContextValue | null>(null);

export function FullScreenProvider({ children }: { children: React.ReactNode }) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const value = useMemo<FullScreenContextValue>(
    () => ({
      isFullScreen,
      setIsFullScreen,
      toggleFullScreen: () => {
        setIsFullScreen((current) => !current);
      },
    }),
    [isFullScreen],
  );

  return <FullScreenContext.Provider value={value}>{children}</FullScreenContext.Provider>;
}

export function useFullScreen() {
  const context = useContext(FullScreenContext);

  if (!context) {
    throw new Error("useFullScreen must be used within FullScreenProvider");
  }

  return context;
}