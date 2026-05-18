"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { BridgeStartupPanel, type BridgeRuntimeState } from "@/components/bootstrap/bridge-startup-panel";
import { AuxContentManager } from "@/components/layout/aux-content-manager";
import { ButtonBar } from "@/components/layout/button-bar";
import { SiteHeader } from "@/components/layout/site-header";
import { StatusBand } from "@/components/layout/status-band";
import { useAuxParam } from "@/hooks/use-aux-param";
import { useBridgeState } from "@/lib/store/zustand-provider";
import { useUiSettings } from "@/providers/ui-settings-provider";

const BRIDGE_STATUS_STALE_AFTER_MS = 5000;

export function FullPage({ children }: { children: ReactNode }) {
  const connection = useBridgeState((state) => state.connection);
  const bridgeStatus = useBridgeState((state) => state.bridgeStatus.payload);
  const bridgeUpdatedAt = useBridgeState((state) => state.bridgeStatus.updatedAt);
  const deviceCount = useBridgeState((state) => state.deviceMap.orderedIds.length);
  const cacheUpdatedAt = useBridgeState((state) => state.cache.updatedAt);
  const { auxParamValue } = useAuxParam();
  const { isSettingsLoaded } = useUiSettings();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const runtimeState = useMemo<BridgeRuntimeState>(() => {
    if (!connection.isConnected) {
      return "offline";
    }

    if (!bridgeUpdatedAt || !bridgeStatus) {
      return "waiting";
    }

    if (now - bridgeUpdatedAt > BRIDGE_STATUS_STALE_AFTER_MS) {
      return "stale";
    }

    const publishManagerStatus = bridgeStatus.publishManagerStatus?.toLowerCase();
    const supervisorState = bridgeStatus.supervisorState?.toLowerCase();

    if (publishManagerStatus === "polling" || supervisorState === "healthy") {
      return "running";
    }

    return "bootstrapping";
  }, [bridgeStatus, bridgeUpdatedAt, connection.isConnected, now]);

  const runtimeLabel =
    runtimeState === "running"
      ? "Running"
      : runtimeState === "stale"
        ? "Status stale"
        : runtimeState === "bootstrapping"
          ? "Bootstrapping"
          : runtimeState === "waiting"
            ? "Waiting for bridge"
            : "Broker offline";

  const hasAuxPanel = Boolean(auxParamValue);
  const auxPanelStyle = hasAuxPanel
    ? "mx-2 my-2 mt-2 flex-shrink-0 basis-[34%] overflow-hidden rounded-[20px] bg-[var(--background)] shadow-lg ring-1 ring-black/5"
    : "hidden";
  const mainPanelStyle = hasAuxPanel
    ? "mx-2 basis-[50%] overflow-hidden rounded-[20px] bg-[var(--background)] shadow-lg ring-1 ring-black/5"
    : "mx-2 flex-1 overflow-hidden rounded-[20px] bg-[var(--background)] shadow-md ring-1 ring-black/5";

  return (
    <main className="flex h-screen w-screen flex-col overflow-x-hidden overflow-y-clip bg-[color:var(--muted-surface)] transition-[height] duration-150">
      <div className="px-3 pt-3 sm:px-4 sm:pt-4">
        <header className="px-3 py-2 sm:px-4">
          <SiteHeader
            machineId={bridgeStatus?.machineId ?? null}
            runtimeLabel={runtimeLabel}
          />
        </header>

        <StatusBand
          bridgeState={bridgeStatus?.opcuaStateLabel ?? "Waiting"}
          bridgeUpdatedAt={bridgeUpdatedAt}
          deviceCount={deviceCount}
          machineId={bridgeStatus?.machineId ?? null}
          mqttPhase={connection.phase}
          publishManagerStatus={bridgeStatus?.publishManagerStatus ?? null}
          runtimeLabel={runtimeLabel}
          runtimeState={runtimeState}
          supervisorState={bridgeStatus?.supervisorState ?? null}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col pb-24 pt-2 sm:pb-28 sm:pt-3">
        {hasAuxPanel ? (
          <section className={auxPanelStyle}>
            <div className="h-full overflow-auto">
              <AuxContentManager auxPath={auxParamValue} />
            </div>
          </section>
        ) : null}

        <section className={mainPanelStyle}>
          <div className="h-full overflow-auto p-4 sm:p-5">
            {runtimeState === "running" ? (
              children
            ) : (
              <BridgeStartupPanel
                bridgeStatusLabel={bridgeStatus?.opcuaStateLabel ?? "Waiting for bridge status"}
                bridgeUpdatedAt={bridgeUpdatedAt}
                cacheUpdatedAt={cacheUpdatedAt}
                deviceCount={deviceCount}
                hasBridgeStatus={Boolean(bridgeStatus && bridgeUpdatedAt)}
                machineId={bridgeStatus?.machineId ?? null}
                mqttPhase={connection.phase}
                publishManagerStatus={bridgeStatus?.publishManagerStatus ?? null}
                runtimeState={runtimeState}
                supervisorState={bridgeStatus?.supervisorState ?? null}
              />
            )}
          </div>
        </section>
      </div>

      <ButtonBar />
    </main>
  );
}