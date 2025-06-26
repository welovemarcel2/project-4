import React from 'react';
import { useCurrencyStore } from '../../stores/currencyStore';
import { CurrencyCode } from '../../types/currency';

interface CurrencyDisplayProps {
  className?: string;
  code?: CurrencyCode;
  showSymbol?: boolean;
}

export function CurrencyDisplay({ className = '', code, showSymbol = true }: CurrencyDisplayProps) {
  const { selectedCurrency, currencies } = useCurrencyStore();
  const currencyCode = code || selectedCurrency;
  const currency = currencies.find(c => c.code === currencyCode);
  
  if (!showSymbol) return null;
  
  return (
    <span className={`${className} ${code && code !== selectedCurrency ? 'font-bold' : ''}`}>
      {currency?.symbol || '€'}
    </span>
  );
}