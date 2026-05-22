"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { useBridgeState } from "@/lib/store/zustand-provider";

const BRIDGE_STATUS_STALE_AFTER_MS = 5000;

type BridgeRuntimeState = "offline" | "waiting" | "bootstrapping" | "stale" | "running";

const navigation = [
  { href: "/", label: "Overview" },
  { href: "/operation", label: "Operation" },
  { href: "/bridge-status", label: "Bridge Status" },
  { href: "/device-map", label: "Device Map" },
  { href: "/subscriptions", label: "Subscriptions" },
  { href: "/tag-topics", label: "TagTopics" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const connection = useBridgeState((state) => state.connection);
  const bridgeStatus = useBridgeState((state) => state.bridgeStatus.payload);
  const bridgeUpdatedAt = useBridgeState((state) => state.bridgeStatus.updatedAt);
  const deviceCount = useBridgeState((state) => state.deviceMap.orderedIds.length);
  const cacheUpdatedAt = useBridgeState((state) => state.cache.updatedAt);
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
      : connection.phase === "error"
        ? "MQTT error"
        : connection.phase === "connecting" || connection.phase === "reconnecting"
          ? "Connecting"
      : runtimeState === "stale"
        ? "Status stale"
        : runtimeState === "bootstrapping"
          ? "Bootstrapping"
          : runtimeState === "waiting"
            ? "Waiting for bridge"
            : "Broker offline";

  return (
    <div className="mx-auto min-h-screen max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
      <div className="grid min-h-[calc(100vh-2rem)] gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[var(--shadow)] backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Machine UI</p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">V2</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Segmented MQTT transport, bridge orchestration, and Zustand selectors for machine and device state.
            </p>
          </div>

          <div className="mt-6 space-y-3 rounded-[28px] bg-[#0f172a] p-4 text-white">
            <StatusBadge label="MQTT" value={connection.phase} />
            <StatusBadge label="Bridge" value={bridgeStatus?.opcuaStateLabel ?? "Waiting"} />
            <StatusBadge label="Runtime" value={runtimeLabel} />
            <StatusBadge label="Machine" value={bridgeStatus?.machineId ?? "Unknown"} />
            {connection.error ? <StatusBadge label="MQTT error" value={connection.error} /> : null}
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-300">Broker URL</p>
              <p className="mt-2 break-all font-mono text-xs leading-5 text-slate-100">{connection.brokerUrl}</p>
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--border)] hover:bg-white/60"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="rounded-[32px] border border-[var(--border)] bg-[var(--surface-strong)] p-6 shadow-[var(--shadow)] backdrop-blur lg:p-8">
          {runtimeState === "running" ? (
            children
          ) : (
            <BridgeBootstrapScreen
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
        </main>
      </div>
    </div>
  );
}

function BridgeBootstrapScreen({
  bridgeStatusLabel,
  bridgeUpdatedAt,
  cacheUpdatedAt,
  deviceCount,
  hasBridgeStatus,
  machineId,
  mqttPhase,
  publishManagerStatus,
  runtimeState,
  supervisorState,
}: {
  bridgeStatusLabel: string;
  bridgeUpdatedAt: number | null;
  cacheUpdatedAt: number | null;
  deviceCount: number;
  hasBridgeStatus: boolean;
  machineId: string | null;
  mqttPhase: string;
  publishManagerStatus: string | null;
  runtimeState: BridgeRuntimeState;
  supervisorState: string | null;
}) {
  const title =
    runtimeState === "stale"
      ? "Bridge status went stale"
      : runtimeState === "bootstrapping"
        ? "Bridge startup in progress"
        : runtimeState === "waiting"
          ? "Waiting for bridge status"
          : "MQTT broker connection is offline";

  const description =
    runtimeState === "stale"
      ? "The UI is still connected to MQTT, but fresh bridge/status updates stopped arriving. This usually means the bridge service stopped or stalled unexpectedly, and the current startup steps below have been reset until a fresh status arrives."
      : runtimeState === "bootstrapping"
        ? "The bridge is connected but has not reached its steady polling state yet. This screen stays up until the bridge is fully running."
        : runtimeState === "waiting"
          ? "The UI has not received an initial bridge/status message yet."
          : "The MQTT client is not currently connected, so the UI cannot observe bridge/status updates.";

  const isStale = runtimeState === "stale";
  const observedBridgeState = !isStale && hasBridgeStatus ? bridgeStatusLabel : "Waiting for fresh bridge/status";
  const observedPublishManager = !isStale && publishManagerStatus ? publishManagerStatus : "Pending fresh status";
  const observedSupervisor = !isStale && supervisorState ? supervisorState : "Pending fresh status";
  const observedDeviceMap = !isStale && deviceCount > 0 ? `${deviceCount} devices loaded` : "Pending fresh status";
  const observedCacheHydration = !isStale && cacheUpdatedAt ? `Last cache ${new Date(cacheUpdatedAt).toLocaleTimeString()}` : "Pending fresh status";
  const waitingFor =
    runtimeState === "offline"
      ? "MQTT connection to recover"
      : runtimeState === "waiting"
        ? "initial bridge/status publish"
        : runtimeState === "stale"
          ? "next bridge/status publish"
          : publishManagerStatus === "polling" || supervisorState === "healthy"
            ? "final running confirmation"
            : publishManagerStatus
              ? `publish manager to reach polling (current: ${publishManagerStatus})`
              : supervisorState
                ? `supervisor to reach healthy (current: ${supervisorState})`
                : "bridge startup progress";

  const steps = [
    { label: "MQTT transport", value: runtimeState === "offline" ? `Disconnected (${mqttPhase})` : `Connected (${mqttPhase})` },
    { label: "Bridge OPC UA state", value: observedBridgeState },
    { label: "Publish manager", value: observedPublishManager },
    { label: "Supervisor", value: observedSupervisor },
    { label: "Device map", value: observedDeviceMap },
    { label: "Cache hydration", value: observedCacheHydration },
  ];

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-[var(--border)] bg-[linear-gradient(135deg,#fff7ed_0%,#fffbeb_45%,#f8fafc_100%)] p-6 lg:p-8">
      <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.24),transparent_60%)]" />
      <div className="relative space-y-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-700">Bridge runtime guard</p>
          <h2 className="text-3xl font-semibold text-slate-900">{title}</h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
          <div className="space-y-4 rounded-[28px] border border-amber-200 bg-white/80 p-5">
            <RuntimeStat label="Waiting for" value={waitingFor} />
            <RuntimeStat label="Machine" value={!isStale ? machineId ?? "Unknown" : "Pending fresh status"} />
            <RuntimeStat label="Last bridge update" value={formatTimestamp(bridgeUpdatedAt)} />
            <RuntimeStat label="Last cache update" value={formatTimestamp(cacheUpdatedAt)} />
            <RuntimeStat label="Runtime state" value={humanizeRuntimeState(runtimeState)} />
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Observed startup steps</p>
            <div className="mt-4 space-y-3">
              {steps.map((step, index) => (
                <div key={step.label} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className={`mt-0.5 h-3 w-3 rounded-full ${step.value === "Pending" ? "bg-amber-400" : step.value === "Disconnected" ? "bg-rose-500" : "bg-emerald-500"}`} />
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Step {index + 1}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{step.label}</p>
                    <p className="mt-1 text-sm text-slate-600">{step.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {hasBridgeStatus ? (
          <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Last known bridge status snapshot</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <RuntimeStat label="Last OPC UA state" value={bridgeStatusLabel} />
              <RuntimeStat label="Last publish manager" value={publishManagerStatus ?? "Unknown"} />
              <RuntimeStat label="Last supervisor" value={supervisorState ?? "Unknown"} />
              <RuntimeStat label="Last machine" value={machineId ?? "Unknown"} />
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/bridge-status" className="rounded-2xl border border-slate-300 bg-white/80 px-4 py-3 font-medium text-slate-800 transition-colors duration-200 hover:bg-white">
            Open bridge status
          </Link>
          <Link href="/subscriptions" className="rounded-2xl border border-slate-300 bg-white/80 px-4 py-3 font-medium text-slate-800 transition-colors duration-200 hover:bg-white">
            Open subscriptions
          </Link>
        </div>
      </div>
    </div>
  );
}

function RuntimeStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function formatTimestamp(timestamp: number | null) {
  return timestamp ? new Date(timestamp).toLocaleString() : "Pending";
}

function humanizeRuntimeState(runtimeState: BridgeRuntimeState) {
  return runtimeState === "offline"
    ? "Broker offline"
    : runtimeState === "waiting"
      ? "Waiting for status"
      : runtimeState === "bootstrapping"
        ? "Bootstrapping"
        : runtimeState === "stale"
          ? "Status stale"
          : "Running";
}

function StatusBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.24em] text-white/60">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}