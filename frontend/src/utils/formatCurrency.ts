export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatRange = (range: [number, number]): string =>
  `${formatINR(range[0])} – ${formatINR(range[1])}`;

export const formatLakh = (amount: number): string => {
  if (amount >= 10_00_000) return `₹${(amount / 10_00_000).toFixed(1)}Cr`;
  if (amount >= 1_00_000) return `₹${(amount / 1_00_000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return formatINR(amount);
};

export const formatRangeLakh = (range: [number, number]): string =>
  `${formatLakh(range[0])} – ${formatLakh(range[1])}`;

export const formatPercent = (value: number, decimals = 0): string =>
  `${(value * 100).toFixed(decimals)}%`;

export const formatNumber = (n: number): string =>
  new Intl.NumberFormat('en-IN').format(Math.round(n));