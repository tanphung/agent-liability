export function shorten(value: string, chars = 6): string {
  if (!value) {
    return "";
  }
  if (value.length <= chars * 2 + 2) {
    return value;
  }
  return `${value.slice(0, chars + 2)}...${value.slice(-chars)}`;
}

export function bpsToPercent(bps: number): string {
  const whole = Math.trunc(bps / 100);
  const fraction = Math.abs(bps % 100).toString().padStart(2, "0");
  return `${whole}.${fraction}%`;
}

export function weiToGen(wei: number | bigint): string {
  const value = BigInt(wei);
  const base = 10n ** 18n;
  const whole = value / base;
  const fraction = (value % base).toString().padStart(18, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function parseGenToWei(input: string): bigint {
  const trimmed = input.trim();
  if (!/^\d+(\.\d{0,18})?$/.test(trimmed)) {
    throw new Error("GEN amount must be a non-negative decimal with up to 18 decimals");
  }
  const [whole, fraction = ""] = trimmed.split(".");
  return BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18, "0"));
}

export function percentToBps(input: string): number {
  const trimmed = input.trim();
  if (!/^\d+(\.\d{0,2})?$/.test(trimmed)) {
    throw new Error("Percent must use at most two decimals");
  }
  const [whole, fraction = ""] = trimmed.split(".");
  const bps = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (bps < 0 || bps > 10_000) {
    throw new Error("Percent must be between 0 and 100");
  }
  return bps;
}

export function safeJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") {
    return fallback;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
