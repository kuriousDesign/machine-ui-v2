import type { MachineFormValue } from "@/lib/machine";

export function TemplateMachineForm({
  machineId,
  onSubmit,
}: {
  initialValue?: Partial<MachineFormValue>;
  machineId: string;
  onSubmit?: (value: MachineFormValue) => void | Promise<void>;
}) {
  return (
    <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
        Machine form template
      </p>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
        This is a placeholder for machine-specific form logic for machine
        <span className="font-mono"> {machineId}</span>.
      </p>
      {onSubmit ? (
        <button
          className="mt-4 rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
          onClick={() => {
            void onSubmit({ machineId });
          }}
          type="button"
        >
          Submit template form
        </button>
      ) : null}
    </div>
  );
}