"use client";

import type { ReactNode } from "react";

import { BridgeProvider } from "@/lib/bridge/bridge-provider";
import { MqttClientProvider } from "@/lib/mqtt/mqtt-client-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MqttClientProvider>
      <BridgeProvider>{children}</BridgeProvider>
    </MqttClientProvider>
  );
}