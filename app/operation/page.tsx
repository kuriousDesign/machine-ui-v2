"use client";

<<<<<<< HEAD
import { OperationView } from "@/components/feature/operation-view";

export default function OperationPage() {
  return <OperationView />;
=======
import { SectionCard } from "@/components/section-card";
import { DeviceIDs, type DeviceRegistration, type DeviceStatus } from "@/lib/bridge/sdk-lite";
import { useBridgeState, useDevice, useDeviceComprehensive, useMachineState } from "@/lib/store/zustand-provider";

export default function OperationPage() {
  return (
    <div className="space-y-6">
      <SectionCard
        title="Registered Device States"
      import { OperationView } from "@/components/feature/operation-view";
      >
      export default function OperationPage() {
        return <OperationView />;
      }
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
  const stepDescription = deviceState?.stepDescription?.trim();

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

      {/* <p className="mt-1 truncate text-xs text-[var(--muted)]">
        {stepDescription || "Pending"}
      </p> */}
    </div>
  );
}

function VisionOperationCard() {
  const device = useDevice(DeviceIDs.VIS);
  const machine = useMachineState((state) => state);

  const deviceComprehensive = useDeviceComprehensive(DeviceIDs.VIS);

  return (
    <div className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Vision status</p>
        <p className="mt-3 text-sm text-[var(--muted)]">This card uses `useDevice(DeviceIDs.VIS)` for runtime data and `useDeviceComprehensive(DeviceIDs.VIS)` when metadata is also needed.</p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Stat label="Device ID" value={String(DeviceIDs.VIS)} />
          <Stat label="Topic prefix" value={deviceComprehensive.meta.topicPrefix ?? "Pending"} mono />
          <Stat label="Last seen" value={formatValue(deviceComprehensive.meta.lastSeenAt)} />
          <Stat label="Registration" value={device.registration?.mnemonic ?? "Pending"} />
        </div>
      </div>

      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">VIS sts</p>
        <pre className="mt-4 overflow-auto rounded-2xl border border-[var(--border)] bg-white/60 p-4 text-xs text-[var(--foreground)]">
          {formatJson(device.sts)}
        </pre>
      </div>

      <div className="xl:col-span-2 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Full device slice</p>
        <pre className="mt-4 overflow-auto rounded-2xl border border-[var(--border)] bg-white/60 p-4 text-xs text-[var(--foreground)]">
          {formatJson(device)}
        </pre>
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

function Stat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/60 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
      <p className={`mt-2 text-sm text-[var(--foreground)] ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function formatValue(value: unknown) {
  if (typeof value === "number") {
    return new Date(value).toLocaleString();
  }

  if (value == null) {
    return "Pending";
  }

  return String(value);
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

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{label}</dt>
      <dd className={`mt-1 text-sm text-[var(--foreground)] ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
>>>>>>> ed355bf (fixes perior to comparison)
}