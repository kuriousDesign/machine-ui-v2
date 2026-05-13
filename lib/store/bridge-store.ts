import { createStore } from "zustand/vanilla";

import {
  buildFullTopicPath,
  type Device,
  type DeviceCfg,
  type DeviceFaultData,
  type DeviceLogData,
  type DeviceRegistration,
  type DeviceStatus,
} from "@/lib/bridge/sdk-lite";
import type {
  BridgeCachePayload,
  BridgeStatusPayload,
  DeviceMapEntry,
} from "@/lib/bridge/types";
import { getTagTopicsPayload } from "@/lib/bridge/types";

export type MqttPhase =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "offline"
  | "error";

export interface TopicMessage {
  payload: unknown;
  receivedAt: number;
  source: "cache" | "live";
  timestamp: number | null;
  topic: string;
}

export interface TopicMessageSummary {
  receivedAt: number;
  source: TopicMessage["source"];
}

export type DeviceRuntimeTopicSummaryKey =
  | "apiOpcuaHmiReq"
  | "apiOpcuaHmiResp"
  | "apiOpcuaInternalReq"
  | "apiOpcuaInternalResp"
  | "cfg"
  | "errors"
  | "execMethod"
  | "is"
  | "log"
  | "mutedChildrenArray"
  | "process"
  | "script"
  | "sts"
  | "task"
  | "warnings";

export type DeviceRuntimeTopicSummaries = Partial<Record<DeviceRuntimeTopicSummaryKey, TopicMessageSummary>>;

export interface BridgeStoreState {
  cache: {
    payload: BridgeCachePayload | null;
    updatedAt: number | null;
  };
  connection: {
    brokerUrl: string;
    error: string | null;
    isConnected: boolean;
    lastCacheRequestAt: number | null;
    phase: MqttPhase;
  };
  bridgeStatus: {
    payload: BridgeStatusPayload | null;
    updatedAt: number | null;
  };
  deviceMap: {
    byId: Record<number, DeviceRegistration>;
    orderedIds: number[];
    topicPrefixes: Record<number, string>;
    updatedAt: number | null;
  };
  subscriptions: {
    activeTopics: string[];
  };
  topics: Record<string, TopicMessage>;
  clearRuntimeData: () => void;
  clearHydratedData: () => void;
  markCacheRequest: (requestedAt: number) => void;
  setActiveSubscriptions: (topics: string[]) => void;
  setBridgeStatus: (payload: BridgeStatusPayload, updatedAt: number) => void;
  setCacheSnapshot: (payload: BridgeCachePayload, updatedAt: number) => void;
  setConnection: (connection: {
    brokerUrl: string;
    error: string | null;
    isConnected: boolean;
    phase: MqttPhase;
  }) => void;
  setDeviceMap: (entries: DeviceMapEntry[], updatedAt: number) => void;
  upsertTopicMessage: (params: {
    payload: unknown;
    receivedAt: number;
    source: "cache" | "live";
    timestamp: number | null;
    topic: string;
  }) => void;
}

export interface DeviceScopedState {
  device: DeviceRegistration | null;
  lastSeenAt: number | null;
  runtimeTopicSummaries: DeviceRuntimeTopicSummaries;
  subscribedTopics: string[];
  tagTopics: Record<string, unknown>[];
  topicPrefix: string | null;
  topics: TopicMessage[];
}

export interface DeviceRuntimeState extends Partial<Device> {
}

export interface DeviceComprehensiveState {
  deviceId: number;
  meta: DeviceScopedState;
  runtime: DeviceRuntimeState;
}

export interface MachineScopedState {
  topics: TopicMessage[];
}

const EMPTY_TOPICS: TopicMessage[] = [];
const EMPTY_TOPIC_PATHS: string[] = [];
const EMPTY_TAG_TOPICS: Record<string, unknown>[] = [];
const EMPTY_RUNTIME_TOPIC_SUMMARIES: DeviceRuntimeTopicSummaries = {};

const machineStateCache: {
  result: MachineScopedState;
  topicPrefixesRef: BridgeStoreState["deviceMap"]["topicPrefixes"] | null;
  topicsRef: BridgeStoreState["topics"] | null;
} = {
  result: { topics: EMPTY_TOPICS },
  topicPrefixesRef: null,
  topicsRef: null,
};

