"use client";

import type { IClientPublishOptions, MqttClient } from "mqtt";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import mqtt from "mqtt";

import { getMqttBrowserConfig } from "@/lib/mqtt/config";

type MqttMessageEnvelope = {
  payload: unknown;
  timestamp?: number;
};

type MqttConnectionPhase =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "offline"
  | "error";

type TopicHandler = (message: MqttMessageEnvelope, topic: string) => void;

interface MqttClientContextValue {
  brokerUrl: string;
  error: string | null;
  isConnected: boolean;
  phase: MqttConnectionPhase;
  publish: (topic: string, payload: unknown, options?: IClientPublishOptions) => void;
  subscribe: (topic: string, handler: TopicHandler) => () => void;
}

const MqttClientContext = createContext<MqttClientContextValue | undefined>(undefined);

function parseEnvelope(topic: string, message: Uint8Array): MqttMessageEnvelope | null {
  try {
    return JSON.parse(Buffer.from(message).toString()) as MqttMessageEnvelope;
  } catch (error) {
    console.error(`[MQTT] Failed to parse topic ${topic}:`, error);

    return null;
  }
}

export function MqttClientProvider({ children }: { children: React.ReactNode }) {
  const { brokerUrl, options } = useMemo(() => getMqttBrowserConfig(), []);
  const [phase, setPhase] = useState<MqttConnectionPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<MqttClient | null>(null);
  const handlersRef = useRef<Map<string, Set<TopicHandler>>>(new Map());
  const subscriptionCountsRef = useRef<Map<string, number>>(new Map());

  const subscribeTopic = useCallback((topic: string) => {
    const client = clientRef.current;

    if (!client?.connected) {
      return;
    }

    client.subscribe(topic, { qos: 0 }, (subscribeError) => {
      if (subscribeError) {
        console.error(`[MQTT] Failed to subscribe to ${topic}:`, subscribeError);
      }
    });
  }, []);

  useEffect(() => {
    setPhase("connecting");
    const client = mqtt.connect(brokerUrl, options);
    clientRef.current = client;

    client.on("connect", () => {
      setPhase("connected");
      setError(null);
      subscriptionCountsRef.current.forEach((_count, topic) => {
        subscribeTopic(topic);
      });
    });

    client.on("reconnect", () => {
      setPhase("reconnecting");
      setError(null);
    });

    client.on("close", () => {
      setPhase("offline");
    });

    client.on("offline", () => {
      setPhase("offline");
    });

    client.on("error", (clientError) => {
      setError(clientError.message);
      setPhase("error");
    });

    client.on("message", (topic, message) => {
      const parsed = parseEnvelope(topic, message);

      if (!parsed) {
        return;
      }

      handlersRef.current.get(topic)?.forEach((handler) => {
        handler(parsed, topic);
      });
    });

    return () => {
      client.end(true);
      clientRef.current = null;
    };
  }, [brokerUrl, options, subscribeTopic]);

  const subscribe = useCallback(
    (topic: string, handler: TopicHandler) => {
      const nextCount = (subscriptionCountsRef.current.get(topic) || 0) + 1;
      const handlers = handlersRef.current.get(topic) || new Set<TopicHandler>();

      handlers.add(handler);
      handlersRef.current.set(topic, handlers);
      subscriptionCountsRef.current.set(topic, nextCount);

      if (nextCount === 1) {
        subscribeTopic(topic);
      }

      return () => {
        const currentHandlers = handlersRef.current.get(topic);
        const currentCount = subscriptionCountsRef.current.get(topic) || 0;

        currentHandlers?.delete(handler);
        if (currentHandlers && currentHandlers.size === 0) {
          handlersRef.current.delete(topic);
        }

        if (currentCount <= 1) {
          subscriptionCountsRef.current.delete(topic);
          const client = clientRef.current;

          if (client?.connected) {
            client.unsubscribe(topic, (unsubscribeError) => {
              if (unsubscribeError) {
                console.error(`[MQTT] Failed to unsubscribe from ${topic}:`, unsubscribeError);
              }
            });
          }
        } else {
          subscriptionCountsRef.current.set(topic, currentCount - 1);
        }
      };
    },
    [subscribeTopic],
  );

  const publish = useCallback(
    (topic: string, payload: unknown, publishOptions?: IClientPublishOptions) => {
      const client = clientRef.current;

      if (!client?.connected) {
        return;
      }

      const message = JSON.stringify({
        payload,
        timestamp: Date.now(),
      });

      client.publish(topic, message, publishOptions);
    },
    [],
  );

  const value = useMemo<MqttClientContextValue>(
    () => ({
      brokerUrl,
      error,
      isConnected: phase === "connected",
      phase,
      publish,
      subscribe,
    }),
    [brokerUrl, error, phase, publish, subscribe],
  );

  return <MqttClientContext.Provider value={value}>{children}</MqttClientContext.Provider>;
}

export function useMqttClient() {
  const context = useContext(MqttClientContext);

  if (!context) {
    throw new Error("useMqttClient must be used within MqttClientProvider");
  }

  return context;
}