"use client";

import { Chip } from "@heroui/react";

import { siteConfig } from "@/config/site";
import { NavMenu } from "@/components/layout/nav-menu";

export function SiteHeader({
  machineId,
  runtimeLabel,
}: {
  machineId: string | null;
  runtimeLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <NavMenu adminItems={siteConfig.adminNavItems} items={siteConfig.navItems} />

        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--muted)]">Machine UI</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">V2 Operator Shell</h1>
            <span className="rounded-full border border-[var(--border)] bg-[var(--accent-soft)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--accent-soft-foreground)]">
              {runtimeLabel}
            </span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--muted-surface)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground-strong)]">
              {machineId ?? "No machine"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Chip variant="soft">{runtimeLabel}</Chip>
        <Chip variant="soft">{machineId ?? "No machine"}</Chip>
      </div>
    </div>
  );
}