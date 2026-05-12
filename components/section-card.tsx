import type { ReactNode } from "react";

export function SectionCard({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[28px] border border-[var(--border)] bg-[var(--surface-strong)] p-5 shadow-[var(--shadow)] ${className}`}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--foreground)]">{title}</h2>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{description}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}