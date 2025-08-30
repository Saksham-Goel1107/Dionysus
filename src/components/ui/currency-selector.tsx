'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Currency, SUPPORTED_CURRENCIES } from '@/lib/currencyConverter';

interface CurrencySelectorProps {
  selectedCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  className?: string;
}

export function CurrencySelector({
  selectedCurrency,
  onCurrencyChange,
  className,
}: CurrencySelectorProps) {
  return (
    <Select
      value={selectedCurrency.code}
      onValueChange={(value) => {
        const currency = SUPPORTED_CURRENCIES.find((c) => c.code === value);
        if (currency) {
          onCurrencyChange(currency);
        }
      }}
    >
      <SelectTrigger className={className}>
        <SelectValue>
          <div className="flex items-center gap-2">
            <span className="font-mono">{selectedCurrency.symbol}</span>
            <span>{selectedCurrency.code}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_CURRENCIES.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            <div className="flex items-center gap-2">
              <span className="w-6 font-mono">{currency.symbol}</span>
              <span className="font-medium">{currency.code}</span>
              <span className="text-muted-foreground">{currency.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
