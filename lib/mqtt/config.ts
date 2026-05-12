import type mqtt from "mqtt";

export interface MqttBrowserConfig {
  brokerUrl: string;
  options: mqtt.IClientOptions;
}

export function getMqttBrowserConfig(): MqttBrowserConfig {
  const brokerType = process.env.NEXT_PUBLIC_MQTT_TYPE ?? "local";
  const localBrokerUrl =
    process.env.NEXT_PUBLIC_MQTT_LOCAL_BROKER_URI ?? "ws://127.0.0.1:9002/mqtt";
  const cloudBrokerUrl = process.env.NEXT_PUBLIC_MQTT_CLOUD_BROKER_URI;
  const brokerUrl = brokerType === "cloud" && cloudBrokerUrl ? cloudBrokerUrl : localBrokerUrl;
  const protocol = brokerUrl.startsWith("wss://") ? "wss" : "ws";

  return {
    brokerUrl,
    options: {
      username: process.env.NEXT_PUBLIC_MQTT_BROKER_USERNAME || undefined,
      password: process.env.NEXT_PUBLIC_MQTT_BROKER_PASSWORD || undefined,
      clean: true,
      connectTimeout: 30000,
      keepalive: 25,
      protocol,
      queueQoSZero: false,
      reconnectOnConnackError: true,
      reconnectPeriod: 3000,
      rejectUnauthorized: protocol === "wss",
    },
  };
}