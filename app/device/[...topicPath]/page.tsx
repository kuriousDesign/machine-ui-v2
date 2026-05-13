"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useId, useMemo } from "react";

import { SectionCard } from "@/components/section-card";
import type { DeviceRuntimeTopicSummaryKey, TopicMessageSummary } from "@/lib/store/bridge-store";
import { useDeviceComprehensive } from "@/lib/store/zustand-provider";

type RuntimeEntry = {
  label: string;
  receivedAt?: number | null;
  source?: TopicMessageSummary["source"] | null;
  topic?: string | null;
  value: unknown;
};

function hasDisplayValue(value: unknown): boolean {
  if (value == null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).length > 0;
  }

  return true;
}

export default function DeviceDetailsPage() {
  const params = useParams<{ topicPath?: string[] | string }>();
  const rawTopicPath = params?.topicPath;
  const topicPath = Array.isArray(rawTopicPath)
    ? rawTopicPath
    : typeof rawTopicPath === "string"
      ? [rawTopicPath]
      : [];
  const rawDeviceId = topicPath.at(-1);
  const deviceId = rawDeviceId ? Number(rawDeviceId) : Number.NaN;
  const hasValidDeviceId = Number.isInteger(deviceId) && deviceId > 0;

  const topicPrefix = topicPath.length > 0 ? `machine/${topicPath.join("/")}` : null;
  const selectedDeviceId = hasValidDeviceId ? deviceId : -1;

  const device = useDeviceComprehensive(selectedDeviceId, (state) => state);
  const deviceState = device.runtime;
  const deviceMetaData = device.meta;
  const registration = deviceState.registration ?? deviceMetaData.device;
  const resolvedTopicPrefix = deviceMetaData.topicPrefix;
  const runtimeEntries = useMemo(
    () => {
      const createEntry = (
        label: string,
        value: unknown,
        options?: {
          suffix?: string;
          summaryKey?: DeviceRuntimeTopicSummaryKey;
        },
      ): RuntimeEntry => {
        const summary = options?.summaryKey ? deviceMetaData.runtimeTopicSummaries[options.summaryKey] : undefined;

        return {
          label,
          receivedAt: summary?.receivedAt ?? null,
          source: summary?.source ?? null,
          topic: options?.suffix && resolvedTopicPrefix ? `${resolvedTopicPrefix}/${options.suffix}` : null,
          value,
        };
      };

      return [
        createEntry("registration", deviceState.registration),
        createEntry("cfg", deviceState.cfg, { suffix: "cfg", summaryKey: "cfg" }),
        createEntry("is", deviceState.is, { suffix: "is", summaryKey: "is" }),
        createEntry("errors", deviceState.errors, { suffix: "errors", summaryKey: "errors" }),
        createEntry("warnings", deviceState.warnings, { suffix: "warnings", summaryKey: "warnings" }),
        createEntry("mutedChildrenArray", deviceState.mutedChildrenArray, { suffix: "mutedchildrenarray", summaryKey: "mutedChildrenArray" }),
        createEntry("execMethod", deviceState.execMethod, { suffix: "execmethod", summaryKey: "execMethod" }),
        createEntry("task", deviceState.task, { suffix: "task", summaryKey: "task" }),
        createEntry("process", deviceState.process, { suffix: "process", summaryKey: "process" }),
        createEntry("script", deviceState.script, { suffix: "script", summaryKey: "script" }),
        createEntry("connectionStatus", deviceState.connectionStatus),
        createEntry("apiOpcua.hmiReq", deviceState.apiOpcua && typeof deviceState.apiOpcua === "object" ? (deviceState.apiOpcua as Record<string, unknown>).hmiReq : undefined, { suffix: "apiopcua/hmireq", summaryKey: "apiOpcuaHmiReq" }),
        createEntry("apiOpcua.hmiResp", deviceState.apiOpcua && typeof deviceState.apiOpcua === "object" ? (deviceState.apiOpcua as Record<string, unknown>).hmiResp : undefined, { suffix: "apiopcua/hmiresp", summaryKey: "apiOpcuaHmiResp" }),
        createEntry("apiOpcua.internalReq", deviceState.apiOpcua && typeof deviceState.apiOpcua === "object" ? (deviceState.apiOpcua as Record<string, unknown>).internalReq : undefined, { suffix: "apiopcua/internalreq", summaryKey: "apiOpcuaInternalReq" }),
        createEntry("apiOpcua.internalResp", deviceState.apiOpcua && typeof deviceState.apiOpcua === "object" ? (deviceState.apiOpcua as Record<string, unknown>).internalResp : undefined, { suffix: "apiopcua/internalresp", summaryKey: "apiOpcuaInternalResp" }),
        createEntry("log", deviceState.log, { suffix: "log", summaryKey: "log" }),
        createEntry("sts", deviceState.sts, { suffix: "sts", summaryKey: "sts" }),
        createEntry("inputs", deviceState.inputs),
        createEntry("outputs", deviceState.outputs),
        createEntry("topicPrefix", deviceMetaData.topicPrefix),
        createEntry("lastSeenAt", deviceMetaData.lastSeenAt),
      ].filter((entry) => hasDisplayValue(entry.value));
    },
    [deviceMetaData.lastSeenAt, deviceMetaData.runtimeTopicSummaries, deviceState, resolvedTopicPrefix],
  );
  const matchingDiagnostics = deviceMetaData.tagTopics;

  if (!topicPrefix || topicPath.length === 0 || !hasValidDeviceId) {
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
            <Detail label="Topic prefix" value={deviceMetaData.topicPrefix ?? "Unknown"} mono />
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
        title="Runtime State"
        description="Combined device-scoped Zustand view, including parsed runtime fields and raw message envelopes exposed through popovers."
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

        <div className="grid gap-4 md:grid-cols-2">
          {runtimeEntries.map((entry) => (
            <RuntimeFieldCard
              key={entry.label}
              label={entry.label}
              receivedAt={entry.receivedAt}
              topic={entry.topic}
              value={entry.value}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Subscribed Topics"
        description="Compact list of active subscriptions under this device topic prefix."
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
                <div className="mt-3 flex justify-end">
                  <PayloadPopover
                    label={`Payload for ${topicMessage.topic}`}
                    payload={topicMessage.payload}
                    buttonLabel="View payload"
                  />
                </div>
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
    <ul className="flex flex-wrap gap-2">
      {topics.map((topic) => (
        <li
          key={topic}
          className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 font-mono text-[11px] leading-5 text-[var(--foreground)]"
          title={topic}
        >
          {topic}
        </li>
      ))}
    </ul>
  );
}

function PayloadPopover({
  buttonLabel,
  label,
  payload,
}: {
  buttonLabel: string;
  label: string;
  payload: unknown;
}) {
  const popoverId = useId().replace(/:/g, "");

  return (
    <>
      <button
        type="button"
        popoverTarget={popoverId}
        className="rounded-xl border border-[var(--border)] bg-white/70 px-3 py-2 text-xs font-medium text-[var(--foreground)] transition-colors duration-200 hover:bg-white"
      >
        {buttonLabel}
      </button>
      <div
        id={popoverId}
        popover="auto"
        className="max-h-[70vh] max-w-[min(90vw,720px)] overflow-auto rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-900 shadow-2xl backdrop:bg-slate-950/20"
      >
        <div className="flex items-start justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
          <button
            type="button"
            popoverTarget={popoverId}
            popoverTargetAction="hide"
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 transition-colors duration-200 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
        <pre className="mt-4 overflow-auto rounded-2xl bg-slate-50 p-4 text-xs text-slate-800">{formatUnknown(payload)}</pre>
      </div>
    </>
  );
}

function RuntimeFieldCard({
  label,
  receivedAt,
  source,
  topic,
  value,
}: {
  label: string;
  receivedAt?: number | null;
  source?: TopicMessageSummary["source"] | null;
  topic?: string | null;
  value: unknown;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
      {topic ? <p className="mt-2 font-mono text-xs text-[var(--accent-strong)]">{topic}</p> : null}
      {receivedAt ? <p className="mt-2 text-xs text-[var(--muted)]">Last {source ?? "unknown"} message {formatTimestamp(receivedAt)}</p> : null}
      <p className="mt-3 line-clamp-3 text-xs text-[var(--foreground)]">{formatPreview(value)}</p>
      <div className="mt-3 flex justify-end">
        <PayloadPopover label={`${label} value`} payload={value} buttonLabel="View payload" />
      </div>
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

function formatPreview(value: unknown) {
  const formatted = formatUnknown(value);

  if (formatted.length <= 160) {
    return formatted;
  }

  return `${formatted.slice(0, 157)}...`;
}

function formatTimestamp(timestamp: number | null) {
  return timestamp ? new Date(timestamp).toLocaleString() : "Pending";
}