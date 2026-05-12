import { createStore } from "zustand/vanilla";

import {
  buildFullTopicPath,
  type Device,
  type DeviceCfg,
  type DeviceLogData,
  type DeviceRegistration,
  type DeviceStatus,
} from "@/lib/bridge/sdk-lite";
import type {
  BridgeCachePayload,
  BridgeStatusPayload,
  DeviceMapEntry,
} from "@/lib/bridge/types";

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
  subscribedTopics: string[];
  topicPrefix: string | null;
  topics: TopicMessage[];
}

export interface DeviceRuntimeState extends Partial<Device> {
  cfgMessage: TopicMessage | null;
  isMessage: TopicMessage | null;
  lastSeenAt: number | null;
  logMessage: TopicMessage | null;
  stsMessage: TopicMessage | null;
  topicPrefix: string | null;
}

export interface MachineScopedState {
  topics: TopicMessage[];
}

const EMPTY_TOPICS: TopicMessage[] = [];
const EMPTY_TOPIC_PATHS: string[] = [];

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
  cfgMessage: null,
  is: undefined,
  isMessage: null,
  lastSeenAt: null,
  logMessage: null,
  stsMessage: null,
  topicPrefix: null,
};

const deviceStateCache = new Map<
  number,
  {
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

export function selectDeviceMetaData(state: BridgeStoreState, deviceId: number): DeviceScopedState {
  const device = state.deviceMap.byId[deviceId] ?? null;
  const topicPrefix = state.deviceMap.topicPrefixes[deviceId] ?? null;
  const cached = deviceStateCache.get(deviceId);

  if (
    cached &&
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
      subscribedTopics: EMPTY_TOPIC_PATHS,
      topicPrefix: null,
      topics: EMPTY_TOPICS,
    };

    deviceStateCache.set(deviceId, {
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

  const result = {
    device,
    subscribedTopics: subscribedTopics.length > 0 ? subscribedTopics.slice().sort((left, right) => left.localeCompare(right)) : EMPTY_TOPIC_PATHS,
    topicPrefix,
    topics: topics.length > 0 ? sortMessages(topics) : EMPTY_TOPICS,
  };

  deviceStateCache.set(deviceId, {
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
  const isMessage = getTopicMessage(state, `${topicPrefix}/is`);
  const stsMessage = getTopicMessage(state, `${topicPrefix}/sts`);
  const logMessage = getTopicMessage(state, `${topicPrefix}/log`);

  const result = {
    cfg: getTopicPayload<DeviceCfg>(cfgMessage) ?? undefined,
    cfgMessage,
    errors: undefined,
    warnings: undefined,
    is: getTopicPayload<DeviceStatus>(isMessage),
    isMessage,
    lastSeenAt: getLastSeenAt([cfgMessage, isMessage, stsMessage, logMessage]),
    log: getTopicPayload<DeviceLogData>(logMessage) ?? undefined,
    logMessage,
    registration: device ?? undefined,
    sts: getTopicPayload<unknown>(stsMessage) ?? undefined,
    stsMessage,
    topicPrefix,
  };

  deviceRuntimeStateCache.set(deviceId, {
    deviceRef: device,
    result,
    topicPrefix,
    topicsRef: state.topics,
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