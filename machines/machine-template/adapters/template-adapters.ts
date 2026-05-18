import type { MachineRuntimeContext } from "@/lib/machine";

export function resolveTemplateOperationModel(
  input: unknown,
  context: MachineRuntimeContext,
) {
  return {
    context,
    raw: input,
  };
}