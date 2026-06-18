import type { CurrencyCode } from "@/types";

const LOCALES: Record<CurrencyCode, string> = {
  NPR: "en-IN", // lakh/crore grouping
  INR: "en-IN",
  USD: "en-US",
  EUR: "en-IE",
  GBP: "en-GB",
};

const SYMBOLS: Record<CurrencyCode, string> = {
  NPR: "Rs.",
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export function currencySymbol(code: CurrencyCode): string {
  return SYMBOLS[code] ?? code;
}

export function formatMoney(
  amount: number,
  code: CurrencyCode = "NPR",
  opts: { compact?: boolean; sign?: boolean; decimals?: number } = {}
): string {
  const { compact = false, sign = false, decimals = 0 } = opts;
  const locale = LOCALES[code] ?? "en-US";
  const abs = Math.abs(amount);

  let body: string;
  if (compact) {
    body = new Intl.NumberFormat(locale, {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(abs);
  } else {
    body = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(abs);
  }

  const symbol = currencySymbol(code);
  const prefix = sign ? (amount < 0 ? "−" : amount > 0 ? "+" : "") : amount < 0 ? "−" : "";
  return `${prefix}${symbol} ${body}`;
}
