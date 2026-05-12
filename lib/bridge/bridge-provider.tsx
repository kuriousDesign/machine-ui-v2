"use client";

import {
  BridgeCmds,
  MqttTopics,
} from "@/lib/bridge/sdk-lite";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
} from "react";

import type {
  BridgeCachePayload,
  BridgeCachedTopicPayload,
  BridgeStatusPayload,
  DeviceMapEntry,
  DynamicRecord,
} from "@/lib/bridge/types";
import { useMqttClient } from "@/lib/mqtt/mqtt-client-provider";
import { createBridgeStore } from "@/lib/store/bridge-store";
import { ZustandProvider } from "@/lib/store/zustand-provider";

const MACHINE_HEARTBEAT_TOPIC = "machine/heartbeatplc";
const BRIDGE_STATUS_STALE_AFTER_MS = 5000;
const BASE_TOPICS = [
  MqttTopics.BRIDGE_STATUS,
  MqttTopics.DEVICE_MAP,
  MqttTopics.BRIDGE_CACHE,
];

const CACHE_READY_PUBLISH_MANAGER_STATES = new Set([
  "readyForHmiHydration",
  "polling",
]);

const CACHE_READY_SUPERVISOR_STATES = new Set(["healthy"]);

function getTimestamp(message: { timestamp?: number }) {
  return typeof message.timestamp === "number" ? message.timestamp : null;
}

function isBridgeReadyForCache(payload: BridgeStatusPayload | null | undefined) {
  if (!payload) {
    return false;
  }

  const publishManagerStatus = payload.publishManagerStatus?.trim();
  const supervisorState = payload.supervisorState?.trim().toLowerCase();

  if (publishManagerStatus && CACHE_READY_PUBLISH_MANAGER_STATES.has(publishManagerStatus)) {
    return true;
  }

  if (supervisorState && CACHE_READY_SUPERVISOR_STATES.has(supervisorState)) {
    return true;
  }

  return false;
}

