import type { MachineActionArgs } from "@/lib/machine";

export async function runTemplateMachineAction(args: MachineActionArgs) {
  return {
    success: true,
    args,
  };
}