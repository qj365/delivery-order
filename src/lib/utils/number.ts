export function roundTo(n: number, digits = 2) {
  const multi = 10 ** digits;
  const num = Number.parseFloat((n * multi).toFixed(11));
  return (Math.sign(num) * Math.round(Math.abs(num))) / multi;
}

export function safeToFixed(
  value: number | undefined | null,
  precision = 2,
): number {
  return value ? roundTo(value, precision) : 0;
}

export function safeDivideAndRound(
  value: number,
  divider: number,
  precision = 2,
): number {
  return divider ? roundTo(value / divider, precision) : 0;
}

export function calculateRate(numerator: number, denominator: number): number {
  if (!Number.isFinite(denominator) || denominator === 0) {
    return 0;
  }
  return roundTo((numerator / denominator) * 100, 2);
}

export function calculateFraction(
  numerator: number,
  denominator: number,
): number {
  if (!Number.isFinite(denominator) || denominator === 0) {
    return 0;
  }
  return roundTo(numerator / denominator, 2);
}

export function formatNumber(value: number | undefined | null): string {
  if (!value) return "0";
  const parts = value.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}
