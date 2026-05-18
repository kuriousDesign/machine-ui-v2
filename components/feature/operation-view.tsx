"use client";

import { SectionCard } from "@/components/section-card";
import { DeviceIDs } from "@/lib/bridge/sdk-lite";
import { useDevice } from "@/lib/store/zustand-provider";

export function OperationView() {
  return (
    <div className="space-y-6">
      <SectionCard
        title="Selector Example"
        description="Example of selecting only the VIS sts field from useDeviceState instead of the full device slice."
      >
        <VisionStsSelectionExample />
      </SectionCard>
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