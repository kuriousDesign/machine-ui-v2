"use client";

import { BridgeStatusView } from "@/components/feature/bridge-status-view";
import { DeviceMapView } from "@/components/feature/device-map-view";
import { OperationView } from "@/components/feature/operation-view";
import { OverviewView } from "@/components/feature/overview-view";
import { SubscriptionsView } from "@/components/feature/subscriptions-view";
import { TagTopicsView } from "@/components/feature/tag-topics-view";

export function AuxContentManager({ auxPath }: { auxPath: string | null }) {
  switch (auxPath) {
    case "/":
      return <OverviewView />;
    case "/operation":
      return <OperationView />;
    case "/bridge-status":
      return <BridgeStatusView />;
    case "/device-map":
      return <DeviceMapView />;
    case "/subscriptions":
      return <SubscriptionsView />;
    case "/tag-topics":
      return <TagTopicsView />;
    default:
      return <UnsupportedAuxContent auxPath={auxPath} />;
  }
}

function UnsupportedAuxContent({ auxPath }: { auxPath: string | null }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--muted)]">Aux panel</p>
        <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Unsupported aux route</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          The current aux target is not mapped into the embedded panel yet. Open one of the supported bridge views from the shell controls instead.
        </p>
      </div>

      <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-white/45 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Current aux target</p>
        <p className="mt-2 font-mono text-sm text-[var(--accent-strong)]">{auxPath ?? "None"}</p>
      </div>
    </div>
  );
}