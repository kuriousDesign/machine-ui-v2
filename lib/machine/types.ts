import type { ComponentType } from "react";

export type MachineMatchCriteria = {
  bridgeMachineId?: string | null;
  cellType?: string | null;
  profile?: string | null;
};

export type MachineRuntimeContext = {
  bridgeMachineId?: string | null;
  cellType?: string | null;
  profile?: string | null;
  capabilities?: string[];
};

export type MachineScreenProps = Record<string, unknown>;
export type MachineFormValue = Record<string, unknown>;
export type MachineActionArgs = Record<string, unknown>;
export type MachineActionResult = unknown;
export type MachineAdapterOutput = unknown;

export type MachineComponent<Props extends MachineScreenProps = MachineScreenProps> =
  ComponentType<Props>;

export type MachineScreenRegistry = Record<string, MachineComponent | undefined>;

export type MachineFormDefinition<Value extends MachineFormValue = MachineFormValue> = {
  key: string;
  component: MachineComponent<{
    initialValue?: Partial<Value>;
    machineId: string;
    onSubmit?: (value: Value) => void | Promise<void>;
  }>;
  normalize?: (input: unknown) => Partial<Value>;
  validate?: (value: Partial<Value>) => Record<string, string> | null;
};

export type MachineActionDefinition<
  Args extends MachineActionArgs = MachineActionArgs,
  Result = MachineActionResult,
> = {
  key: string;
  description?: string;
  run: (args: Args) => Result | Promise<Result>;
};

export type MachineAdapterDefinition<Output = MachineAdapterOutput> = {
  key: string;
  description?: string;
  resolve: (input: unknown, context: MachineRuntimeContext) => Output;
};

export type MachineDeviceButtonRegistry = Record<string, MachineComponent[] | undefined>;

export type MachineRegistry = {
  id: string;
  label: string;
  description?: string;
  match?: MachineMatchCriteria;
  capabilities?: string[];
  screens?: MachineScreenRegistry;
  forms?: Record<string, MachineFormDefinition | undefined>;
  actions?: Record<string, MachineActionDefinition | undefined>;
  adapters?: Record<string, MachineAdapterDefinition | undefined>;
  deviceButtons?: MachineDeviceButtonRegistry;
};