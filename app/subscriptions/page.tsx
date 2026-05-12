"use client";

import { SectionCard } from "@/components/section-card";
import { useBridgeState } from "@/lib/store/zustand-provider";

export default function SubscriptionsPage() {
  const activeTopics = useBridgeState((state) => state.subscriptions.activeTopics);
  const topicMessages = useBridgeState((state) => state.topics);

  return (
    <SectionCard title="Subscribed Topics" description="The exact subscriptions currently managed by BridgeProvider, with the last captured payload metadata.">
      {activeTopics.length > 0 ? (
        <div className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)]">
          <table>
            <thead className="bg-white/50 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">Topic</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Last timestamp</th>
                <th className="px-4 py-3">Payload preview</th>
              </tr>
            </thead>
            <tbody>
              {activeTopics.map((topic) => {
                const message = topicMessages[topic];

                return (
                  <tr key={topic} className="border-t border-[var(--border)] align-top text-sm">
                    <td className="px-4 py-4 font-mono text-xs text-[var(--foreground)]">{topic}</td>
                    <td className="px-4 py-4 text-[var(--muted)]">{message?.source ?? "pending"}</td>
                    <td className="px-4 py-4 text-[var(--muted)]">
                      {message ? new Date(message.receivedAt).toLocaleString() : "Waiting"}
                    </td>
                    <td className="px-4 py-4">
                      <pre className="max-h-28 overflow-auto rounded-2xl bg-white/60 p-3 text-xs text-[var(--foreground)]">
                        {message ? JSON.stringify(message.payload, null, 2) : "No payload captured yet."}
                      </pre>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted)]">
          No subscriptions have been registered yet.
        </p>
      )}
    </SectionCard>
  );
}