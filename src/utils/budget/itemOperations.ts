import { BudgetLine, BudgetCategory } from '../../types/budget';

// Fonction récursive pour supprimer un item dans une hiérarchie
function deleteItemRecursive(items: BudgetLine[], itemId: string): BudgetLine[] {
  // Vérifier d'abord au niveau actuel
  const filteredItems = items.filter(item => item.id !== itemId);
  
  // Si la longueur est différente, l'item a été trouvé et supprimé
  if (filteredItems.length !== items.length) {
    return filteredItems;
  }
  
  // Sinon, chercher dans les sous-items
  return filteredItems.map(item => {
    if (item.subItems && item.subItems.length > 0) {
      return {
        ...item,
        subItems: deleteItemRecursive(item.subItems, itemId)
      };
    }
    return item;
  });
}

export function deleteItem(
  categories: BudgetCategory[],
  categoryId: string,
  itemId: string
): BudgetCategory[] {
  // Si on supprime une catégorie entière
  if (categoryId === itemId) {
    return categories.filter(category => 
      category.id !== categoryId || category.id === 'social-charges'
    );
  }

  // Sinon, supprimer un élément dans une catégorie
  return categories.map(category => {
    if (category.id !== categoryId) return category;

    return {
      ...category,
      items: deleteItemRecursive(category.items, itemId)
    };
  });
}

export function updateItem(
  categories: BudgetCategory[],
  categoryId: string,
  itemId: string,
  updates: Partial<BudgetLine>
): BudgetCategory[] {
  return categories.map(category => {
    if (category.id !== categoryId) return category;

    const updateItems = (items: BudgetLine[]): BudgetLine[] => {
      return items.map(item => {
        if (item.id === itemId) {
          return { ...item, ...updates };
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