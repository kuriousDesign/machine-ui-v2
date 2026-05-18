"use client";

import { Button } from "@heroui/react";
import { usePathname, useRouter } from "next/navigation";

import { useAuxParam } from "@/hooks/use-aux-param";
import { useBridgeState } from "@/lib/store/zustand-provider";
import { useFullScreen } from "@/providers/full-screen-provider";
import { useUiSettings } from "@/providers/ui-settings-provider";

export function ButtonBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { auxParamValue, setAuxParam } = useAuxParam();
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const { kioskId } = useUiSettings();
  const connection = useBridgeState((state) => state.connection);
  const bridgeStatus = useBridgeState((state) => state.bridgeStatus.payload);
  const deviceCount = useBridgeState((state) => state.deviceMap.orderedIds.length);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="pointer-events-auto mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 shadow-[var(--shadow)] backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={pathname === "/" ? "primary" : "secondary"}
            onPress={() => router.push("/")}
          >
            Overview
          </Button>
          <Button
            size="sm"
            variant={pathname === "/operation" ? "primary" : "secondary"}
            onPress={() => router.push("/operation")}
          >
            Operation
          </Button>
          <Button
            size="sm"
            variant={auxParamValue === "/bridge-status" ? "primary" : "ghost"}
            onPress={() => setAuxParam(auxParamValue === "/bridge-status" ? null : "/bridge-status")}
          >
            Bridge aux
          </Button>
          <Button
            size="sm"
            variant={auxParamValue === "/tag-topics" ? "primary" : "ghost"}
            onPress={() => setAuxParam(auxParamValue === "/tag-topics" ? null : "/tag-topics")}
          >
            TagTopics aux
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="ghost" onPress={toggleFullScreen}>
            {isFullScreen ? "Exit fullscreen" : "Fullscreen"}
          </Button>
          {auxParamValue ? (
            <Button size="sm" variant="ghost" onPress={() => setAuxParam(null)}>
              Close aux
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          <span>MQTT {connection.phase}</span>
          <span>Bridge {bridgeStatus?.opcuaStateLabel ?? "Waiting"}</span>
          <span>Devices {deviceCount}</span>
          <span>Kiosk {kioskId || "Unset"}</span>
        </div>
      </div>
    </div>
  );
}