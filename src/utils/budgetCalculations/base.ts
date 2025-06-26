import { BudgetLine, BudgetCategory } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';
import { CurrencyCode } from '../../types/currency';

// Calcul simple : quantité * nombre * tarif/coût
export function calculateBaseTotal(line: BudgetLine, settings?: QuoteSettings, useWorkCost: boolean = false): number {
  // Si l'unité est en pourcentage et qu'on a un montant calculé, l'utiliser
  if (line.unit === '%' && line.calculatedAmount !== undefined) {
    return line.calculatedAmount;
  }

  // Dans l'onglet travail, utiliser le coût au lieu du tarif
  const rate = useWorkCost && line.cost !== undefined ? line.cost : line.rate;
  const quantity = line.quantity || 0;
  const number = line.number || 0;
  const finalRate = rate || 0;
  
  // Calculate base amount
  const baseAmount = quantity * number * finalRate;
  
  // Add overtime if present
  const overtimeAmount = line.overtime || 0;
  
  return Number((baseAmount + overtimeAmount).toFixed(2));
}

// Calcul des charges sociales
export function calculateSocialCharges(line: BudgetLine, settings: QuoteSettings, useWorkCost: boolean = false): number {
  const baseTotal = calculateBaseTotal(line, settings, useWorkCost);
  if (!line.socialCharges) return 0;

  const rate = settings.socialChargeRates.find(r => r.id === line.socialCharges);
  if (!rate) {
    return 0;
  }
  
  // Use the work cost if specified, otherwise use the regular rate
  const rateToUse = useWorkCost && line.cost !== undefined ? line.cost : line.rate;
  const quantityToUse = line.quantity || 0;
  const numberToUse = line.number || 0;
  
  // Calculate base amount including overtime
  const baseAmount = quantityToUse * numberToUse * (rateToUse || 0);
  const overtimeAmount = line.overtime || 0;
  const totalBeforeCharges = baseAmount + overtimeAmount;
  
  // Apply social charges rate
  return totalBeforeCharges * rate.rate;
}

// Calcul du total d'une ligne SANS les charges sociales (version simple sans conversion)
export function calculateLineTotal(
  line: BudgetLine, 
  settings?: QuoteSettings,
  includeSocialCharges: boolean = false, // Par défaut, ne pas inclure les charges
  useWorkCost: boolean = false
): number {
  // Si la ligne a des sous-items, utiliser la somme des sous-items
  if (line.subItems && line.subItems.length > 0) {
    return line.subItems.reduce((acc, subItem) => 
      acc + calculateLineTotal(subItem, settings, includeSocialCharges, useWorkCost), 0
    );
  }

  // Pour les lignes sans sous-items, calculer le total
  let baseTotal;
  if (line.unit === '%') {
    // Pour les pourcentages, utiliser le montant calculé s'il existe
    baseTotal = line.calculatedAmount || 0;
  } else {
    // Sinon calculer normalement (incluant déjà les heures supplémentaires)
    baseTotal = calculateBaseTotal(line, settings, useWorkCost);
  }

  let total = baseTotal;

  // N'inclure les charges que si explicitement demandé
  if (settings && includeSocialCharges && line.socialCharges) {
    // Si les charges sont réparties et qu'on est en mode groupé, ne pas les inclure ici
    if (line.includeSocialChargesInDistribution && settings.socialChargesDisplay === 'grouped') {
      baseTotal = calculateBaseTotal(line, settings, useWorkCost);
    }

    const socialCharges = calculateSocialCharges(line, settings, useWorkCost);
    
    // Apply margins to social charges if configured
    if (settings.applySocialChargesMargins && socialCharges > 0) {
      const totalWithCharges = total + socialCharges;
      const agencyAmount = totalWithCharges * (line.agencyPercent / 100);
      const marginAmount = totalWithCharges * (line.marginPercent / 100);
      return totalWithCharges + agencyAmount + marginAmount;
    }
    
    return total + socialCharges;
  }

  return total;
}

