export const SUPPORTED_CURRENCIES = ["NGN", "USD", "GBP"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export function normalizeCurrency(raw: FormDataEntryValue | string | null | undefined): SupportedCurrency {
  const code = String(raw || "USD").trim().toUpperCase();
  if ((SUPPORTED_CURRENCIES as readonly string[]).includes(code)) {
    return code as SupportedCurrency;
  }
  return "USD";
}

export function formatMoney(amount: number, currency: string) {
  const code = normalizeCurrency(currency);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      maximumFractionDigits: code === "NGN" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${code} ${amount}`;
  }
}
