"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";

import { SectionCard } from "@/components/section-card";
import { getTagTopicsPayload } from "@/lib/bridge/types";
import { useBridgeState, useDeviceMetaData, useDeviceState } from "@/lib/store/zustand-provider";

export default function DeviceDetailsPage() {
  const params = useParams<{ topicPath?: string[] | string }>();
  const rawTopicPath = params?.topicPath;
  const topicPath = Array.isArray(rawTopicPath)
    ? rawTopicPath
    : typeof rawTopicPath === "string"
      ? [rawTopicPath]
      : [];

  const topicPrefix = topicPath.length > 0 ? `machine/${topicPath.join("/")}` : null;
  const deviceId = useBridgeState((state) => {
    if (!topicPrefix) {
      return null;
    }

    const match = Object.entries(state.deviceMap.topicPrefixes).find(([, prefix]) => prefix === topicPrefix);
    return match ? Number(match[0]) : null;
  });

  const deviceState = useDeviceState(deviceId ?? -1, (state) => state);
  const deviceMetaData = useDeviceMetaData(deviceId ?? -1, (state) => state);
  const registration = deviceState.registration ?? deviceMetaData.device;
  const cacheSnapshot = useBridgeState((state) => state.cache.payload);
  const tagTopics = getTagTopicsPayload(cacheSnapshot);
  const runtimeEntries = useMemo(
    () => [
      { label: "registration", value: deviceState.registration },
      { label: "cfg", value: deviceState.cfg },
      { label: "is", value: deviceState.is },
      { label: "errors", value: deviceState.errors },
      { label: "warnings", value: deviceState.warnings },
      { label: "mutedChildrenArray", value: deviceState.mutedChildrenArray },
      { label: "execMethod", value: deviceState.execMethod },
      { label: "task", value: deviceState.task },
      { label: "process", value: deviceState.process },
      { label: "script", value: deviceState.script },
      { label: "connectionStatus", value: deviceState.connectionStatus },
      { label: "apiOpcua", value: deviceState.apiOpcua },
      { label: "log", value: deviceState.log },
      { label: "sts", value: deviceState.sts },
      { label: "inputs", value: deviceState.inputs },
      { label: "outputs", value: deviceState.outputs },
      { label: "topicPrefix", value: deviceState.topicPrefix },
      { label: "lastSeenAt", value: deviceState.lastSeenAt },
      { label: "cfgMessage", value: deviceState.cfgMessage },
      { label: "isMessage", value: deviceState.isMessage },
      { label: "stsMessage", value: deviceState.stsMessage },
      { label: "logMessage", value: deviceState.logMessage },
    ],
    [deviceState],
  );
  const matchingDiagnostics = useMemo(() => {
    if (!deviceMetaData.topicPrefix) {
      return [];
    }

    return toTagTopicArray(tagTopics)
      .filter((entry) => entry && typeof entry === "object")
      .map((entry) => entry as Record<string, unknown>)
      .filter((entry) => {
        const mqttTopic = getString(entry.mqttTopic) ?? getString(entry.topic);
        return mqttTopic ? mqttTopic === deviceMetaData.topicPrefix || mqttTopic.startsWith(`${deviceMetaData.topicPrefix}/`) : false;
      })
      .sort((left, right) => {
        const leftTopic = getString(left.mqttTopic) ?? "";
        const rightTopic = getString(right.mqttTopic) ?? "";
        return leftTopic.localeCompare(rightTopic);
      });
  }, [deviceMetaData.topicPrefix, tagTopics]);

  if (!topicPrefix || topicPath.length === 0) {
    return <EmptyState title="Invalid device path" message="Provide a device path like /device/1 or /device/1/4." />;
  }

  if (!registration) {
    return (
      <EmptyState
        title="Device not found"
        message={`No device in the current deviceMap matches ${topicPrefix}. The bridge may still be hydrating.`}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title={`Device ${registration.id}`}
        description="Device-scoped Zustand view resolved from a topic-path route."
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Detail label="Mnemonic" value={registration.mnemonic} />
            <Detail label="Topic prefix" value={deviceState.topicPrefix ?? deviceMetaData.topicPrefix ?? "Unknown"} mono />
            <Detail label="Parent ID" value={String(registration.parentId)} />
            <Detail label="Child IDs" value={registration.childIdArray.join(", ") || "None"} />
            <Detail label="Device type" value={String(registration.deviceType)} />
            <Detail label="External service" value={String(registration.isExternalService)} />
            <Detail label="Subscribed topics" value={String(deviceMetaData.subscribedTopics.length)} />
            <Detail label="Captured payloads" value={String(deviceMetaData.topics.length)} />
          </div>

          <div className="flex items-start justify-end">
            <Link
              href="/device-map"
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition-colors duration-200 hover:bg-white/70"
            >
              Back to Device Map
            </Link>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Device State"
        description="Canonical device payload selectors from Zustand for cfg, is, sts, and log topics."
      >
        {deviceState.is ? (
          <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Parsed status summary</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Detail label="State" value={String(deviceState.is.state)} />
              <Detail label="Step" value={`${deviceState.is.stepNum} ${deviceState.is.stepDescription}`.trim()} />
              <Detail label="Status" value={deviceState.is.statusMsg || "Unknown"} />
              <Detail label="Running" value={String(deviceState.is.running)} />
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StateCard label="cfg" message={deviceState.cfgMessage} />
          <StateCard label="is" message={deviceState.isMessage} />
          <StateCard label="sts" message={deviceState.stsMessage} />
          <StateCard label="log" message={deviceState.logMessage} />
        </div>
      </SectionCard>

      <SectionCard
        title="All Runtime Fields"
        description="Complete view of every field currently available on DeviceRuntimeState, including parsed device data and raw MQTT topic envelopes."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {runtimeEntries.map((entry) => (
            <RuntimeFieldCard key={entry.label} label={entry.label} value={entry.value} />
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Subscribed Topics"
        description="All active BridgeProvider subscriptions under this device topic prefix, even if they have not emitted a payload yet."
      >
        {deviceMetaData.subscribedTopics.length > 0 ? (
          <TopicList topics={deviceMetaData.subscribedTopics} />
        ) : (
          <p className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted)]">
            No active subscriptions registered for this device yet.
          </p>
        )}
      </SectionCard>

      <SectionCard
        title="Latest Payloads"
        description="The most recent MQTT payloads captured for topics under this device prefix."
      >
        {deviceMetaData.topics.length > 0 ? (
          <div className="space-y-3">
            {deviceMetaData.topics.map((topicMessage) => (
              <div key={topicMessage.topic} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-xs text-[var(--accent-strong)]">{topicMessage.topic}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    {topicMessage.source} · {new Date(topicMessage.receivedAt).toLocaleString()}
                  </p>
                </div>
                <pre className="mt-3 overflow-auto text-xs text-[var(--foreground)]">
                  {JSON.stringify(topicMessage.payload, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted)]">
            No payloads captured for this device yet.
          </p>
        )}
      </SectionCard>

      <SectionCard
        title="Tag Diagnostics"
        description="Bridge cache diagnostics filtered to this device topic prefix, including skip reasons and monitor status."
      >
        {matchingDiagnostics.length > 0 ? (
          <div className="space-y-3">
            {matchingDiagnostics.map((entry, index) => {
              const title = getString(entry.tagId) ?? getString(entry.nodeId) ?? `Entry ${index + 1}`;
              const mqttTopic = getString(entry.mqttTopic) ?? "Unknown topic";
              const readStatus = getString(entry.readStatus) ?? "unknown";
              const pollStatus = getString(entry.pollStatus) ?? "unknown";
              const reason = getString(entry.pollDetail) ?? getString(entry.readDetail);

              return (
                <div key={`${mqttTopic}-${title}-${index}`} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-xs text-[var(--foreground)]">{title}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      Read {readStatus} · Monitor {pollStatus}
                    </p>
                  </div>
                  <p className="mt-2 font-mono text-xs text-[var(--muted)]">{mqttTopic}</p>
                  {reason ? <p className="mt-2 text-xs text-amber-700">Reason: {reason}</p> : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted)]">
            No TagTopics diagnostics matched this device prefix.
          </p>
        )}
      </SectionCard>
    </div>
  );
}

function TopicList({ topics }: { topics: string[] }) {
  return (
    <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {topics.map((topic) => (
        <li key={topic} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 font-mono text-xs text-[var(--foreground)]">
          {topic}
        </li>
      ))}
    </ul>
  );
}

function StateCard({ label, message }: { label: string; message: { payload: unknown; receivedAt: number; topic: string } | null }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 font-mono text-xs text-[var(--accent-strong)]">{message?.topic ?? "pending"}</p>
      {message ? (
        <>
          <p className="mt-2 text-xs text-[var(--muted)]">{new Date(message.receivedAt).toLocaleString()}</p>
          <pre className="mt-3 overflow-auto text-xs text-[var(--foreground)]">{JSON.stringify(message.payload, null, 2)}</pre>
        </>
      ) : (
        <p className="mt-3 text-sm text-[var(--muted)]">No payload captured yet.</p>
      )}
    </div>
  );
}

function RuntimeFieldCard({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
      <pre className="mt-3 overflow-auto text-xs text-[var(--foreground)]">{formatUnknown(value)}</pre>
    </div>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
      <p className={`mt-2 text-sm text-[var(--foreground)] ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <SectionCard title={title} description={message}>
      <Link
        href="/device-map"
        className="inline-flex rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition-colors duration-200 hover:bg-white/70"
      >
        Back to Device Map
      </Link>
    </SectionCard>
  );
}

function toTagTopicArray(tagTopics: unknown): unknown[] {
  if (!tagTopics) {
    return [];
  }

  if (Array.isArray(tagTopics)) {
    return tagTopics;
  }

  if (typeof tagTopics === "object") {
    const record = tagTopics as Record<string, unknown>;
    if (Array.isArray(record.items)) {
      return record.items;
    }

    return Object.entries(record).map(([key, value]) => {
      if (value && typeof value === "object") {
        return { key, ...(value as Record<string, unknown>) };
      }

      return { key, value };
    });
  }

  return [tagTopics];
}

function getString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function formatUnknown(value: unknown) {
  if (value === undefined) {
    return "undefined";
  }

  if (value === null) {
    return "null";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}