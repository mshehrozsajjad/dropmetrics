/**
 * Utility functions for price and data calculations
 */

/**
 * Categorizes a price into a predefined range
 * @param {number} price - The price to categorize
 * @returns {string} - The price range category
 */
export const getPriceRange = (price) => {
  if (price < 10) return '$0-10';
  if (price < 20) return '$10-20';
  if (price < 30) return '$20-30';
  if (price < 50) return '$30-50';
  return '$50+';
};