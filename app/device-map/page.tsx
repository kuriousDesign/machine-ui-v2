"use client";

import Link from "next/link";

import { SectionCard } from "@/components/section-card";
import { useBridgeState, useDeviceMetaData, useDeviceState } from "@/lib/store/zustand-provider";

export default function DeviceMapPage() {
  const orderedIds = useBridgeState((state) => state.deviceMap.orderedIds);
  const devices = useBridgeState((state) => state.deviceMap.byId);
  const topicPrefixes = useBridgeState((state) => state.deviceMap.topicPrefixes);

  return (
    <SectionCard title="Device Map" description="Device hierarchy from the bridge, with derived MQTT topic prefixes and device-scoped topic views.">
      {orderedIds.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {orderedIds.map((deviceId) => (
            <DeviceCard
              key={deviceId}
              deviceId={deviceId}
              device={devices[deviceId]}
              topicPrefix={topicPrefixes[deviceId] ?? "Unknown"}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted)]">
          Waiting for deviceMap from the bridge.
        </p>
      )}
    </SectionCard>
  );
}

function DeviceCard({
  deviceId,
  device,
  topicPrefix,
}: {
  deviceId: number;
  device: {
    childIdArray: number[];
    devicePath?: string[];
    deviceType: number;
    id: number;
    isExternalService: boolean;
    mnemonic: string;
    parentId: number;
  };
  topicPrefix: string;
}) {
  const deviceMetaData = useDeviceMetaData(deviceId, (state) => state);
  const deviceState = useDeviceState(deviceId, (state) => state);

  return (
    <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Device {device.id}</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{device.mnemonic}</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Path: {(device.devicePath ?? []).join(" / ") || "Unavailable"}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
            {device.isExternalService ? "External" : "Bridge"}
          </span>
          <Link
            href={`/device/${topicPrefix.replace(/^machine\//, "")}`}
            className="rounded-full border border-[var(--border)] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)] transition-colors duration-200 hover:bg-white"
          >
            Open device
          </Link>
        </div>
      </div>
      <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
        <Detail label="Parent ID" value={String(device.parentId)} />
        <Detail label="Child count" value={String(device.childIdArray.length)} />
        <Detail label="Device type" value={String(device.deviceType)} />
        <Detail label="Topic prefix" value={topicPrefix} mono />
      </dl>
      <div className="mt-5 rounded-2xl border border-[var(--border)] bg-white/50 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Device-scoped subscriptions</p>
        {deviceMetaData.subscribedTopics.length > 0 ? (
          <ul className="mt-3 space-y-2 text-xs text-[var(--foreground)]">
            {deviceMetaData.subscribedTopics.slice(0, 10).map((topic) => (
              <li key={topic} className="font-mono">
                {topic}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[var(--muted)]">No device subscriptions registered yet.</p>
        )}

        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Captured payload topics</p>
        {deviceMetaData.topics.length > 0 ? (
          <ul className="mt-3 space-y-2 text-xs text-[var(--foreground)]">
            {deviceMetaData.topics.slice(0, 6).map((topicMessage) => (
              <li key={topicMessage.topic} className="font-mono">
                {topicMessage.topic}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[var(--muted)]">No device payloads captured yet.</p>
        )}

        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">State topics</p>
        <ul className="mt-3 space-y-2 text-xs text-[var(--foreground)]">
          <li className="font-mono">cfg: {deviceState.cfgMessage?.topic ?? "pending"}</li>
          <li className="font-mono">is: {deviceState.isMessage?.topic ?? "pending"}</li>
          <li className="font-mono">sts: {deviceState.stsMessage?.topic ?? "pending"}</li>
          <li className="font-mono">log: {deviceState.logMessage?.topic ?? "pending"}</li>
        </ul>
      </div>
    </div>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{label}</dt>
      <dd className={`mt-1 text-sm text-[var(--foreground)] ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}