import { useMemo } from 'react';
import { BudgetCategory } from '../types';
import { QuoteSettings } from '../types';
import { calculateTotalCosts, calculateSocialChargesByType } from '../utils/calculations';

export function useCalculations(categories: BudgetCategory[], settings: QuoteSettings) {
  const totals = useMemo(() => 
    calculateTotalCosts(categories, settings),
    [categories, settings]
  );

  const socialCharges = useMemo(() => 
    calculateSocialChargesByType(categories, settings),
    [categories, settings]
  );

  return {
    totals,
    socialCharges
  };
}