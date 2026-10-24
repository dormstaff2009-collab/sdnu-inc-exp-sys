/**
 * Format number as Thai Baht currency with exactly 2 decimal places.
 * Example: 1066454 -> "฿1,066,454.00"
 */
export const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(val) || 0);
};

/**
 * Format raw number with thousand separators and exactly 2 decimal places.
 * Example: 1066454 -> "1,066,454.00"
 */
export const formatNumber2Decimals = (val: number): string => {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(val) || 0);
};
