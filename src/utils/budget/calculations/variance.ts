import { BudgetLine } from '../../../types/budget';

export interface VarianceData {
  initialAmount: number;
  currentAmount: number;
  difference: number;
  percentageChange: number;
}

export function calculateVariance(initial: number, current: number): VarianceData {
  const difference = current - initial;
  const percentageChange = initial !== 0 ? (difference / initial) * 100 : 0;
  return { initialAmount: initial, currentAmount: current, difference, percentageChange };
}

export function getVarianceColor(variance: number): string {
  if (variance > 0) return 'text-red-600';
  if (variance < 0) return 'text-green-600';
  return 'text-gray-600';
}

export function formatVariance(variance: number): string {
  if (variance === 0) return '-';
  return `${variance > 0 ? '+' : ''}${variance}`;
}