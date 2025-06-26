import { BudgetLine, BudgetCategory } from '../types/budget';
import { QuoteSettings } from '../types/quoteSettings';

// Calcul du total de base (quantité * nombre * tarif)
export const calculateBaseTotal = (line: BudgetLine): number => {
  if (!line.quantity || !line.number || !line.rate) return 0;
  return line.quantity * line.number * line.rate;
};

// Calcul des charges sociales pour une ligne
export const calculateSocialCharges = (line: BudgetLine, settings: QuoteSettings): number => {
  const baseTotal = calculateBaseTotal(line);
  if (!line.socialCharges) return 0;
  
  const rate = settings.socialChargeRates.find(r => r.id === line.socialCharges);
  if (!rate) return 0;
  
  return baseTotal * rate.rate;
};

// Calcul des totaux pour une ligne avec ses sous-items
export const calculateLineTotals = (line: BudgetLine, settings: QuoteSettings) => {
  if (line.subItems && line.subItems.length > 0) {
    return line.subItems.reduce((acc, subItem) => {
      const subTotals = calculateLineTotals(subItem, settings);
      return {
        baseTotal: acc.baseTotal + subTotals.baseTotal,
        socialCharges: acc.socialCharges + subTotals.socialCharges,
        agency: acc.agency + subTotals.agency,
        margin: acc.margin + subTotals.margin
      };
    }, { baseTotal: 0, socialCharges: 0, agency: 0, margin: 0 });
  }

  const baseTotal = calculateBaseTotal(line);
  const socialCharges = calculateSocialCharges(line, settings);
  const totalForMargins = settings.includeChargesInMargins 
    ? baseTotal + socialCharges 
    : baseTotal;
  
  return {
    baseTotal,
    socialCharges,
    agency: totalForMargins * (line.agencyPercent / 100),
    margin: totalForMargins * (line.marginPercent / 100)
  };
};

// Calcul des totaux pour le résumé
export const calculateTotalCosts = (categories: BudgetCategory[], settings: QuoteSettings) => {
  const totals = categories.reduce((acc, category) => {
    const categoryTotals = category.items.reduce((itemAcc, item) => {
      const lineTotals = calculateLineTotals(item, settings);
      return {
        baseTotal: itemAcc.baseTotal + lineTotals.baseTotal,
        socialCharges: itemAcc.socialCharges + lineTotals.socialCharges,
        agency: itemAcc.agency + lineTotals.agency,
        margin: itemAcc.margin + lineTotals.margin
      };
    }, { baseTotal: 0, socialCharges: 0, agency: 0, margin: 0 });

    return {
      baseTotal: acc.baseTotal + categoryTotals.baseTotal,
      socialCharges: acc.socialCharges + categoryTotals.socialCharges,
      agency: acc.agency + categoryTotals.agency,
      margin: acc.margin + categoryTotals.margin
    };
  }, { baseTotal: 0, socialCharges: 0, agency: 0, margin: 0 });

  const totalCost = totals.baseTotal + totals.socialCharges;
  const grandTotal = totalCost + totals.agency + totals.margin;
  const marginPercentage = (totals.margin / grandTotal) * 100;

  return {
    baseCost: totals.baseTotal,
    socialCharges: totals.socialCharges,
    totalCost,
    agency: totals.agency,
    margin: totals.margin,
    marginPercentage,
    grandTotal
  };
};