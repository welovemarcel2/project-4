import { OvertimeData, OvertimeRates, OvertimeSubPosts } from '../types/overtime';

export function calculateOvertimeRates(dailyRate: number, baseHours: number): OvertimeRates {
  const baseHourlyRate = dailyRate / baseHours;
  
  return {
    normal: baseHourlyRate,
    x1_5: baseHourlyRate * 1.5,
    x2: baseHourlyRate * 2
  };
}

export function calculateOvertimeSubPosts(data: OvertimeData): OvertimeSubPosts {
  const subPosts: OvertimeSubPosts = {
    totalAmount: 0
  };

  if (data.normalHours > 0) {
    subPosts.normal = {
      name: "Heures simples",
      quantity: data.normalHours,
      rate: data.rates.normal
    };
    subPosts.totalAmount += data.normalHours * data.rates.normal;
  }

  if (data.x1_5Hours > 0) {
    subPosts.x1_5 = {
      name: "Heures à +50%",
      quantity: data.x1_5Hours,
      rate: data.rates.x1_5
    };
    subPosts.totalAmount += data.x1_5Hours * data.rates.x1_5;
  }

  if (data.x2Hours > 0) {
    subPosts.x2 = {
      name: "Heures à +100%",
      quantity: data.x2Hours,
      rate: data.rates.x2
    };
    subPosts.totalAmount += data.x2Hours * data.rates.x2;
  }

  return subPosts;
}