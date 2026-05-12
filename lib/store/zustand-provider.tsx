"use client";

import { createContext, useContext } from "react";
import { useStore } from "zustand";
import type { StoreApi } from "zustand/vanilla";

import {
  type BridgeStore,
  type BridgeStoreState,
  type DeviceRuntimeState,
  type DeviceScopedState,
  type MachineScopedState,
  selectDeviceMetaData,
  selectDeviceState,
  selectMachineState,
} from "@/lib/store/bridge-store";

const BridgeStoreContext = createContext<StoreApi<BridgeStoreState> | null>(null);

export function ZustandProvider({
  children,
  store,
}: {
  children: React.ReactNode;
  store: BridgeStore;
}) {
  return <BridgeStoreContext.Provider value={store}>{children}</BridgeStoreContext.Provider>;
}

export function useBridgeStore<T>(selector: (state: BridgeStoreState) => T): T {
  const store = useContext(BridgeStoreContext);

  if (!store) {
    throw new Error("useBridgeStore must be used within ZustandProvider");
  }

  return useStore(store, selector);
}

export const useBridgeState = useBridgeStore;

export function useDeviceMetaData<T>(
  deviceId: number,
  selector: (state: DeviceScopedState) => T,
): T {
  return useBridgeStore((state) => selector(selectDeviceMetaData(state, deviceId)));
}

export function useDeviceState(deviceId: number): DeviceRuntimeState;
export function useDeviceState<T>(
  deviceId: number,
  selector: (state: DeviceRuntimeState) => T,
): T;

export function useDeviceState<T>(
  deviceId: number,
  selector?: (state: DeviceRuntimeState) => T,
): DeviceRuntimeState | T {
  return useBridgeStore((state) => {
    const deviceState = selectDeviceState(state, deviceId);

    return selector ? selector(deviceState) : deviceState;
  });
}

export function useMachineState<T>(selector: (state: MachineScopedState) => T): T {
  return useBridgeStore((state) => selector(selectMachineState(state)));
}