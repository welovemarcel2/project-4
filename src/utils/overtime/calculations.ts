import { OvertimeData, OvertimeRates } from '../../types/overtime';

export function calculateOvertimeRates(dailyRate: number, baseHours: number = 8): OvertimeRates {
  // Le taux horaire est maintenant calculé avec le nombre d'heures paramétré
  const baseHourlyRate = dailyRate / baseHours;
  
  return {
    normal: baseHourlyRate,
    x1_5: baseHourlyRate * 1.5,  // Majoration de 50%
    x2: baseHourlyRate * 2       // Majoration de 100%
  };
}

export function calculateOvertimeTotal(data: OvertimeData): number {
  if (!data.rates) return 0;
  
  const normalAmount = (data.normalHours || 0) * (data.rates.normal || 0);
  const x1_5Amount = (data.x1_5Hours || 0) * (data.rates.x1_5 || 0);
  const x2Amount = (data.x2Hours || 0) * (data.rates.x2 || 0);
  
  return normalAmount + x1_5Amount + x2Amount;
}

export function formatOvertimeDetails(overtimeDetails: string): string {
  try {
    const details = JSON.parse(overtimeDetails);
    if (!details) return '';
    
    // Get base hours and rate
    const baseHours = details.baseHours || 8;
    const baseRate = details.normalRate ? details.normalRate * baseHours : 0;
    
    // Build parts array with only non-zero values
    const parts = [];
    
    if (details.normalHours && details.normalHours > 0) {
      parts.push(`${details.normalHours}h 0%`);
    }
    
    if (details.x1_5Hours && details.x1_5Hours > 0) {
      parts.push(`${details.x1_5Hours}h 50%`);
    }
    
    if (details.x2Hours && details.x2Hours > 0) {
      parts.push(`${details.x2Hours}h 100%`);
    }
    
    if (parts.length === 0) return '';
    
    // Format the final string
    return `TJ = ${baseRate.toFixed(0)} + HS (${parts.join(' + ')})`;
  } catch (e) {
    console.error('Error parsing overtime details:', e);
    return '';
  }
}