import { BudgetCategory, BudgetLine } from '../../types/budget';

// Copie profonde d'une ligne de budget avec tous ses sous-éléments
function deepCopyBudgetLine(line: BudgetLine): BudgetLine {
  return {
    ...line,
    subItems: line.subItems ? line.subItems.map(deepCopyBudgetLine) : []
  };
}

// Copie profonde d'une catégorie de budget avec toutes ses lignes
function deepCopyBudgetCategory(category: BudgetCategory): BudgetCategory {
  return {
    ...category,
    items: category.items.map(deepCopyBudgetLine)
  };
}

// Copie complète du budget avec sa structure hiérarchique
export function copyBudgetStructure(budget: BudgetCategory[]): BudgetCategory[] {
  return budget.map(deepCopyBudgetCategory);
}