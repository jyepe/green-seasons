/**
 * Formats a number as USD currency
 * 
 * This function formats currency with full precision for display in cards, tables, and tooltips
 * where space is not constrained. For abbreviated formatting in charts (e.g., "$1.2k"),
 * chart components define their own local formatCurrency functions.
 * 
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};