const EMPTY_DEVICE_RUNTIME_STATE: DeviceRuntimeState = {
  cfg: undefined,
  errors: undefined,
  warnings: undefined,
  registration: undefined,
  mutedChildrenArray: undefined,
  execMethod: undefined,
  task: undefined,
  process: undefined,
  script: undefined,
  connectionStatus: undefined,
  apiOpcua: undefined,
  log: undefined,
  sts: undefined,
  inputs: undefined,
  outputs: undefined,
  is: undefined,
};

const deviceStateCache = new Map<
  number,
  {
    cachePayloadRef: BridgeStoreState["cache"]["payload"] | null;
    deviceRef: DeviceRegistration | null;
    result: DeviceScopedState;
    subscribedTopicsRef: BridgeStoreState["subscriptions"]["activeTopics"] | null;
    topicPrefix: string | null;
    topicsRef: BridgeStoreState["topics"] | null;
  }
>();

const deviceRuntimeStateCache = new Map<
  number,
  {
    deviceRef: DeviceRegistration | null;
    result: DeviceRuntimeState;
    topicPrefix: string | null;
    topicsRef: BridgeStoreState["topics"] | null;
  }
>();

const deviceComprehensiveStateCache = new Map<
  number,
  {
    metaRef: DeviceScopedState | null;
    result: DeviceComprehensiveState;
    runtimeRef: DeviceRuntimeState | null;
  }
>();

function initialState(brokerUrl: string): Omit<
  BridgeStoreState,
  | "clearRuntimeData"
  | "clearHydratedData"
  | "markCacheRequest"
  | "setActiveSubscriptions"
  | "setBridgeStatus"
  | "setCacheSnapshot"
  | "setConnection"
  | "setDeviceMap"
  | "upsertTopicMessage"
> {
  return {
    cache: {
      payload: null,
      updatedAt: null,
    },
    connection: {
      brokerUrl,
      error: null,
      isConnected: false,
      lastCacheRequestAt: null,
      phase: "idle",
    },
    bridgeStatus: {
      payload: null,
      updatedAt: null,
    },
    deviceMap: {
      byId: {},
      orderedIds: [],
      topicPrefixes: {},
      updatedAt: null,
    },
    subscriptions: {
      activeTopics: [],
    },
    topics: {},
  };
}

export function createBridgeStore(brokerUrl: string) {
  return createStore<BridgeStoreState>()((set) => ({
    ...initialState(brokerUrl),
    clearRuntimeData: () =>
      set((state) => ({
        cache: { payload: null, updatedAt: null },
        bridgeStatus: { payload: null, updatedAt: null },
        connection: {
          ...state.connection,
          lastCacheRequestAt: null,
        },
        deviceMap: {
          byId: {},
          orderedIds: [],
          topicPrefixes: {},
          updatedAt: null,
        },
        topics: {},
      })),
    clearHydratedData: () =>
      set((state) => ({
        cache: { payload: null, updatedAt: null },
        connection: {
          ...state.connection,
          lastCacheRequestAt: null,
        },
        deviceMap: {
          byId: {},
          orderedIds: [],
          topicPrefixes: {},
          updatedAt: null,
        },
        topics: {},
      })),
    markCacheRequest: (requestedAt) =>
      set((state) => ({
        connection: {
          ...state.connection,
          lastCacheRequestAt: requestedAt,
        },
      })),
    setActiveSubscriptions: (topics) =>
      set(() => ({
        subscriptions: {
          activeTopics: Array.from(new Set(topics)).sort((left, right) => left.localeCompare(right)),
        },
      })),
    setBridgeStatus: (payload, updatedAt) =>
      set(() => ({
        bridgeStatus: {
          payload,
          updatedAt,
        },
      })),
    setCacheSnapshot: (payload, updatedAt) =>
      set(() => ({
        cache: {
          payload,
          updatedAt,
        },
      })),
    setConnection: (connection) =>
      set((state) => ({
        connection: {
          ...state.connection,
          ...connection,
        },
      })),
    setDeviceMap: (entries, updatedAt) =>
      set(() => {
        const byId: Record<number, DeviceRegistration> = {};
        const topicPrefixes: Record<number, string> = {};
        const deviceMap = new Map<number, DeviceRegistration>(entries);

        entries.forEach(([deviceId, device]) => {
          byId[deviceId] = device;
          topicPrefixes[deviceId] = buildFullTopicPath(device, deviceMap);
        });

        return {
          deviceMap: {
            byId,
            orderedIds: entries.map(([deviceId]) => deviceId).sort((left, right) => left - right),
            topicPrefixes,
            updatedAt,
          },
        };
      }),
    upsertTopicMessage: ({ payload, receivedAt, source, timestamp, topic }) =>
      set((state) => ({
        topics: {
          ...state.topics,
          [topic]: {
            payload,
            receivedAt,
            source,
            timestamp,
            topic,
          },
        },
      })),
  }));
}

