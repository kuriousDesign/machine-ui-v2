import type { DeviceRegistration } from "@/lib/bridge/sdk-lite";

export interface WriterHealthSnapshot {
  lastError: string | null;
  lastResetAt: number | null;
  lastResetReason: string | null;
  resetCount: number;
  state: string;
}

export interface BridgeStatusPayload {
  machineId?: string | null;
  mqttConnected: boolean;
  opcuaState: number;
  opcuaStateLabel: string;
  publishManagerStatus: string;
  registeredDeviceCount: number;
  supervisorState?: string;
  writeManagers?: {
    externalService: WriterHealthSnapshot;
    hmi: WriterHealthSnapshot;
  };
}

export type DynamicRecord = Record<string, unknown>;

export interface BridgeCachedTopicPayload {
  payload: unknown;
  timestamp: number;
  topic: string;
}

export interface BridgeCachePayload {
  bootstrapCache?: DynamicRecord | null;
  cachedTopics?: BridgeCachedTopicPayload[];
  machineId?: string | null;
  tagTopics?: any;
  [key: string]: unknown;
}

export type DeviceMapEntry = [number, DeviceRegistration];

export function getCachedPollingTagCount(payload: BridgeCachePayload | null): number {
  const value = payload?.bootstrapCache?.cachedPollingTagCount;

  return typeof value === "number" ? value : 0;
}

export function getTagTopicsPayload(payload: BridgeCachePayload | null): any {
  if (!payload) {
    return null;
  }

  if (payload.tagTopics !== undefined) {
    return payload.tagTopics;
  }

  return payload.bootstrapCache?.opcuaItems ?? null;
}

export function getTagTopicsCount(payload: BridgeCachePayload | null): number {
  const tagTopics = getTagTopicsPayload(payload);

  if (Array.isArray(tagTopics)) {
    return tagTopics.length;
  }

  if (tagTopics && typeof tagTopics === "object") {
    return Object.keys(tagTopics).length;
  }

  return tagTopics == null ? 0 : 1;
}