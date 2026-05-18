import { defineMachineRegistry } from "@/lib/machine";
import { runTemplateMachineAction } from "@/machines/machine-template/actions/template-actions";
import { resolveTemplateOperationModel } from "@/machines/machine-template/adapters/template-adapters";
import { TemplateOperationScreen } from "@/machines/machine-template/components/template-operation-screen";
import { TemplateDeviceButtonGroup } from "@/machines/machine-template/device-buttons/template-device-buttons";
import { TemplateMachineForm } from "@/machines/machine-template/forms/template-machine-form";

export const machineTemplateRegistry = defineMachineRegistry({
  id: "machine-template",
  label: "Machine Template",
  description: "Template machine registry for machine-specific overrides.",
  match: {
    profile: "machine-template",
  },
  capabilities: ["operation-screen", "custom-device-buttons", "custom-forms"],
  screens: {
    operation: TemplateOperationScreen,
  },
  forms: {
    template: {
      key: "template",
      component: TemplateMachineForm,
    },
  },
  actions: {
    template: {
      key: "template",
      description: "Template machine action wrapper.",
      run: runTemplateMachineAction,
    },
  },
  adapters: {
    operationModel: {
      key: "operationModel",
      description: "Template bridge-to-UI adapter.",
      resolve: resolveTemplateOperationModel,
    },
  },
  deviceButtons: {
    generic: [TemplateDeviceButtonGroup],
  },
});