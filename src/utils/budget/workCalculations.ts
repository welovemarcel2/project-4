import { BudgetLine } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';

// Calcul du total pour une ligne de travail
export function calculateWorkTotal(workData: { 
  quantity: number; 
  number: number; 
  rate: number 
}): number {
  return workData.quantity * workData.number * workData.rate;
}

// Calcul du total pour un ensemble de sous-items
export function calculateWorkItemsTotal(
  items: BudgetLine[],
  workTotals: Map<string, { quantity: number; number: number; rate: number }>,
  settings: QuoteSettings
): number {
  return items.reduce((total, item) => {
    if (item.subItems && item.subItems.length > 0) {
      return total + calculateWorkItemsTotal(item.subItems, workTotals, settings);
    }

    const workData = workTotals.get(item.id);
    if (workData) {
      return total + calculateWorkTotal(workData);
    }

    // Si pas de données de travail, utiliser les valeurs du budget initial
    return total + (item.quantity || 0) * (item.number || 0) * (item.rate || 0);
  }, 0);
}

// Fonction utilitaire pour obtenir la couleur en fonction de la différence
export function getDifferenceColor(difference: number): string {
  if (difference > 0) return 'text-red-600';
  if (difference < 0) return 'text-green-600';
  return 'text-gray-400';
}