// Calcul du total d'une ligne AVEC conversion de devise
export function calculateLineTotalWithCurrency(
  line: BudgetLine, 
  settings: QuoteSettings,
  convertAmount: (amount: number, fromCurrency?: CurrencyCode, toCurrency?: CurrencyCode) => number,
  selectedCurrency: CurrencyCode,
  includeSocialCharges: boolean = false,
  useWorkCost: boolean = false
): number {
  // Si la ligne a des sous-items, utiliser la somme des sous-items
  if (line.subItems && line.subItems.length > 0) {
    return line.subItems.reduce((acc, subItem) => 
      acc + calculateLineTotalWithCurrency(subItem, settings, convertAmount, selectedCurrency, includeSocialCharges, useWorkCost), 0
    );
  }

  // Pour les lignes sans sous-items, calculer le total avec conversion du tarif
  let baseTotal;
  if (line.unit === '%') {
    // Pour les pourcentages, utiliser le montant calculé s'il existe
    baseTotal = line.calculatedAmount || 0;
  } else {
    // Calculer le total en convertissant le tarif si nécessaire
    const quantity = line.quantity || 0;
    const number = line.number || 0;
    const rate = useWorkCost && line.cost !== undefined ? line.cost : line.rate;
    
    if (line.currency && line.currency !== selectedCurrency) {
      // Convertir le tarif vers la devise sélectionnée
      const convertedRate = convertAmount(rate, line.currency, selectedCurrency);
      baseTotal = quantity * number * convertedRate;
    } else {
      // Utiliser le tarif tel quel si même devise
      baseTotal = quantity * number * (rate || 0);
    }
    
    // Ajouter les heures supplémentaires
    const overtimeAmount = line.overtime || 0;
    baseTotal += overtimeAmount;
  }

  let total = baseTotal;

  // N'inclure les charges que si explicitement demandé
  if (includeSocialCharges && line.socialCharges) {
    const socialCharges = calculateSocialCharges(line, settings, useWorkCost);
    
    // Convertir les charges sociales si nécessaire
    let convertedSocialCharges = socialCharges;
    if (line.currency && line.currency !== selectedCurrency) {
      convertedSocialCharges = convertAmount(socialCharges, line.currency, selectedCurrency);
    }
    
    // Apply margins to social charges if configured
    if (settings.applySocialChargesMargins && convertedSocialCharges > 0) {
      const totalWithCharges = total + convertedSocialCharges;
      const agencyAmount = totalWithCharges * (line.agencyPercent / 100);
      const marginAmount = totalWithCharges * (line.marginPercent / 100);
      return totalWithCharges + agencyAmount + marginAmount;
    }
    
    return total + convertedSocialCharges;
  }

  return total;
}

// Calcul du total d'une catégorie SANS les charges sociales
export function calculateCategoryTotal(
  category: BudgetCategory | BudgetLine[], 
  settings?: QuoteSettings,
  includeSocialCharges: boolean = false, // Par défaut, ne pas inclure les charges
  useWorkCost: boolean = false
): number {
  // Handle null or undefined input
  if (!category) return 0;

  // If category is a BudgetCategory object, use its items
  const items = Array.isArray(category) ? category : category.items;

  // If items is null, undefined, or not an array, return 0
  if (!Array.isArray(items)) return 0;

  return items.reduce((total, item) => {
    // Pour les sous-catégories, calculer récursivement
    if (item.type === 'subCategory' && item.subItems && item.subItems.length > 0) {
      return total + calculateCategoryTotal(item.subItems, settings, includeSocialCharges, useWorkCost);
    }
    
    // Pour les postes et sous-postes, calculer le total
    return total + calculateLineTotal(item, settings, includeSocialCharges, useWorkCost);
  }, 0);
}

// Calcul du total d'une sous-catégorie SANS les charges sociales
export function calculateSubCategoryTotal(
  subCategory: BudgetLine,
  settings?: QuoteSettings,
  includeSocialCharges: boolean = false,
  useWorkCost: boolean = false
): number {
  if (!subCategory.subItems) return 0;
  
  return subCategory.subItems.reduce((total, item) => 
    total + calculateLineTotal(item, settings, includeSocialCharges, useWorkCost), 0
  );
}