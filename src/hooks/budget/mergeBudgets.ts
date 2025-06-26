import { BudgetCategory, BudgetLine } from '../../types/budget';

// Fonction pour fusionner deux lignes de budget
function mergeLines(base: BudgetLine, addition: BudgetLine): BudgetLine {
  const merged = { ...base };

  // Ajouter les quantités et montants
  merged.quantity = (base.quantity || 0) + (addition.quantity || 0);
  merged.number = Math.max(base.number || 0, addition.number || 0);
  merged.rate = Math.max(base.rate || 0, addition.rate || 0);

  // Fusionner les sous-items si présents
  if (base.subItems && addition.subItems) {
    merged.subItems = mergeSubItems(base.subItems, addition.subItems);
  }

  return merged;
}

// Fonction pour fusionner les sous-items
function mergeSubItems(baseItems: BudgetLine[], additionItems: BudgetLine[]): BudgetLine[] {
  const mergedItems: BudgetLine[] = [...baseItems];

  additionItems.forEach(additionItem => {
    const existingItem = mergedItems.find(item => item.id === additionItem.id);
    if (existingItem) {
      // Si l'item existe déjà, fusionner les valeurs
      const index = mergedItems.findIndex(item => item.id === additionItem.id);
      mergedItems[index] = mergeLines(existingItem, additionItem);
    } else {
      // Sinon, ajouter le nouvel item
      mergedItems.push({ ...additionItem });
    }
  });

  return mergedItems;
}

// Fonction principale pour fusionner deux budgets
export function mergeBudgets(baseBudget: BudgetCategory[], additiveBudget: BudgetCategory[]): BudgetCategory[] {
  // Copier le budget de base pour ne pas le modifier
  const mergedBudget = baseBudget.map(category => ({
    ...category,
    items: [...category.items]
  }));

  // Pour chaque catégorie du budget additif
  additiveBudget.forEach(additiveCategory => {
    const existingCategory = mergedBudget.find(cat => cat.id === additiveCategory.id);
    
    if (existingCategory) {
      // Si la catégorie existe, fusionner les items
      existingCategory.items = existingCategory.items.map(baseItem => {
        const additiveItem = additiveCategory.items.find(item => item.id === baseItem.id);
        if (additiveItem) {
          return mergeLines(baseItem, additiveItem);
        }
        return baseItem;
      });

      // Ajouter les nouveaux items qui n'existent pas dans le budget de base
      additiveCategory.items.forEach(additiveItem => {
        if (!existingCategory.items.find(item => item.id === additiveItem.id)) {
          existingCategory.items.push({ ...additiveItem });
        }
      });
    } else {
      // Si la catégorie n'existe pas, l'ajouter
      mergedBudget.push({ ...additiveCategory });
    }
  });

  return mergedBudget;
}