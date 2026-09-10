import { getAccessToken } from "@/lib/api-v1";
import { platformFetch } from "@/lib/platform";

export type Vendor = {
  id: number;
  businessName: string;
  category: string;
  description?: string;
  serviceArea?: string;
  pricingNotes?: string;
  phone?: string;
  email?: string;
  contactName?: string;
  status: string;
};

export type PortfolioItem = {
  id: number;
  vendorId: number;
  title: string;
  description?: string;
  mediaUrl?: string;
  sortOrder: number;
};

export type Accreditation = {
  id: number;
  vendorId: number;
  viewerName?: string;
  rating: number;
  comment?: string;
  createdAt: string;
};

export type VendorPayment = {
  id: number;
  vendorId?: number;
  description: string;
  amount: number;
  currency: string;
  status: string;
  kind?: string;
  createdAt: string;
};

export type VendorComplaint = {
  id: number;
  vendorId: number;
  subject: string;
  details: string;
  status: string;
  createdAt: string;
  adminNotes?: string;
};

export type ServiceRequest = {
  id: number;
  title: string;
  status: string;
  notes?: string;
  clientName?: string;
  quoteAmount?: number;
  vendorResponse?: string;
  createdAt: string;
};

async function vendorFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  if (!token) return { ok: false as const, status: 401, data: null };
  const res = await platformFetch(path, { ...init, token, revalidate: false });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

export async function fetchMyVendor() {
  return vendorFetch("/api/vendors/me");
}

export async function fetchVendorPayments() {
  return vendorFetch("/api/vendor/payments");
}

export async function fetchVendorRequests() {
  return vendorFetch("/api/vendor/requests");
}

export async function fetchVendorComplaints() {
  return vendorFetch("/api/vendor/complaints");
}

export async function fetchMyComplaints() {
  return vendorFetch("/api/complaints/mine");
}
