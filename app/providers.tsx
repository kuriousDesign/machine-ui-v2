"use client";

import type { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { BridgeProvider } from "@/lib/bridge/bridge-provider";
import { MqttClientProvider } from "@/lib/mqtt/mqtt-client-provider";
import { FullScreenProvider } from "@/providers/full-screen-provider";
import { UiSettingsProvider } from "@/providers/ui-settings-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <UiSettingsProvider>
        <FullScreenProvider>
          <MqttClientProvider>
            <BridgeProvider>{children}</BridgeProvider>
          </MqttClientProvider>
        </FullScreenProvider>
      </UiSettingsProvider>
    </NextThemesProvider>
  );
}