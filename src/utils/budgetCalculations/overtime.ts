import { BudgetLine } from '../../types/budget';

const BASE_HOURS = 8;

export function calculateHourlyRate(dailyRate: number): number {
  return dailyRate / BASE_HOURS;
}

export function calculateOvertimeRates(dailyRate: number) {
  const baseRate = calculateHourlyRate(dailyRate);
  return {
    normal: baseRate,
    x1_5: baseRate * 1.5,
    x2: baseRate * 2
  };
}

export function calculateOvertimeTotal(overtimeDetails: string | undefined): number {
  if (!overtimeDetails) return 0;
  
  try {
    const details = JSON.parse(overtimeDetails);
    const normalAmount = (details.normalHours || 0) * (details.normalRate || 0);
    const x1_5Amount = (details.x1_5Hours || 0) * (details.x1_5Rate || 0);
    const x2Amount = (details.x2Hours || 0) * (details.x2Rate || 0);
    
    return normalAmount + x1_5Amount + x2Amount;
  } catch (e) {
    console.error('Error parsing overtime details:', e);
    return 0;
  }
}