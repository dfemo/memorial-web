import { platformFetch } from "@/lib/platform";

export type PublicVendor = {
  id: number;
  businessName: string;
  category: string;
  description?: string;
  serviceArea?: string;
  pricingNotes?: string;
  status: string;
};

export type PublicSiteConfig = {
  brandName: string;
  tagline: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  sectionTitle: string;
  sectionLede: string;
  footerNote: string;
  vendorsTitle: string;
  vendorsLede: string;
  showVendorDirectory: boolean;
  showFeaturedMemorials: boolean;
  showPartnerResources: boolean;
  partnerTitle: string;
  partnerBody: string;
  partnerCtaLabel: string;
  partnerCtaUrl: string;
  vendors: PublicVendor[];
  settings: Record<string, string>;
  source: "api" | "fallback";
};

const FALLBACK: PublicSiteConfig = {
  brandName: "Let Us Handle Your Funeral",
  tagline:
    "A lasting online memorial for the people you love — and a calm place to arrange the services that help families through goodbye.",
  heroCtaPrimary: "Create a memorial",
  heroCtaSecondary: "View plans",
  sectionTitle: "Remember together",
  sectionLede:
    "Share a life story, gather tributes, and keep photos and service details in one respectful place.",
  footerNote:
    "Online memorials and funeral service coordination — with care, clarity, and lasting remembrance.",
  vendorsTitle: "Trusted funeral vendors",
  vendorsLede:
    "Browse approved providers — florists, funeral homes, celebrants, and more.",
  showVendorDirectory: true,
  showFeaturedMemorials: true,
  showPartnerResources: true,
  partnerTitle: "Helpful resources",
  partnerBody:
    "Florists, keepsake books, and grief support partners recommended for families.",
  partnerCtaLabel: "Explore partners",
  partnerCtaUrl: "/vendors",
  vendors: [],
  settings: {},
  source: "fallback",
};

/** One call to platform-api for all admin-configurable public site details. */
export async function getPublicSiteConfig(): Promise<PublicSiteConfig> {
  try {
    const res = await platformFetch("/api/site/config", { revalidate: 60 });
    if (!res.ok) return FALLBACK;
    const data = (await res.json()) as Omit<PublicSiteConfig, "source">;
    return {
      ...FALLBACK,
      ...data,
      vendors: Array.isArray(data.vendors) ? data.vendors : [],
      settings: data.settings || {},
      source: "api",
    };
  } catch {
    return FALLBACK;
  }
}
