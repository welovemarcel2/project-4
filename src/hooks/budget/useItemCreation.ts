import { BudgetCategory, BudgetLine, BudgetItemType } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';
import { generateId } from '../../utils/generateId';

const getDefaultName = (type: BudgetItemType): string => {
  switch (type) {
    case 'category': return 'Nouvelle catégorie';
    case 'subCategory': return 'Nouvelle sous-catégorie';
    case 'post': return 'Nouveau poste';
    case 'subPost': return 'Nouveau sous-poste';
  }
};

// Fonction pour trouver la ligne précédente du même type
function findPreviousItem(
  categories: BudgetCategory[],
  categoryId: string | null,
  parentId: string | null,
  type: BudgetItemType
): BudgetLine | null {
  // Si c'est une catégorie, on cherche la dernière catégorie
  if (type === 'category') {
    if (categories.length === 0) return null;
    return {
      ...categories[categories.length - 1],
      type: 'category'
    };
  }

  // Si c'est une sous-catégorie, on cherche dans la catégorie spécifiée
  if (type === 'subCategory' && categoryId) {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category || category.items.length === 0) return null;
    
    // Trouver la dernière sous-catégorie
    const lastSubCategory = [...category.items]
      .filter(item => item.type === 'subCategory')
      .pop();
    
    return lastSubCategory || null;
  }

  // Si c'est un poste ou sous-poste, on cherche dans le parent spécifié
  if ((type === 'post' || type === 'subPost') && categoryId) {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return null;

    // Si on a un parentId, on cherche dans les sous-items du parent
    if (parentId) {
      // Fonction récursive pour trouver un item par son ID
      const findItemById = (items: BudgetLine[], id: string): BudgetLine | null => {
        for (const item of items) {
          if (item.id === id) return item;
          if (item.subItems && item.subItems.length > 0) {
            const found = findItemById(item.subItems, id);
            if (found) return found;
          }
        }
        return null;
      };

      const parentItem = findItemById(category.items, parentId);
      if (!parentItem || !parentItem.subItems || parentItem.subItems.length === 0) return null;

      // Trouver le dernier item du même type
      const lastItem = [...parentItem.subItems]
        .filter(item => item.type === type)
        .pop();
      
      return lastItem || null;
    }
    
    // Si on n'a pas de parentId, on cherche dans les items de la catégorie
    const lastItem = [...category.items]
      .filter(item => item.type === type)
      .pop();
    
    return lastItem || null;
  }

  return null;
}

export function createBudgetItem(
  type: BudgetItemType,
  parentId: string | null,
  settings: QuoteSettings,
  categories: BudgetCategory[] = [],
  categoryId: string | null = null,
  isWorkTable: boolean = false
): BudgetLine {
  // Pour les catégories
  if (type === 'category') {
    return {
      id: generateId(),
      type,
      parentId,
      name: getDefaultName(type),
      quantity: 0,
      number: 1,
      unit: 'Jour',
      rate: 0,
      socialCharges: '',
      agencyPercent: settings.defaultAgencyPercent !== undefined ? settings.defaultAgencyPercent : 10,
      marginPercent: settings.defaultMarginPercent !== undefined ? settings.defaultMarginPercent : 15,
      subItems: [],
      isExpanded: true
    };
  }
  
  // Pour les sous-catégories
  if (type === 'subCategory') {
    return {
      id: generateId(),
      type,
      parentId,
      name: getDefaultName(type),
      quantity: 0,
      number: 0,
      unit: '-',
      rate: 0,
      socialCharges: '',
      agencyPercent: settings.defaultAgencyPercent !== undefined ? settings.defaultAgencyPercent : 10,
      marginPercent: settings.defaultMarginPercent !== undefined ? settings.defaultMarginPercent : 15,
      subItems: [],
      isExpanded: true
    };
  }
  
  // Pour les postes et sous-postes
  if (isWorkTable) {
    // Dans l'onglet Travail, toujours utiliser des tirets
    return {
      id: generateId(),
      type,
      parentId,
      name: getDefaultName(type),
      quantity: 0,
      number: 0,
      unit: '-',
      rate: 0,
      socialCharges: '',
      agencyPercent: settings.defaultAgencyPercent !== undefined ? settings.defaultAgencyPercent : 10,
      marginPercent: settings.defaultMarginPercent !== undefined ? settings.defaultMarginPercent : 15,
      subItems: [],
      isExpanded: true
    };
  } else {
    // Dans l'onglet Budget, chercher le poste précédent pour copier ses valeurs
    const previousItem = findPreviousItem(categories, categoryId, parentId, type);
    
    if (previousItem) {
      // Copier les valeurs du poste précédent, y compris les charges sociales
      return {
        id: generateId(),
        type,
        parentId,
        name: getDefaultName(type),
        quantity: previousItem.quantity || 0,
        number: previousItem.number || 0,
        unit: previousItem.unit || '-',
        rate: previousItem.rate || 0,
        socialCharges: previousItem.socialCharges || '', // Hériter des charges sociales du poste précédent
        agencyPercent: settings.defaultAgencyPercent !== undefined ? settings.defaultAgencyPercent : (previousItem.agencyPercent || 10),
        marginPercent: settings.defaultMarginPercent !== undefined ? settings.defaultMarginPercent : (previousItem.marginPercent || 15),
        subItems: [],
        isExpanded: true
      };
    }
    
    // Si aucun poste précédent n'est trouvé, utiliser les valeurs par défaut
    return {
      id: generateId(),
      type,
      parentId,
      name: getDefaultName(type),
      quantity: 0,
      number: 0,
      unit: '-',
      rate: 0,
      socialCharges: '', // Pas de charges sociales par défaut
      agencyPercent: settings.defaultAgencyPercent !== undefined ? settings.defaultAgencyPercent : 10,
      marginPercent: settings.defaultMarginPercent !== undefined ? settings.defaultMarginPercent : 15,
      subItems: [],
      isExpanded: true
    };
  }
}

export function addItemToCategories(
  categories: BudgetCategory[],
  categoryId: string | null,
  parentId: string | null,
  newItem: BudgetLine
): BudgetCategory[] {
  // Si c'est une nouvelle catégorie, l'ajouter avant les charges sociales
  if (newItem.type === 'category') {
    const socialChargesIndex = categories.findIndex(cat => cat.id === 'social-charges');
    const insertIndex = socialChargesIndex === -1 ? categories.length : socialChargesIndex;
    const newCategories = [...categories];
    newCategories.splice(insertIndex, 0, {
      id: newItem.id,
      name: newItem.name,
      isExpanded: true,
      items: []
    });
    return newCategories;
  }

  return categories.map(category => {
    if (category.id !== categoryId) return category;

    if (!parentId) {
      return {
        ...category,
        items: [...category.items, newItem]
      };
    }

    const updateItems = (items: BudgetLine[]): BudgetLine[] => {
      return items.map(item => {
        if (item.id === parentId) {
          return {
            ...item,
            subItems: [...(item.subItems || []), newItem]
          };
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