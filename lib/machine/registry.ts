import type { MachineRegistry, MachineRuntimeContext } from "@/lib/machine/types";

export function defineMachineRegistry<TRegistry extends MachineRegistry>(
  registry: TRegistry,
) {
  return registry;
}

export function createMachineRegistryMap(registries: MachineRegistry[]) {
  return new Map(registries.map((registry) => [registry.id, registry]));
}

export function matchesMachineContext(
  registry: MachineRegistry,
  context: MachineRuntimeContext,
) {
  const match = registry.match;

  if (!match) {
    return true;
  }

  if (
    match.bridgeMachineId != null &&
    match.bridgeMachineId !== context.bridgeMachineId
  ) {
    return false;
  }

  if (match.cellType != null && match.cellType !== context.cellType) {
    return false;
  }

  if (match.profile != null && match.profile !== context.profile) {
    return false;
  }

  return true;
}

export function resolveMachineRegistry(
  registries: MachineRegistry[],
  context: MachineRuntimeContext,
) {
  return registries.find((registry) => matchesMachineContext(registry, context));
}