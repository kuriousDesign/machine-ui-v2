"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@heroui/react";

import type { NavItem } from "@/config/site";
import { useAuxParam } from "@/hooks/use-aux-param";

const GROUP_LABELS: Record<string, string> = {
  operate: "Operate",
  monitor: "Monitor",
  system: "System",
  docs: "Docs",
};

export function NavMenu({
  adminItems,
  items,
}: {
  adminItems?: NavItem[];
  items: NavItem[];
}) {
  const pathname = usePathname();
  const { auxParamValue, setAuxParam } = useAuxParam();
  const [open, setOpen] = useState(false);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, NavItem[]>();

    items.forEach((item) => {
      groups.set(item.group, [...(groups.get(item.group) ?? []), item]);
    });

    return Array.from(groups.entries()).map(([group, groupItems]) => ({
      group,
      items: groupItems,
    }));
  }, [items]);

  return (
    <div className="relative">
      <Button
        isIconOnly
        aria-label="Toggle navigation menu"
        className="border border-[var(--border)] bg-white/60"
        variant="ghost"
        onPress={() => setOpen((current) => !current)}
      >
        <div className="relative h-4 w-4">
          <span className={`absolute left-0 top-[3px] h-0.5 w-4 bg-current transition-transform ${open ? "translate-y-[4px] rotate-45" : ""}`} />
          <span className={`absolute left-0 top-[9px] h-0.5 w-4 bg-current transition-transform ${open ? "-translate-y-[2px] -rotate-45" : ""}`} />
        </div>
      </Button>

      {open ? (
        <>
          <button
            aria-label="Close navigation menu"
            className="fixed inset-0 z-30 cursor-default bg-transparent"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div className="absolute left-0 top-[calc(100%+0.75rem)] z-40 w-[min(28rem,calc(100vw-2rem))] rounded-[28px] border border-[var(--border)] bg-[color:var(--surface-strong)] p-5 shadow-[var(--shadow)] backdrop-blur">
            <div className="space-y-6">
              {groupedItems.map((group) => (
                <div key={group.group} className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                    {GROUP_LABELS[group.group] ?? group.group}
                  </p>
                  <div className="flex flex-col items-start gap-2">
                    {group.items.map((item) => {
                      const isAuxItem = item.panel === "aux";
                      const isActive = isAuxItem ? auxParamValue === item.href : pathname === item.href;

                      return isAuxItem ? (
                        <Button
                          key={`${group.group}-${item.href}`}
                          className={`px-0 ${isActive ? "text-[var(--accent)]" : ""}`}
                          variant="ghost"
                          onPress={() => {
                            setAuxParam(isActive ? null : item.href);
                            setOpen(false);
                          }}
                        >
                          {item.label}
                        </Button>
                      ) : (
                        <Link
                          key={`${group.group}-${item.href}`}
                          className={`text-lg font-medium transition-colors ${isActive ? "text-[var(--accent)]" : "text-[var(--foreground)] hover:text-[var(--accent-strong)]"}`}
                          href={item.href}
                          onClick={() => setOpen(false)}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {adminItems && adminItems.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Admin</p>
                  <div className="flex flex-col items-start gap-2">
                    {adminItems.map((item) => (
                      <Link
                        key={`admin-${item.href}`}
                        className="text-lg font-medium text-[var(--foreground)] hover:text-[var(--accent-strong)]"
                        href={item.href}
                        onClick={() => setOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}