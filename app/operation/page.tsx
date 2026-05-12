"use client";

import { SectionCard } from "@/components/section-card";
import { DeviceIDs } from "@/lib/bridge/sdk-lite";
import { useDeviceState } from "@/lib/store/zustand-provider";

export default function OperationPage() {
  return (
    <div className="space-y-6">
      {/* <SectionCard
        title="Operation"
        description="Focused operation surface for device-driven UI components. This first slice reads the VIS device directly from Zustand."
      >
        <VisionOperationCard />
      </SectionCard> */}

      <SectionCard
        title="Selector Example"
        description="Example of selecting only the VIS sts field from useDeviceState instead of the full device slice."
      >
        <VisionStsSelectionExample />
      </SectionCard>
    </div>
  );
}

function VisionOperationCard() {
  const device = useDeviceState(DeviceIDs.VIS);

  return (
    <div className="grid gap-4 xl:grid-cols-[0.7fr_1.3fr]">
      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Vision status</p>
        <p className="mt-3 text-sm text-[var(--muted)]">This card uses `useDeviceState(DeviceIDs.VIS)` and is currently centered on `sts`.</p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Stat label="Device ID" value={String(DeviceIDs.VIS)} />
          <Stat label="Topic prefix" value={device.topicPrefix ?? "Pending"} mono />
          <Stat label="Last seen" value={formatValue(device.lastSeenAt)} />
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
  const visionSts = useDeviceState(DeviceIDs.VIS, (state) => state.sts);

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