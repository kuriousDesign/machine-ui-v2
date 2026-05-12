"use client";

import { SectionCard } from "@/components/section-card";
import { useBridgeState, useMachineState } from "@/lib/store/zustand-provider";

export default function BridgeStatusPage() {
  const connection = useBridgeState((state) => state.connection);
  const bridgeStatus = useBridgeState((state) => state.bridgeStatus.payload);
  const bridgeUpdatedAt = useBridgeState((state) => state.bridgeStatus.updatedAt);
  const machineTopics = useMachineState((state) => state.topics);

  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCard title="Bridge Status" description="Lightweight bridge health and lifecycle state from bridge/status.">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <StatusRow label="MQTT phase" value={connection.phase} />
          <StatusRow label="Bridge updated" value={formatTimestamp(bridgeUpdatedAt)} />
          <StatusRow label="Machine ID" value={bridgeStatus?.machineId ?? "Unknown"} />
          <StatusRow label="OPC UA state" value={bridgeStatus?.opcuaStateLabel ?? "Unknown"} />
          <StatusRow label="Publish manager" value={bridgeStatus?.publishManagerStatus ?? "Unknown"} />
          <StatusRow label="Supervisor" value={bridgeStatus?.supervisorState ?? "Unknown"} />
          <StatusRow
            label="Registered devices"
            value={String(bridgeStatus?.registeredDeviceCount ?? 0)}
          />
          <StatusRow label="Bridge MQTT connected" value={String(bridgeStatus?.mqttConnected ?? false)} />
        </dl>
      </SectionCard>

      <SectionCard title="Machine-State Topics" description="This panel is powered by the machine-only selector, excluding device-prefixed topics.">
        <div className="space-y-3">
          {machineTopics.length > 0 ? (
            machineTopics.map((topicMessage) => (
              <div key={topicMessage.topic} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-xs text-[var(--accent-strong)]">{topicMessage.topic}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    {topicMessage.source}
                  </p>
                </div>
                <pre className="mt-3 overflow-auto text-xs text-[var(--foreground)]">
                  {JSON.stringify(topicMessage.payload, null, 2)}
                </pre>
              </div>
            ))
          ) : (
            <EmptyState message="No machine-scoped topics are cached yet." />
          )}
        </div>
      </SectionCard>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <dt className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{label}</dt>
      <dd className="mt-2 text-lg font-semibold text-[var(--foreground)]">{value}</dd>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted)]">{message}</p>;
}

function formatTimestamp(timestamp: number | null) {
  return timestamp ? new Date(timestamp).toLocaleString() : "Pending";
}