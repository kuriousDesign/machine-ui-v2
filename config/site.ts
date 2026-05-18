export interface NavItem {
  href: string;
  label: string;
  group: string;
  panel?: "primary" | "aux";
}

export const siteConfig = {
  adminNavItems: [] as NavItem[],
  description: "Bridge-first machine UI shell with shared main and auxiliary operator views.",
  name: "machine/ui v2",
  navItems: [
    {
      href: "/operation",
      label: "Operation",
      group: "operate",
      panel: "primary",
    },
    {
      href: "/",
      label: "Overview",
      group: "operate",
      panel: "primary",
    },
    {
      href: "/device-map",
      label: "Devices",
      group: "operate",
      panel: "primary",
    },
    {
      href: "/bridge-status",
      label: "Bridge Status",
      group: "monitor",
      panel: "aux",
    },
    {
      href: "/subscriptions",
      label: "Subscriptions",
      group: "monitor",
      panel: "aux",
    },
    {
      href: "/tag-topics",
      label: "TagTopics",
      group: "monitor",
      panel: "aux",
    },
  ] as NavItem[],
};