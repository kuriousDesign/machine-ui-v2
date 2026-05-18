"use client";

import Link from "next/link";

export type BridgeRuntimeState = "offline" | "waiting" | "bootstrapping" | "stale" | "running";

export function BridgeStartupPanel({
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
      ? "The UI is still connected to MQTT, but fresh bridge/status updates stopped arriving. This keeps the shell visible while the startup panel waits for fresh bridge telemetry."
      : runtimeState === "bootstrapping"
        ? "The bridge is connected but has not reached steady polling yet. The operator shell stays mounted while startup progress continues."
        : runtimeState === "waiting"
          ? "The UI has not received its first bridge/status payload yet."
          : "The MQTT client is disconnected, so the UI cannot observe bridge/runtime updates yet.";

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
    <div className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(255,247,237,0.98)_0%,rgba(255,251,235,0.98)_45%,rgba(248,250,252,0.98)_100%)] p-6">
      <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.22),transparent_60%)]" />
      <div className="relative space-y-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-700">Bridge runtime guard</p>
          <h2 className="text-3xl font-semibold text-slate-900">{title}</h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
          <div className="space-y-4 rounded-[24px] border border-amber-200 bg-white/82 p-5">
            <RuntimeStat label="Waiting for" value={waitingFor} />
            <RuntimeStat label="Machine" value={!isStale ? machineId ?? "Unknown" : "Pending fresh status"} />
            <RuntimeStat label="Last bridge update" value={formatTimestamp(bridgeUpdatedAt)} />
            <RuntimeStat label="Last cache update" value={formatTimestamp(cacheUpdatedAt)} />
            <RuntimeStat label="Runtime state" value={humanizeRuntimeState(runtimeState)} />
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white/82 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Observed startup steps</p>
            <div className="mt-4 space-y-3">
              {steps.map((step, index) => (
                <div key={step.label} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className={`mt-0.5 h-3 w-3 rounded-full ${step.value === "Pending fresh status" ? "bg-amber-400" : step.value.startsWith("Disconnected") ? "bg-rose-500" : "bg-emerald-500"}`} />
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

        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/bridge-status" className="rounded-2xl border border-slate-300 bg-white/85 px-4 py-3 font-medium text-slate-800 transition-colors duration-200 hover:bg-white">
            Open bridge status
          </Link>
          <Link href="/subscriptions" className="rounded-2xl border border-slate-300 bg-white/85 px-4 py-3 font-medium text-slate-800 transition-colors duration-200 hover:bg-white">
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