export type BridgeStore = ReturnType<typeof createBridgeStore>;

function sortMessages(messages: TopicMessage[]) {
  return messages.slice().sort((left, right) => left.topic.localeCompare(right.topic));
}

function toTopicMessageSummary(message: TopicMessage | null): TopicMessageSummary | undefined {
  if (!message) {
    return undefined;
  }

  return {
    receivedAt: message.receivedAt,
    source: message.source,
  };
}

function toTagTopicEntries(tagTopics: unknown): Record<string, unknown>[] {
  if (!tagTopics) {
    return EMPTY_TAG_TOPICS;
  }

  if (Array.isArray(tagTopics)) {
    return tagTopics.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object");
  }

  if (typeof tagTopics === "object") {
    const record = tagTopics as Record<string, unknown>;

    if (Array.isArray(record.items)) {
      return record.items.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object");
    }

    return Object.entries(record).map(([key, value]) => {
      if (value && typeof value === "object") {
        return { key, ...(value as Record<string, unknown>) };
      }

      return { key, value };
    });
  }

  return EMPTY_TAG_TOPICS;
}

function getTagTopicString(entry: Record<string, unknown>, key: string): string | null {
  const value = entry[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function selectDeviceMetaData(state: BridgeStoreState, deviceId: number): DeviceScopedState {
  const device = state.deviceMap.byId[deviceId] ?? null;
  const topicPrefix = state.deviceMap.topicPrefixes[deviceId] ?? null;
  const cached = deviceStateCache.get(deviceId);

  if (
    cached &&
    cached.cachePayloadRef === state.cache.payload &&
    cached.deviceRef === device &&
    cached.subscribedTopicsRef === state.subscriptions.activeTopics &&
    cached.topicPrefix === topicPrefix &&
    cached.topicsRef === state.topics
  ) {
    return cached.result;
  }

  if (!topicPrefix) {
    const result = {
      device,
      lastSeenAt: null,
      runtimeTopicSummaries: EMPTY_RUNTIME_TOPIC_SUMMARIES,
      subscribedTopics: EMPTY_TOPIC_PATHS,
      tagTopics: EMPTY_TAG_TOPICS,
      topicPrefix: null,
      topics: EMPTY_TOPICS,
    };

    deviceStateCache.set(deviceId, {
      cachePayloadRef: state.cache.payload,
      deviceRef: device,
      result,
      subscribedTopicsRef: state.subscriptions.activeTopics,
      topicPrefix: null,
      topicsRef: state.topics,
    });

    return result;
  }

  const subscribedTopics = state.subscriptions.activeTopics.filter((topic) => {
    return topic === topicPrefix || topic.startsWith(`${topicPrefix}/`);
  });

  const topics = Object.values(state.topics).filter((topicMessage) => {
    return topicMessage.topic === topicPrefix || topicMessage.topic.startsWith(`${topicPrefix}/`);
  });
  const runtimeTopicSummaries = {
    cfg: toTopicMessageSummary(state.topics[`${topicPrefix}/cfg`] ?? null),
    errors: toTopicMessageSummary(state.topics[`${topicPrefix}/errors`] ?? null),
    warnings: toTopicMessageSummary(state.topics[`${topicPrefix}/warnings`] ?? null),
    mutedChildrenArray: toTopicMessageSummary(state.topics[`${topicPrefix}/mutedchildrenarray`] ?? null),
    execMethod: toTopicMessageSummary(state.topics[`${topicPrefix}/execmethod`] ?? null),
    task: toTopicMessageSummary(state.topics[`${topicPrefix}/task`] ?? null),
    process: toTopicMessageSummary(state.topics[`${topicPrefix}/process`] ?? null),
    script: toTopicMessageSummary(state.topics[`${topicPrefix}/script`] ?? null),
    is: toTopicMessageSummary(state.topics[`${topicPrefix}/is`] ?? null),
    sts: toTopicMessageSummary(state.topics[`${topicPrefix}/sts`] ?? null),
    log: toTopicMessageSummary(state.topics[`${topicPrefix}/log`] ?? null),
    apiOpcuaHmiReq: toTopicMessageSummary(state.topics[`${topicPrefix}/apiopcua/hmireq`] ?? null),
    apiOpcuaHmiResp: toTopicMessageSummary(state.topics[`${topicPrefix}/apiopcua/hmiresp`] ?? null),
    apiOpcuaInternalReq: toTopicMessageSummary(state.topics[`${topicPrefix}/apiopcua/internalreq`] ?? null),
    apiOpcuaInternalResp: toTopicMessageSummary(state.topics[`${topicPrefix}/apiopcua/internalresp`] ?? null),
  } satisfies DeviceRuntimeTopicSummaries;
  const tagTopicEntries = toTagTopicEntries(getTagTopicsPayload(state.cache.payload));
  const tagTopics = tagTopicEntries
    .filter((entry) => {
      const mqttTopic = getTagTopicString(entry, "mqttTopic") ?? getTagTopicString(entry, "topic");
      return mqttTopic ? mqttTopic === topicPrefix || mqttTopic.startsWith(`${topicPrefix}/`) : false;
    })
    .sort((left, right) => {
      const leftTopic = getTagTopicString(left, "mqttTopic") ?? getTagTopicString(left, "topic") ?? "";
      const rightTopic = getTagTopicString(right, "mqttTopic") ?? getTagTopicString(right, "topic") ?? "";
      return leftTopic.localeCompare(rightTopic);
    });
  const lastSeenAt = getLastSeenAt(topics);

  const result = {
    device,
    lastSeenAt,
    runtimeTopicSummaries,
    subscribedTopics: subscribedTopics.length > 0 ? subscribedTopics.slice().sort((left, right) => left.localeCompare(right)) : EMPTY_TOPIC_PATHS,
    tagTopics: tagTopics.length > 0 ? tagTopics : EMPTY_TAG_TOPICS,
    topicPrefix,
    topics: topics.length > 0 ? sortMessages(topics) : EMPTY_TOPICS,
  };

  deviceStateCache.set(deviceId, {
    cachePayloadRef: state.cache.payload,
    deviceRef: device,
    result,
    subscribedTopicsRef: state.subscriptions.activeTopics,
    topicPrefix,
    topicsRef: state.topics,
  });

  return result;
}

function getTopicMessage(state: BridgeStoreState, topic: string | null): TopicMessage | null {
  if (!topic) {
    return null;
  }

  return state.topics[topic] ?? null;
}

function getTopicPayload<T>(message: TopicMessage | null): T | undefined {
  return message?.payload ? (message.payload as T) : undefined;
}

function getLastSeenAt(messages: Array<TopicMessage | null>): number | null {
  return messages.reduce<number | null>((latest, message) => {
    if (!message) {
      return latest;
    }

    if (latest === null || message.receivedAt > latest) {
      return message.receivedAt;
    }

    return latest;
  }, null);
}

export function selectDeviceState(state: BridgeStoreState, deviceId: number): DeviceRuntimeState {
  const device = state.deviceMap.byId[deviceId] ?? null;
  const topicPrefix = state.deviceMap.topicPrefixes[deviceId] ?? null;
  const cached = deviceRuntimeStateCache.get(deviceId);

  if (
    cached &&
    cached.deviceRef === device &&
    cached.topicPrefix === topicPrefix &&
    cached.topicsRef === state.topics
  ) {
    return cached.result;
  }

  if (!topicPrefix) {
    const result = {
      ...EMPTY_DEVICE_RUNTIME_STATE,
      device,
    };

    deviceRuntimeStateCache.set(deviceId, {
      deviceRef: device,
      result,
      topicPrefix: null,
      topicsRef: state.topics,
    });

    return result;
  }

  const cfgMessage = getTopicMessage(state, `${topicPrefix}/cfg`);
  const errorsMessage = getTopicMessage(state, `${topicPrefix}/errors`);
  const warningsMessage = getTopicMessage(state, `${topicPrefix}/warnings`);
  const mutedChildrenArrayMessage = getTopicMessage(state, `${topicPrefix}/mutedchildrenarray`);
  const execMethodMessage = getTopicMessage(state, `${topicPrefix}/execmethod`);
  const taskMessage = getTopicMessage(state, `${topicPrefix}/task`);
  const processMessage = getTopicMessage(state, `${topicPrefix}/process`);
  const scriptMessage = getTopicMessage(state, `${topicPrefix}/script`);
  const isMessage = getTopicMessage(state, `${topicPrefix}/is`);
  const stsMessage = getTopicMessage(state, `${topicPrefix}/sts`);
  const logMessage = getTopicMessage(state, `${topicPrefix}/log`);
  const apiOpcuaHmiReqMessage = getTopicMessage(state, `${topicPrefix}/apiopcua/hmireq`);
  const apiOpcuaHmiRespMessage = getTopicMessage(state, `${topicPrefix}/apiopcua/hmiresp`);
  const apiOpcuaInternalReqMessage = getTopicMessage(state, `${topicPrefix}/apiopcua/internalreq`);
  const apiOpcuaInternalRespMessage = getTopicMessage(state, `${topicPrefix}/apiopcua/internalresp`);

  const apiOpcua =
    apiOpcuaHmiReqMessage || apiOpcuaHmiRespMessage || apiOpcuaInternalReqMessage || apiOpcuaInternalRespMessage
      ? {
          hmiReq: getTopicPayload(apiOpcuaHmiReqMessage),
          hmiResp: getTopicPayload(apiOpcuaHmiRespMessage),
          internalReq: getTopicPayload(apiOpcuaInternalReqMessage),
          internalResp: getTopicPayload(apiOpcuaInternalRespMessage),
        }
      : undefined;

  const result = {
    cfg: getTopicPayload<DeviceCfg>(cfgMessage) ?? undefined,
    errors: getTopicPayload<DeviceFaultData>(errorsMessage) ?? undefined,
    warnings: getTopicPayload<DeviceFaultData>(warningsMessage) ?? undefined,
    mutedChildrenArray: getTopicPayload<boolean[]>(mutedChildrenArrayMessage) ?? undefined,
    execMethod: getTopicPayload(execMethodMessage),
    task: getTopicPayload(taskMessage),
    process: getTopicPayload(processMessage),
    script: getTopicPayload(scriptMessage),
    apiOpcua,
    is: getTopicPayload<DeviceStatus>(isMessage),
    log: getTopicPayload<DeviceLogData>(logMessage) ?? undefined,
    registration: device ?? undefined,
    sts: getTopicPayload<unknown>(stsMessage) ?? undefined,
  };

  deviceRuntimeStateCache.set(deviceId, {
    deviceRef: device,
    result,
    topicPrefix,
    topicsRef: state.topics,
  });

  return result;
}

export function selectDeviceComprehensiveState(state: BridgeStoreState, deviceId: number): DeviceComprehensiveState {
  const meta = selectDeviceMetaData(state, deviceId);
  const runtime = selectDeviceState(state, deviceId);
  const cached = deviceComprehensiveStateCache.get(deviceId);

  if (cached && cached.metaRef === meta && cached.runtimeRef === runtime) {
    return cached.result;
  }

  const result = {
    deviceId,
    meta,
    runtime,
  };

  deviceComprehensiveStateCache.set(deviceId, {
    metaRef: meta,
    result,
    runtimeRef: runtime,
  });

  return result;
}

export function selectMachineState(state: BridgeStoreState): MachineScopedState {
  if (
    machineStateCache.topicsRef === state.topics &&
    machineStateCache.topicPrefixesRef === state.deviceMap.topicPrefixes
  ) {
    return machineStateCache.result;
  }

  const devicePrefixes = Object.values(state.deviceMap.topicPrefixes);
  const topics = Object.values(state.topics).filter((topicMessage) => {
    if (!topicMessage.topic.startsWith("machine/")) {
      return false;
    }

    return !devicePrefixes.some((prefix) => {
      return topicMessage.topic === prefix || topicMessage.topic.startsWith(`${prefix}/`);
    });
  });

  machineStateCache.topicsRef = state.topics;
  machineStateCache.topicPrefixesRef = state.deviceMap.topicPrefixes;
  machineStateCache.result = {
    topics: topics.length > 0 ? sortMessages(topics) : EMPTY_TOPICS,
  };

  return machineStateCache.result;
}