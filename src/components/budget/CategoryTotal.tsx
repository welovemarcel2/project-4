import React from 'react';
import { BudgetLine } from '../../types/budget';
import { formatNumber } from '../../utils/formatNumber';
import { calculateLineTotalWithCurrency } from '../../utils/budgetCalculations/base';
import { CurrencyCode } from '../../types/currency';
import { QuoteSettings } from '../../types/quoteSettings';

const currencySymbols: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CHF: 'CHF',
  CAD: '$',
  AUD: '$',
  JPY: '¥',
  CNY: '¥',
  // Ajoute d'autres devises si besoin
};

interface CategoryTotalProps {
  items: BudgetLine[];
  settings: QuoteSettings;
  selectedCurrency: CurrencyCode;
  convertAmount: (amount: number, fromCurrency?: CurrencyCode, toCurrency?: CurrencyCode) => number;
}

export function CategoryTotal({ items, settings, selectedCurrency, convertAmount }: CategoryTotalProps) {
  const total = items.reduce((acc, item) => {
    // Additionne les totaux des sous-catégories et postes, déjà convertis
    if (item.subItems && item.subItems.length > 0) {
      return acc + item.subItems.reduce((subTotal, subItem) => {
        return subTotal + calculateLineTotalWithCurrency(subItem, settings, convertAmount, selectedCurrency);
      }, 0);
    }
    return acc + calculateLineTotalWithCurrency(item, settings, convertAmount, selectedCurrency);
  }, 0);

  // Ne pas afficher si le total est 0
  if (total === 0) return null;

  const symbol = currencySymbols[selectedCurrency] || selectedCurrency;

  return (
    <span className="text-xs font-bold uppercase tracking-wide text-white whitespace-nowrap">
      {formatNumber(total)} {symbol}
    </span>
  );
}