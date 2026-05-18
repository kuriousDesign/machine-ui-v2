import type { MachineScreenProps } from "@/lib/machine";

export function TemplateOperationScreen({
  title = "Machine Template Operation",
}: MachineScreenProps & { title?: string }) {
  return (
    <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
        Machine override
      </p>
      <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
        {String(title)}
      </h2>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
        Replace this component with the machine-specific operation screen.
      </p>
    </div>
  );
}