export function BridgeProvider({ children }: { children: ReactNode }) {
  const { brokerUrl, error, isConnected, phase, publish, subscribe } = useMqttClient();
  const storeRef = useRef(createBridgeStore(brokerUrl));
  const subscriptionsRef = useRef(new Map<string, () => void>());
  const initialTopicsRef = useRef<Set<string>>(new Set([MACHINE_HEARTBEAT_TOPIC]));
  const cacheTopicsRef = useRef<Set<string>>(new Set());
  const hasRequestedCacheRef = useRef(false);
  const lastCacheRequestAtRef = useRef<number | null>(null);
  const waitingForCacheEligibilityRef = useRef(false);
  const bridgeReadyRef = useRef(false);

  const syncSubscriptions = useCallback(() => {
    const requiredTopics = new Set<string>([
      ...BASE_TOPICS,
      ...initialTopicsRef.current,
      ...cacheTopicsRef.current,
    ]);
    const addedTopics: string[] = [];

    subscriptionsRef.current.forEach((dispose, topic) => {
      if (!requiredTopics.has(topic)) {
        dispose();
        subscriptionsRef.current.delete(topic);
      }
    });

    requiredTopics.forEach((topic) => {
      if (subscriptionsRef.current.has(topic)) {
        return;
      }

      const dispose = subscribe(topic, (message, recvTopic) => {
        handleTopicMessage(recvTopic, message);
      });

      subscriptionsRef.current.set(topic, dispose);
      addedTopics.push(topic);
    });

    storeRef.current.getState().setActiveSubscriptions(Array.from(requiredTopics));

    return addedTopics;
  }, [subscribe]);

  const publishBridgeCommand = useCallback(
    (cmd: BridgeCmds) => {
      publish(MqttTopics.BRIDGE_CMD, { cmd }, { qos: 1 });
    },
    [publish],
  );

  const restartHydrationCycle = useCallback(
    (requestDeviceMap: boolean) => {
      const store = storeRef.current.getState();

      initialTopicsRef.current = new Set([MACHINE_HEARTBEAT_TOPIC]);
      cacheTopicsRef.current = new Set();
      hasRequestedCacheRef.current = false;
      lastCacheRequestAtRef.current = null;
      waitingForCacheEligibilityRef.current = true;
      bridgeReadyRef.current = false;
      store.clearHydratedData();
      syncSubscriptions();

      if (requestDeviceMap && isConnected) {
        publishBridgeCommand(BridgeCmds.CONNECT);
      }
    },
    [isConnected, publishBridgeCommand, syncSubscriptions],
  );

  const requestCache = useCallback(() => {
    const now = Date.now();

    if (!isConnected) {
      return;
    }

    if (lastCacheRequestAtRef.current && now - lastCacheRequestAtRef.current < 500) {
      return;
    }

    hasRequestedCacheRef.current = true;
    waitingForCacheEligibilityRef.current = false;
    lastCacheRequestAtRef.current = now;
    storeRef.current.getState().markCacheRequest(now);
    publishBridgeCommand(BridgeCmds.GET_CACHE);
  }, [isConnected, publishBridgeCommand]);

  const maybeRequestCache = useCallback(() => {
    if (!isConnected || hasRequestedCacheRef.current) {
      return;
    }

    const state = storeRef.current.getState();
    const hasDeviceMap = state.deviceMap.orderedIds.length > 0;

    if (!hasDeviceMap) {
      waitingForCacheEligibilityRef.current = true;
      return;
    }

    if (!isBridgeReadyForCache(state.bridgeStatus.payload)) {
      waitingForCacheEligibilityRef.current = true;
      return;
    }

    requestCache();
  }, [isConnected, requestCache]);

  const handleTopicMessage = useEffectEvent(
    (
      topic: string,
      message: {
        payload: unknown;
        timestamp?: number;
      },
    ) => {
      const receivedAt = Date.now();
      const timestamp = getTimestamp(message);
      const source = topic === MqttTopics.BRIDGE_CACHE ? "cache" : "live";
      const store = storeRef.current.getState();

      store.upsertTopicMessage({
        payload: message.payload,
        receivedAt,
        source,
        timestamp,
        topic,
      });

      if (topic === MqttTopics.BRIDGE_STATUS) {
        const payload = message.payload as BridgeStatusPayload;
        const bridgeReady = isBridgeReadyForCache(payload);
        const hasHydratedState =
          store.deviceMap.orderedIds.length > 0 ||
          store.cache.payload !== null ||
          Object.keys(store.topics).length > 0;

        store.setBridgeStatus(payload, receivedAt);

        if (!bridgeReady) {
          if (bridgeReadyRef.current || hasRequestedCacheRef.current || hasHydratedState) {
            restartHydrationCycle(true);
          }
          return;
        }

        if (!bridgeReadyRef.current) {
          bridgeReadyRef.current = true;

          if (store.deviceMap.orderedIds.length === 0) {
            publishBridgeCommand(BridgeCmds.CONNECT);
          }
        }

        if (waitingForCacheEligibilityRef.current || !hasRequestedCacheRef.current) {
          maybeRequestCache();
        }
        return;
      }

      if (topic === MqttTopics.DEVICE_MAP && Array.isArray(message.payload)) {
        const entries = message.payload as DeviceMapEntry[];

        store.setDeviceMap(entries, receivedAt);
        maybeRequestCache();
        return;
      }

      if (topic === MqttTopics.BRIDGE_CACHE) {
        const payload = message.payload as BridgeCachePayload;
        const bootstrapCache = payload.bootstrapCache as DynamicRecord | null | undefined;
        const rawItems = bootstrapCache?.opcuaItems;
        const cachedTopics = Array.isArray(payload.cachedTopics) ? payload.cachedTopics : [];
        const discoveredTopics = new Set(
          [
            ...(Array.isArray(rawItems)
              ? rawItems
                  .map((item) => {
                    if (!item || typeof item !== "object") {
                      return null;
                    }

                    const mqttTopic = (item as DynamicRecord).mqttTopic;

                    return typeof mqttTopic === "string" ? mqttTopic : null;
                  })
                  .filter((mqttTopic): mqttTopic is string => Boolean(mqttTopic))
              : []),
            ...cachedTopics.map((item) => item.topic),
          ],
        );

        cachedTopics.forEach((cachedTopic: BridgeCachedTopicPayload) => {
          store.upsertTopicMessage({
            payload: cachedTopic.payload,
            receivedAt,
            source: "cache",
            timestamp: cachedTopic.timestamp,
            topic: cachedTopic.topic,
          });
        });

        store.setCacheSnapshot(payload, receivedAt);
        cacheTopicsRef.current = discoveredTopics;
        waitingForCacheEligibilityRef.current = false;
        syncSubscriptions();
      }
    },
  );

  useEffect(() => {
    syncSubscriptions();

    return () => {
      subscriptionsRef.current.forEach((dispose) => dispose());
      subscriptionsRef.current.clear();
    };
  }, [syncSubscriptions]);

  useEffect(() => {
    storeRef.current.getState().setConnection({
      brokerUrl,
      error,
      isConnected,
      phase,
    });
  }, [brokerUrl, error, isConnected, phase]);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const timer = window.setInterval(() => {
      const state = storeRef.current.getState();
      const bridgeUpdatedAt = state.bridgeStatus.updatedAt;

      if (!bridgeUpdatedAt) {
        return;
      }

      if (Date.now() - bridgeUpdatedAt <= BRIDGE_STATUS_STALE_AFTER_MS) {
        return;
      }

      if (
        bridgeReadyRef.current ||
        hasRequestedCacheRef.current ||
        state.deviceMap.orderedIds.length > 0 ||
        state.cache.payload !== null
      ) {
        restartHydrationCycle(false);
      }
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isConnected, restartHydrationCycle]);

  useEffect(() => {
    if (!isConnected) {
      initialTopicsRef.current = new Set([MACHINE_HEARTBEAT_TOPIC]);
      cacheTopicsRef.current = new Set();
      hasRequestedCacheRef.current = false;
      lastCacheRequestAtRef.current = null;
      waitingForCacheEligibilityRef.current = false;
      bridgeReadyRef.current = false;
      storeRef.current.getState().clearRuntimeData();
      syncSubscriptions();
      return;
    }

    syncSubscriptions();
    publishBridgeCommand(BridgeCmds.CONNECT);
    waitingForCacheEligibilityRef.current = true;
  }, [isConnected, publishBridgeCommand, syncSubscriptions]);

  return <ZustandProvider store={storeRef.current}>{children}</ZustandProvider>;
}