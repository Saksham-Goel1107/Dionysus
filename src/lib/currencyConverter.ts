// Currency conversion utility using live exchange rates

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
];

interface ExchangeRateResponse {
  rates: Record<string, number>;
  base: string;
  date: string;
}

let exchangeRatesCache: { rates: Record<string, number>; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export async function getExchangeRates(): Promise<Record<string, number>> {
  // Check if we have cached rates that are still fresh
  if (exchangeRatesCache && Date.now() - exchangeRatesCache.timestamp < CACHE_DURATION) {
    return exchangeRatesCache.rates;
  }

  try {
    // Using a free exchange rate API (you can replace with your preferred service)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/INR');

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates');
    }

    const data: ExchangeRateResponse = await response.json();

    // Cache the rates
    exchangeRatesCache = {
      rates: data.rates,
      timestamp: Date.now(),
    };

    return data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    const fallbackRates = {
      USD: 0.012,
      EUR: 0.011,
      GBP: 0.0095,
      JPY: 1.8,
      AUD: 0.018,
      CAD: 0.016,
      CHF: 0.011,
      CNY: 0.086,
      SGD: 0.016,
      INR: 1, // Base currency
    };

    exchangeRatesCache = {
      rates: fallbackRates,
      timestamp: Date.now(),
    };

    return fallbackRates;
  }
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRates: Record<string, number>,
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Since our base is INR, we need to handle conversions properly
  if (fromCurrency === 'INR') {
    const rate = exchangeRates[toCurrency];
    return rate ? amount * rate : amount;
  } else if (toCurrency === 'INR') {
    const rate = exchangeRates[fromCurrency];
    return rate ? amount / rate : amount;
  } else {
    // Convert from source currency to INR, then to target currency
    const fromRate = exchangeRates[fromCurrency];
    const toRate = exchangeRates[toCurrency];
    if (fromRate && toRate) {
      const inrAmount = amount / fromRate;
      return inrAmount * toRate;
    }
    return amount;
  }
}

export function formatCurrency(amount: number, currency: Currency): string {
  const roundedAmount = Math.round(amount * 100) / 100;

  // Special formatting for different currencies
  if (currency.code === 'JPY') {
    // Japanese Yen doesn't use decimal places
    return `${currency.symbol}${Math.round(roundedAmount)}`;
  }

  return `${currency.symbol}${roundedAmount.toFixed(2)}`;
}

export function getCurrencyByCode(code: string): Currency | undefined {
  return SUPPORTED_CURRENCIES.find((currency) => currency.code === code);
}
