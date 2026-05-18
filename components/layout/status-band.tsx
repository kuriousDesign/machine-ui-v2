"use client";

import type { BridgeRuntimeState } from "@/components/bootstrap/bridge-startup-panel";

export function StatusBand({
  bridgeState,
  bridgeUpdatedAt,
  deviceCount,
  machineId,
  mqttPhase,
  publishManagerStatus,
  runtimeLabel,
  runtimeState,
  supervisorState,
}: {
  bridgeState: string;
  bridgeUpdatedAt: number | null;
  deviceCount: number;
  machineId: string | null;
  mqttPhase: string;
  publishManagerStatus: string | null;
  runtimeLabel: string;
  runtimeState: BridgeRuntimeState;
  supervisorState: string | null;
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-[22px] border border-[var(--border)] bg-[linear-gradient(90deg,rgba(255,255,255,0.76)_0%,rgba(255,249,241,0.92)_100%)]">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <StatePill tone={getRuntimeTone(runtimeState)}>{runtimeLabel}</StatePill>
        <StatePill tone="neutral">Bridge {bridgeState}</StatePill>
        <StatePill tone="neutral">MQTT {mqttPhase}</StatePill>
        <StatePill tone="neutral">Machine {machineId ?? "Unknown"}</StatePill>
        <StatePill tone="neutral">Devices {deviceCount}</StatePill>
      </div>

      <div className="grid gap-px border-t border-[var(--border)] bg-[var(--border)] md:grid-cols-3 xl:grid-cols-5">
        <BandStat label="Publish manager" value={publishManagerStatus ?? "Pending"} />
        <BandStat label="Supervisor" value={supervisorState ?? "Pending"} />
        <BandStat label="Bridge updated" value={bridgeUpdatedAt ? new Date(bridgeUpdatedAt).toLocaleTimeString() : "Pending"} />
        <BandStat label="Runtime lane" value={humanizeRuntimeLane(runtimeState)} />
        <BandStat label="Operator shell" value="Main + Aux ready" />
      </div>
    </div>
  );
}

function BandStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/70 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function StatePill({ children, tone }: { children: React.ReactNode; tone: "good" | "warning" | "danger" | "neutral" }) {
  const className =
    tone === "good"
      ? "border-emerald-300 bg-emerald-100 text-emerald-900"
      : tone === "warning"
        ? "border-amber-300 bg-amber-100 text-amber-900"
        : tone === "danger"
          ? "border-rose-300 bg-rose-100 text-rose-900"
          : "border-[var(--border)] bg-white/70 text-[var(--foreground)]";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${className}`}>
      {children}
    </span>
  );
}

function getRuntimeTone(runtimeState: BridgeRuntimeState) {
  return runtimeState === "running"
    ? "good"
    : runtimeState === "bootstrapping" || runtimeState === "waiting"
      ? "warning"
      : runtimeState === "stale" || runtimeState === "offline"
        ? "danger"
        : "neutral";
}

function humanizeRuntimeLane(runtimeState: BridgeRuntimeState) {
  return runtimeState === "running"
    ? "Healthy"
    : runtimeState === "bootstrapping"
      ? "Startup"
      : runtimeState === "waiting"
        ? "Awaiting status"
        : runtimeState === "stale"
          ? "Telemetry stale"
          : "Offline";
}