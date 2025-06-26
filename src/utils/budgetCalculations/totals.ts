import { BudgetLine, BudgetCategory } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';
import { calculateLineTotal, calculateSocialCharges } from './base';

// Calcul des marges pour une ligne
function calculateLineMargins(line: BudgetLine, baseAmount: number) {
  return {
    agency: baseAmount * (line.agencyPercent / 100),
    margin: baseAmount * (line.marginPercent / 100)
  };
}

export function calculateTotalCosts(
  categories: BudgetCategory[] | null | undefined, 
  settings: QuoteSettings,
  useWorkCost: boolean = false
) {
  // Initialize totals
  let baseCost = 0;
  let totalAgency = 0;
  let totalMargin = 0;
  const socialChargesByType: Record<string, number> = {};
  let totalSocialCharges = 0;

  // If categories is null/undefined or not an array, return default values
  if (!categories || !Array.isArray(categories)) {
    return {
      baseCost: 0,
      socialChargesByType: {},
      totalSocialCharges: 0,
      totalCost: 0,
      agency: 0,
      agencyPercent: 0,
      margin: 0,
      marginPercent: 0,
      grandTotal: 0
    };
  }

  // Fonction récursive pour traiter une ligne et ses sous-lignes
  const processLine = (line: BudgetLine) => {
    // Si la ligne a des sous-items, traiter uniquement les sous-items
    if (line.subItems && line.subItems.length > 0) {
      line.subItems.forEach(processLine);
      return;
    }

    // Calculer le total selon le type d'unité
    let lineTotal = 0;
    if (line.unit === '%') {
      lineTotal = ((line.rate || 0) * (line.number || 0)) / 100;
    } else {
      // Use the appropriate rate/cost based on context
      const rateToUse = useWorkCost && line.cost !== undefined ? line.cost : line.rate;
      lineTotal = (line.quantity || 0) * (line.number || 0) * (rateToUse || 0);
      
      // Add overtime if present
      const overtimeAmount = line.overtime || 0;
      lineTotal += overtimeAmount;
    }

    baseCost += lineTotal;

    // Calculate social charges
    if (line.socialCharges && settings?.socialChargeRates?.length > 0) {
      const rate = settings.socialChargeRates.find(r => r.id === line.socialCharges);
      if (rate) {
        const charges = calculateSocialCharges(line, settings, useWorkCost);
        
        if (charges > 0) {
          socialChargesByType[line.socialCharges] = 
            (socialChargesByType[line.socialCharges] || 0) + charges;
          totalSocialCharges += charges;
        }
        // Si les charges sont 0 ou négatives, c'est normal pour certaines lignes
        // Pas besoin de log d'erreur
      }
    }

    // Calculer les marges sur le montant de base
    const margins = calculateLineMargins(line, lineTotal);
    totalAgency += margins.agency;
    totalMargin += margins.margin;
  };

  // Traiter toutes les catégories sauf les charges sociales
  categories.forEach(category => {
    if (category.id !== 'social-charges') {
      category.items.forEach(processLine);
    }
  });

  // Calculer les marges sur les charges sociales en utilisant les taux spécifiques
  Object.entries(socialChargesByType).forEach(([rateId, amount]) => {
    const rate = settings.socialChargeRates.find(r => r.id === rateId);
    if (rate) {
      // Utiliser les taux spécifiques du type de charge sociale
      const agencyPercent = rate.agencyPercent !== undefined ? rate.agencyPercent : settings.defaultAgencyPercent;
      const marginPercent = rate.marginPercent !== undefined ? rate.marginPercent : settings.defaultMarginPercent;
      
      totalAgency += amount * (agencyPercent / 100);
      totalMargin += amount * (marginPercent / 100);
    }
  });

  // Calculer les totaux
  const totalCost = baseCost + totalSocialCharges;
  const grandTotal = totalCost + totalAgency + totalMargin;

  // Calculer les pourcentages réels
  const agencyPercent = totalCost > 0 ? (totalAgency / totalCost) * 100 : settings.defaultAgencyPercent;
  const marginPercent = totalCost > 0 ? (totalMargin / totalCost) * 100 : settings.defaultMarginPercent;

  return {
    baseCost,
    socialChargesByType,
    totalSocialCharges,
    totalCost,
    agency: totalAgency,
    margin: totalMargin,
    agencyPercent,
    marginPercent,
    grandTotal
  };
}