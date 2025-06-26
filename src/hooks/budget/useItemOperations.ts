import { BudgetLine, BudgetCategory } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';

export function updateItem(
  categories: BudgetCategory[],
  categoryId: string,
  itemId: string,
  updates: Partial<BudgetLine>, 
  settings?: QuoteSettings
): BudgetCategory[] {
  return categories.map(category => {
    if (category.id !== categoryId) return category;

    const updateItems = (items: BudgetLine[]): BudgetLine[] => {
      return items.map(item => {
        if (item.id === itemId) {
          // Ensure cost is properly handled
          const updatedItem = { ...item, ...updates };
          
          // Special handling for cost field
          if ('cost' in updates) {
            updatedItem.cost = updates.cost;
          }
          
          return updatedItem;
        }
        if (item.subItems) {
          return {
            ...item,
            subItems: updateItems(item.subItems)
          };
        }
        return item;
      });
    };

    return {
      ...category,
      items: updateItems(category.items)
    };
  });
}

export function deleteItem(
  categories: BudgetCategory[],
  categoryId: string,
  itemId: string,
  settings?: QuoteSettings
): BudgetCategory[] {
  // Si nous supprimons une catégorie entière
  if (categoryId === itemId) {
    return categories.filter(category => category.id === 'social-charges' || category.id !== categoryId);
  }

  // Sinon, supprimer un élément dans une catégorie
  return categories.map(category => {
    if (category.id !== categoryId) return category;

    const processItems = (items: BudgetLine[]): BudgetLine[] => {
      const result: BudgetLine[] = [];
      
      for (const item of items) {
        // Si c'est l'item à supprimer, on ne l'ajoute pas au résultat
        if (item.id === itemId) continue;

        // Copie de l'item pour éviter la mutation
        const newItem = { ...item };

        // Si l'item a des sous-items, on les traite récursivement
        if (newItem.subItems && newItem.subItems.length > 0) {
          newItem.subItems = processItems(newItem.subItems);
        }

        result.push(newItem);
      }

      return result;
    };

    return {
      ...category,
      items: processItems(category.items)
    };
  });
}

export function updateCategory(
  categories: BudgetCategory[],
  categoryId: string,
  updates: Partial<BudgetCategory>
): BudgetCategory[] {
  return categories.map(category =>
    category.id === categoryId
      ? { ...category, ...updates }
      : category
  );
}