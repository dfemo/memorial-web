import { Suspense, type ReactNode } from "react";
import { apiV1, getAccessToken, type ApiUser } from "@/lib/api-v1";
import { getPublicSiteConfig } from "@/lib/site-config";
import { Shell, type AccountMenuConfig, type NavGroup } from "./shell";
import { humanize } from "./status";
import "./dashboard.css";

/** Glass shell shared by the owner and vendor dashboards. */
export async function DashboardFrame({ children }: { children: ReactNode }) {
  const config = await getPublicSiteConfig();

  let me: ApiUser | null = null;
  try {
    const token = await getAccessToken();
    if (token) me = await apiV1<ApiUser>("/api/v1/auth/me", { token });
  } catch {
    // The page itself handles expired sessions; the shell only needs a name.
  }

  const groups: NavGroup[] = [
    {
      heading: "Family",
      rail: { label: "Memorials", icon: "heart" },
      items: [
        { href: "/dashboard", label: "My memorials", icon: "heart", also: ["/memorial/manage"] },
        { href: "/create", label: "Create a memorial", icon: "plus" },
      ],
    },
    {
      heading: "Requests",
      rail: { label: "Requests", icon: "inbox" },
      items: [
        { href: "/dashboard/requests", label: "Service requests", icon: "inbox" },
        { href: "/dashboard/requests/new", label: "New request", icon: "plus" },
      ],
    },
    {
      heading: "Vendor workspace",
      rail: { label: "Vendor", icon: "briefcase" },
      items: [
        { href: "/dashboard/vendor?tab=profile", label: "Profile", icon: "user", isDefault: true },
        { href: "/dashboard/vendor?tab=portfolio", label: "Portfolio", icon: "image" },
        { href: "/dashboard/vendor?tab=requests", label: "Service requests", icon: "list" },
        { href: "/dashboard/vendor?tab=payments", label: "Payment resolutions", icon: "card" },
        { href: "/dashboard/vendor?tab=accreditations", label: "Accreditations", icon: "award" },
      ],
    },
    {
      heading: "Site",
      rail: { label: "Explore", icon: "compass" },
      items: [
        { href: "/browse", label: "Explore memorials", icon: "compass" },
        ...(config.showVendorDirectory
          ? [{ href: "/vendors", label: "Vendor directory", icon: "store" as const }]
          : []),
        { href: "/pricing", label: "Pricing", icon: "tag" },
        { href: "/about", label: "About", icon: "info" },
      ],
    },
  ];

  const account: AccountMenuConfig = {
    name: me ? `${me.firstName} ${me.lastName}`.trim() || me.email : "Your account",
    email: me?.email,
    pill: me?.plan ? `${humanize(me.plan)} plan` : undefined,
    columns: [
      {
        heading: "Account",
        items: [
          { href: "/dashboard", label: "My memorials", icon: "heart" },
          { href: "/dashboard/requests", label: "Service requests", icon: "inbox" },
          { href: "/dashboard/vendor", label: "Vendor workspace", icon: "briefcase" },
          { href: "/api/session/logout", label: "Sign out", icon: "logout", plain: true },
        ],
      },
      {
        heading: "Explore",
        items: [
          { href: "/", label: "Home", icon: "home" },
          { href: "/browse", label: "Explore memorials", icon: "compass" },
          { href: "/pricing", label: "Pricing", icon: "tag" },
          { href: "/about", label: "About", icon: "info" },
        ],
      },
    ],
  };

  return (
    <Suspense>
      <Shell brand={{ name: "EverRemember", sub: "Dashboard" }} groups={groups} account={account}>
        {children}
      </Shell>
    </Suspense>
  );
}
