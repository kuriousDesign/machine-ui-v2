"use client";

import Link from "next/link";

import { SectionCard } from "@/components/section-card";
import { useBridgeState, useMachineState } from "@/lib/store/zustand-provider";

const dashboardLinks = [
  {
    href: "/bridge-status",
    title: "Bridge Status",
    description: "Track broker state, OPC UA bridge state, and the current bridge heartbeat view.",
  },
  {
    href: "/device-map",
    title: "Device Map",
    description: "Explore the registered device hierarchy and the MQTT topic prefixes derived from it.",
  },
  {
    href: "/subscriptions",
    title: "Subscriptions",
    description: "Inspect the exact topics the UI is subscribed to and the last payload captured for each.",
  },
  {
    href: "/tag-topics",
    title: "TagTopics",
    description: "Review cache metadata and OPC UA TagTopics diagnostics returned through GET_CACHE.",
  },
];

export default function Home() {
  const connection = useBridgeState((state) => state.connection);
  const deviceCount = useBridgeState((state) => state.deviceMap.orderedIds.length);
  const activeSubscriptionCount = useBridgeState(
    (state) => state.subscriptions.activeTopics.length,
  );
  const cacheUpdatedAt = useBridgeState((state) => state.cache.updatedAt);
  const machineTopics = useMachineState((state) => state.topics);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <SectionCard title="Machine UI V2" description="A segmented MQTT client for bridge state, cache hydration, and device-scoped Zustand selectors.">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryStat label="MQTT phase" value={connection.phase} />
            <SummaryStat label="Devices" value={String(deviceCount)} />
            <SummaryStat label="Subscriptions" value={String(activeSubscriptionCount)} />
            <SummaryStat
              label="Cache update"
              value={cacheUpdatedAt ? new Date(cacheUpdatedAt).toLocaleTimeString() : "Pending"}
            />
          </div>
        </SectionCard>
        <SectionCard title="Machine Slice" description="This preview reads only the machine-scoped selector, excluding device-prefixed topics.">
          <div className="space-y-3 text-sm text-[var(--muted)]">
            <p>Machine topic count: {machineTopics.length}</p>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
              {machineTopics.length > 0 ? (
                <ul className="space-y-2">
                  {machineTopics.slice(0, 4).map((topicMessage) => (
                    <li key={topicMessage.topic} className="font-mono text-xs text-[var(--foreground)]">
                      {topicMessage.topic}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No machine topics hydrated yet.</p>
              )}
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <SectionCard title={link.title} description={link.description} className="h-full transition-transform duration-200 hover:-translate-y-1">
              <div className="flex items-center justify-between text-sm text-[var(--accent-strong)]">
                <span>Open view</span>
                <span aria-hidden>→</span>
              </div>
            </SectionCard>
          </Link>
        ))}
      </section>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}
