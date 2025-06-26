import React from 'react';
import { calculateCategorySubtotal } from '../../utils/budgetCalculations';
import { BudgetLine } from '../../types/budget';

interface CategorySubtotalRowProps {
  items: BudgetLine[];
}

export function CategorySubtotalRow({ items }: CategorySubtotalRowProps) {
  const subtotal = calculateCategorySubtotal(items);
  return <span className="text-xs italic">{subtotal.toFixed(2)}</span>;
}