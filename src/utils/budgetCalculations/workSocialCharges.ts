import { BudgetLine } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';

// Calcul des charges sociales pour une ligne de travail
export function calculateWorkLineSocialCharges(
  workData: { quantity: number; number: number; rate: number; socialCharges?: string },
  settings: QuoteSettings
): number {
  if (!workData.socialCharges) return 0;
  
  const rate = settings.socialChargeRates.find(r => r.id === workData.socialCharges);
  if (!rate) return 0;
  
  const baseTotal = workData.quantity * workData.number * workData.rate;
  return baseTotal * rate.rate;
}

// Calcul des charges sociales pour une sous-catégorie
export function calculateWorkSubCategorySocialCharges(
  items: BudgetLine[],
  workTotals: Map<string, { quantity: number; number: number; rate: number; socialCharges?: string }>,
  settings: QuoteSettings
): Record<string, number> {
  const chargesByType: Record<string, number> = {};

  const processItem = (item: BudgetLine) => {
    if (item.subItems && item.subItems.length > 0) {
      item.subItems.forEach(processItem);
      return;
    }

    const workData = workTotals.get(item.id);
    const quantity = workData?.quantity ?? item.quantity;
    const number = workData?.number ?? item.number;
    const rate = workData?.rate ?? item.rate;
    const socialCharges = workData?.socialCharges ?? item.socialCharges;

    if (socialCharges) {
      const baseTotal = quantity * number * rate;
      const chargeRate = settings.socialChargeRates.find(r => r.id === socialCharges);
      if (chargeRate) {
        chargesByType[socialCharges] = (chargesByType[socialCharges] || 0) + (baseTotal * chargeRate.rate);
      }
    }
  };

  items.forEach(processItem);
  return chargesByType;
}

// Calcul des charges sociales par type
export function calculateWorkSocialChargesByType(
  items: BudgetLine[],
  workTotals: Map<string, { quantity: number; number: number; rate: number; socialCharges?: string }>,
  settings: QuoteSettings
): Record<string, number> {
  const chargesByType: Record<string, number> = {};

  const processItem = (item: BudgetLine) => {
    if (item.subItems && item.subItems.length > 0) {
      item.subItems.forEach(processItem);
      return;
    }

    const workData = workTotals.get(item.id);
    const quantity = workData?.quantity ?? item.quantity;
    const number = workData?.number ?? item.number;
    const rate = workData?.rate ?? item.rate;
    const socialCharges = workData?.socialCharges ?? item.socialCharges;

    if (socialCharges) {
      const baseTotal = quantity * number * rate;
      const chargeRate = settings.socialChargeRates.find(r => r.id === socialCharges);
      if (chargeRate) {
        chargesByType[socialCharges] = (chargesByType[socialCharges] || 0) + (baseTotal * chargeRate.rate);
      }
    }
  };

  items.forEach(processItem);
  return chargesByType;
}