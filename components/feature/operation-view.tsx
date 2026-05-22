"use client";

import { SectionCard } from "@/components/section-card";
import {
  DeviceIDs,
  type DeviceRegistration,
  type DeviceStatus,
} from "@/lib/bridge/sdk-lite";
import { useBridgeState, useDevice } from "@/lib/store/zustand-provider";

export function OperationView() {
  return (
    <div className="space-y-6">
      <SectionCard
        title="Registered Device States"
        description="Live runtime state for each registered device currently exposed through the bridge device map."
      >
        <RegisteredDeviceStateGrid />
      </SectionCard>

      <SectionCard
        title="Selector Example"
        description="Example of selecting only the VIS sts field from useDeviceState instead of the full device slice."
      >
        <VisionStsSelectionExample />
      </SectionCard>
    </div>
  );
}

function RegisteredDeviceStateGrid() {
  const orderedIds = useBridgeState((state) => state.deviceMap.orderedIds);
  const devices = useBridgeState((state) => state.deviceMap.byId);

  if (orderedIds.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted)]">
        Waiting for deviceMap from the bridge.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {orderedIds.map((deviceId) => {
        const device = devices[deviceId];

        return device ? <RegisteredDeviceStateCard key={deviceId} device={device} /> : null;
      })}
    </div>
  );
}

function RegisteredDeviceStateCard({ device }: { device: DeviceRegistration }) {
  const deviceState = useDevice(device.id, (state) => state.is);
  const { label, className } = getDeviceStateAppearance(deviceState);
  const stepValue =
    typeof deviceState?.stepNum === "number" ? String(deviceState.stepNum) : "Pending";

  return (
    <div className="min-w-[220px] flex-1 rounded-[20px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-[var(--shadow)] sm:max-w-[280px]">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-[var(--foreground)]">{device.mnemonic}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${className}`}>
          {label}
        </span>
        <div className="rounded-full border border-[var(--border)] bg-white/50 px-2 py-1 text-xs font-semibold text-[var(--foreground)]">
          Step {stepValue}
        </div>
      </div>
    </div>
  );
}

function VisionStsSelectionExample() {
  const visionSts = useDevice(DeviceIDs.VIS, (state) => state.sts);

  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Vision sts value</p>
        <pre className="mt-4 overflow-auto rounded-2xl border border-[var(--border)] bg-white/60 p-4 text-xs text-[var(--foreground)]">
          {formatJson(visionSts)}
        </pre>
      </div>
    </div>
  );
}

function formatJson(value: unknown) {
  if (value === undefined) {
    return "undefined";
  }

  if (value === null) {
    return "null";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getDeviceStateAppearance(deviceState: DeviceStatus | undefined) {
  if (!deviceState) {
    return {
      label: "Pending",
      className: "border-slate-300 bg-slate-100 text-slate-700",
    };
  }

  if (deviceState.error) {
    return {
      label: "Error",
      className: "border-rose-200 bg-rose-100 text-rose-700",
    };
  }

  if (deviceState.killed) {
    return {
      label: "Killed",
      className: "border-amber-200 bg-amber-100 text-amber-800",
    };
  }

  if (deviceState.aborting) {
    return {
      label: "Aborting",
      className: "border-orange-200 bg-orange-100 text-orange-700",
    };
  }

  if (deviceState.resetting) {
    return {
      label: "Resetting",
      className: "border-sky-200 bg-sky-100 text-sky-700",
    };
  }

  if (deviceState.running) {
    return {
      label: "Running",
      className: "border-emerald-200 bg-emerald-100 text-emerald-700",
    };
  }

  if (deviceState.paused) {
    return {
      label: "Paused",
      className: "border-violet-200 bg-violet-100 text-violet-700",
    };
  }

  if (deviceState.stopping) {
    return {
      label: "Stopping",
      className: "border-orange-200 bg-orange-100 text-orange-700",
    };
  }

  if (deviceState.done) {
    return {
      label: "Done",
      className: "border-teal-200 bg-teal-100 text-teal-700",
    };
  }

  if (deviceState.manual) {
    return {
      label: "Manual",
      className: "border-fuchsia-200 bg-fuchsia-100 text-fuchsia-700",
    };
  }

  if (deviceState.idle) {
    return {
      label: "Idle",
      className: "border-blue-200 bg-blue-100 text-blue-700",
    };
  }

  if (deviceState.inactive) {
    return {
      label: "Inactive",
      className: "border-slate-300 bg-slate-100 text-slate-700",
    };
  }

  return {
    label: "Unknown",
    className: "border-slate-300 bg-slate-100 text-slate-700",
  };
}