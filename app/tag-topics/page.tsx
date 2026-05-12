"use client";

import { useMemo } from "react";

import { SectionCard } from "@/components/section-card";
import {
  getCachedPollingTagCount,
  getTagTopicsCount,
  getTagTopicsPayload,
} from "@/lib/bridge/types";
import { useBridgeState } from "@/lib/store/zustand-provider";

export default function TagTopicsPage() {
  const cacheSnapshot = useBridgeState((state) => state.cache.payload);
  const cacheUpdatedAt = useBridgeState((state) => state.cache.updatedAt);
  const tagTopics = getTagTopicsPayload(cacheSnapshot);
  const normalizedItems = useMemo(() => normalizeTagTopicItems(tagTopics), [tagTopics]);
  const groupedItems = useMemo(() => groupTagTopicItems(normalizedItems), [normalizedItems]);
  const healthyCount = normalizedItems.filter((item) => item.isHealthy).length;

  return (
    <div className="space-y-4">
      <SectionCard title="GET_CACHE Snapshot" description="Heavy metadata lives here instead of bridge/status, including TagTopics diagnostics.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Machine ID" value={cacheSnapshot?.machineId ?? "Unknown"} />
          <Metric
            label="Cached topics"
            value={String(getCachedPollingTagCount(cacheSnapshot))}
          />
          <Metric
            label="TagTopics entries"
            value={String(getTagTopicsCount(cacheSnapshot))}
          />
          <Metric label="Healthy tags" value={`${healthyCount}/${normalizedItems.length}`} />
          <Metric label="Updated" value={cacheUpdatedAt ? new Date(cacheUpdatedAt).toLocaleTimeString() : "Pending"} />
        </div>
      </SectionCard>

      <SectionCard title="TagTopics Status" description="Organized by bridge source and whether each tag belongs to the machine or a device.">
        {normalizedItems.length > 0 ? (
          <div className="space-y-6">
            {groupedItems.map((scopeGroup) => (
              <div key={scopeGroup.scope} className="space-y-3">
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Scope</p>
                    <h3 className="mt-1 text-lg font-semibold text-[var(--foreground)]">{scopeGroup.label}</h3>
                  </div>
                  <p className="text-sm text-[var(--muted)]">{scopeGroup.items.length} tag(s)</p>
                </div>

                <div className="space-y-4">
                  {scopeGroup.stageGroups.map((stageGroup) => (
                    <div key={`${scopeGroup.scope}-${stageGroup.stage}`} className="space-y-3">
                      <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Lifecycle</p>
                          <h4 className="mt-1 text-sm font-semibold text-[var(--foreground)]">{stageGroup.label}</h4>
                        </div>
                        <p className="text-xs text-[var(--muted)]">{stageGroup.items.length} tag(s)</p>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-2">
                        {stageGroup.sources.map((sourceGroup) => (
                          <div
                            key={`${scopeGroup.scope}-${stageGroup.stage}-${sourceGroup.source}`}
                            className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface)]"
                          >
                            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-white/40 px-4 py-3">
                              <div>
                                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Bridge source</p>
                                <h5 className="mt-1 text-sm font-semibold text-[var(--foreground)]">{sourceGroup.label}</h5>
                              </div>
                              <p className="text-xs text-[var(--muted)]">{sourceGroup.items.length} tag(s)</p>
                            </div>

                            <div className="divide-y divide-[var(--border)]">
                              {sourceGroup.items.map((item) => (
                                <div key={item.id} className="grid gap-2 px-4 py-3 md:grid-cols-[auto_1fr_auto] md:items-center">
                                  <div className="flex items-center gap-2">
                                    <StatusDot isHealthy={item.isHealthy} />
                                    <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                                      {item.statusLabel}
                                    </span>
                                  </div>

                                  <div className="min-w-0">
                                    <p className="truncate font-mono text-xs text-[var(--foreground)]">{item.title}</p>
                                    <p className="truncate text-xs text-[var(--muted)]">{item.topic}</p>
                                    {item.reason ? (
                                      <p className="mt-1 line-clamp-2 text-xs text-amber-700">
                                        Reason: {item.reason}
                                      </p>
                                    ) : null}
                                  </div>

                                  <div className="text-right text-xs text-[var(--muted)]">
                                    <p>Read: {item.readStatus}</p>
                                    <p>Monitor: {item.pollStatus}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted)]">
            Waiting for GET_CACHE to return TagTopics metadata.
          </p>
        )}
      </SectionCard>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-xl font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function StatusDot({ isHealthy }: { isHealthy: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-3 w-3 rounded-full ${isHealthy ? "bg-emerald-500" : "bg-rose-500"}`}
    />
  );
}

type TagTopicItem = {
  id: string;
  isHealthy: boolean;
  lifecycleStage: "bootstrap" | "monitored" | "other";
  pollStatus: string;
  reason: string | null;
  readStatus: string;
  scope: "machine" | "device" | "unknown";
  source: string;
  statusLabel: string;
  title: string;
  topic: string;
};

function normalizeTagTopicItems(tagTopics: any): TagTopicItem[] {
  const rawItems = toTagTopicArray(tagTopics);

  return rawItems
    .map((entry, index) => normalizeTagTopicItem(entry, index))
    .filter((item): item is TagTopicItem => item !== null)
    .sort((left, right) => {
      if (left.scope !== right.scope) {
        return left.scope.localeCompare(right.scope);
      }

      if (left.source !== right.source) {
        return left.source.localeCompare(right.source);
      }

      if (left.isHealthy !== right.isHealthy) {
        return left.isHealthy ? -1 : 1;
      }

      return left.title.localeCompare(right.title);
    });
}

function toTagTopicArray(tagTopics: any): any[] {
  if (!tagTopics) {
    return [];
  }

  if (Array.isArray(tagTopics)) {
    return tagTopics;
  }

  if (typeof tagTopics === "object") {
    if (Array.isArray(tagTopics.items)) {
      return tagTopics.items;
    }

    return Object.entries(tagTopics).map(([key, value]) => {
      if (value && typeof value === "object") {
        return { key, ...(value as Record<string, unknown>) };
      }

      return { key, value };
    });
  }

  return [{ value: tagTopics }];
}

function normalizeTagTopicItem(entry: any, index: number): TagTopicItem | null {
  if (!entry || typeof entry !== "object") {
    return {
      id: `tag-topic-${index}`,
      isHealthy: false,
      lifecycleStage: "other",
      pollStatus: "unknown",
      reason: null,
      readStatus: "unknown",
      scope: "unknown",
      source: "unknown",
      statusLabel: "Needs attention",
      title: `Entry ${index + 1}`,
      topic: String(entry),
    };
  }

  const item = entry as Record<string, unknown>;
  const topic = getString(item.mqttTopic) ?? getString(item.topic) ?? getString(item.nodeId) ?? "Unknown topic";
  const title =
    getString(item.tagId) ?? getString(item.key) ?? getString(item.nodeId) ?? getString(item.mqttTopic) ?? `Entry ${index + 1}`;
  const source = getString(item.source) ?? getString(item.publisher) ?? "unknown";
  const readStatus = getString(item.readStatus) ?? getString(item.status) ?? "unknown";
  const pollStatus = getString(item.pollStatus) ?? getString(item.monitorStatus) ?? "unknown";
  const isHealthy = isHealthyTag(item, readStatus, pollStatus);
  const lifecycleStage = inferLifecycleStage(source, readStatus, pollStatus);
  const reason = getReason(item, readStatus, pollStatus);

  return {
    id: getString(item.tagId) ?? getString(item.nodeId) ?? getString(item.mqttTopic) ?? `tag-topic-${index}`,
    isHealthy,
    lifecycleStage,
    pollStatus,
    reason,
    readStatus,
    scope: inferScope(source, topic),
    source,
    statusLabel: isHealthy ? "Healthy" : "Needs attention",
    title,
    topic,
  };
}

function inferLifecycleStage(
  source: string,
  readStatus: string,
  pollStatus: string,
): TagTopicItem["lifecycleStage"] {
  const normalizedSource = source.toLowerCase();
  const normalizedRead = readStatus.toLowerCase();
  const normalizedPoll = pollStatus.toLowerCase();

  if (normalizedSource.includes("bootstrap")) {
    return "bootstrap";
  }

  if (normalizedSource.includes("poll")) {
    return "monitored";
  }

  if (["subscribed", "received", "notsubscribed"].includes(normalizedPoll)) {
    return "monitored";
  }

  if (["success", "skipped", "failed", "error"].includes(normalizedRead)) {
    return "bootstrap";
  }

  return "other";
}

function getReason(item: Record<string, unknown>, readStatus: string, pollStatus: string): string | null {
  const readDetail = getString(item.readDetail);
  const pollDetail = getString(item.pollDetail);
  const normalizedRead = readStatus.toLowerCase();
  const normalizedPoll = pollStatus.toLowerCase();

  if (normalizedPoll === "notsubscribed" || normalizedPoll === "failed" || normalizedPoll === "error") {
    return pollDetail ?? readDetail;
  }

  if (normalizedRead === "skipped" || normalizedRead === "failed" || normalizedRead === "error") {
    return readDetail ?? pollDetail;
  }

  if (normalizedPoll !== "subscribed" && pollDetail) {
    return pollDetail;
  }

  if (normalizedRead !== "success" && readDetail) {
    return readDetail;
  }

  return null;
}

function isHealthyTag(
  item: Record<string, unknown>,
  readStatus: string,
  pollStatus: string,
): boolean {
  const normalizedRead = readStatus.toLowerCase();
  const normalizedPoll = pollStatus.toLowerCase();

  if (normalizedRead === "success") {
    return true;
  }

  if (normalizedPoll === "received" || normalizedPoll === "subscribed") {
    return true;
  }

  const monitored = item.monitored;
  if (typeof monitored === "boolean") {
    return monitored;
  }

  const readOk = item.readOk;
  if (typeof readOk === "boolean") {
    return readOk;
  }

  return false;
}

function inferScope(source: string, topic: string): "machine" | "device" | "unknown" {
  const normalizedSource = source.toLowerCase();

  if (normalizedSource.includes("device")) {
    return "device";
  }

  if (normalizedSource.includes("machine")) {
    return "machine";
  }

  if (topic.startsWith("machine/")) {
    const segments = topic.split("/");

    if (segments.length > 2 && /^\d+$/.test(segments[1] ?? "")) {
      return "device";
    }

    return "machine";
  }

  return "unknown";
}

function groupTagTopicItems(items: TagTopicItem[]) {
  const scopeOrder: Array<TagTopicItem["scope"]> = ["machine", "device", "unknown"];
  const stageOrder: Array<TagTopicItem["lifecycleStage"]> = ["bootstrap", "monitored", "other"];

  return scopeOrder
    .map((scope) => {
      const scopeItems = items.filter((item) => item.scope === scope);
      const stageGroups = stageOrder
        .map((stage) => {
          const stageItems = scopeItems.filter((item) => item.lifecycleStage === stage);
          const sourceMap = new Map<string, TagTopicItem[]>();

          stageItems.forEach((item) => {
            const sourceItems = sourceMap.get(item.source) ?? [];

            sourceItems.push(item);
            sourceMap.set(item.source, sourceItems);
          });

          return {
            items: stageItems,
            label:
              stage === "bootstrap"
                ? "Bootstrap tags"
                : stage === "monitored"
                  ? "Monitored tags"
                  : "Other tags",
            sources: Array.from(sourceMap.entries())
              .sort(([left], [right]) => left.localeCompare(right))
              .map(([source, sourceItems]) => ({
                items: sourceItems,
                label: humanizeLabel(source),
                source,
              })),
            stage,
          };
        })
        .filter((group) => group.items.length > 0);

      return {
        items: scopeItems,
        label: scope === "machine" ? "Machine tags" : scope === "device" ? "Device tags" : "Unknown scope",
        scope,
        stageGroups,
      };
    })
    .filter((group) => group.items.length > 0);
}

function humanizeLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (match) => match.toUpperCase());
}

function getString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}