import { nanoid } from 'nanoid';

/**
 * Generates a unique coupon code
 * @param prefix Optional prefix for the coupon code
 * @param length Length of the generated part (default: 8)
 * @returns A unique coupon code
 */
export function generateCouponCode(prefix?: string, length: number = 8): string {
  const uniquePart = nanoid(length).toUpperCase();
  return prefix ? `${prefix}-${uniquePart}` : uniquePart;
}

/**
 * Validates a coupon code format
 * @param code The coupon code to validate
 * @returns Boolean indicating if the format is valid
 */
export function validateCouponCodeFormat(code: string): boolean {
  // Coupon codes should be 3-30 chars, alphanumeric with optional hyphens
  const codeRegex = /^[A-Z0-9-]{3,30}$/;
  return codeRegex.test(code);
}

/**
 * Calculates the final price after applying a coupon
 * @param originalPrice The original price
 * @param discountPercentage The discount percentage (1-100)
 * @returns The final price after discount
 */
export function calculateDiscountedPrice(originalPrice: number, discountPercentage: number): number {
  if (discountPercentage < 0 || discountPercentage > 100) {
    throw new Error('Discount percentage must be between 0 and 100');
  }
  
  const discountAmount = (originalPrice * discountPercentage) / 100;
  return Math.max(0, originalPrice - discountAmount);
}

/**
 * Formats a discount percentage for display
 * @param discountPercentage The discount percentage
 * @returns Formatted discount string
 */
export function formatDiscount(discountPercentage: number): string {
  return `${discountPercentage}% OFF`;
}
