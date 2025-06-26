import { BudgetCategory, BudgetLine, BudgetItemType } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';
import { generateId } from '../generateId';

// Function to find the previous item of the same type
function findPreviousItem(
  categories: BudgetCategory[],
  categoryId: string | null,
  parentId: string | null,
  type: BudgetItemType
): BudgetLine | null {
  // If it's a category, find the last category
  if (type === 'category') {
    if (categories.length === 0) return null;
    const lastCategory = categories[categories.length - 1];
    return {
      ...lastCategory,
      type: 'category' as BudgetItemType
    };
  }

  // Find the target category
  const category = categories.find(cat => cat.id === categoryId);
  if (!category) return null;

  // For subcategories, find the last subcategory in the category
  if (type === 'subCategory') {
    const subcategories = category.items.filter(item => item.type === 'subCategory');
    return subcategories[subcategories.length - 1] || null;
  }

  // For posts and subposts
  const findInItems = (items: BudgetLine[]): BudgetLine | null => {
    // If we have a parent ID, look for siblings under that parent
    if (parentId) {
      for (const item of items) {
        if (item.id === parentId && item.subItems) {
          const siblings = item.subItems.filter(si => si.type === type);
          return siblings[siblings.length - 1] || null;
        }
        if (item.subItems) {
          const found = findInItems(item.subItems);
          if (found) return found;
        }
      }
    } else {
      // Otherwise find the last item of the same type at this level
      const sameTypeItems = items.filter(item => item.type === type);
      return sameTypeItems[sameTypeItems.length - 1] || null;
    }
    return null;
  };

  return findInItems(category.items);
}

const getDefaultName = (type: BudgetItemType): string => {
  switch (type) {
    case 'category': return 'Nouvelle catégorie';
    case 'subCategory': return 'Nouvelle sous-catégorie';
    case 'post': return 'Nouveau poste';
    case 'subPost': return 'Nouveau sous-poste';
  }
};

export function createBudgetItem(
  type: BudgetItemType,
  parentId: string | null,
  settings: QuoteSettings,
  categories: BudgetCategory[] = [],
  categoryId: string | null = null,
  isWorkTable: boolean = false,
  quoteId: string | null = null
): BudgetLine {
  // Pour les catégories
  if (type === 'category') {
    return {
      id: generateId(),
      type,
      parentId: null,
      name: getDefaultName(type),
      quantity: 0,
      number: 1,
      unit: 'Jour',
      rate: 0,
      socialCharges: '',
      agencyPercent: settings.defaultAgencyPercent !== undefined ? settings.defaultAgencyPercent : 10,
      marginPercent: settings.defaultMarginPercent !== undefined ? settings.defaultMarginPercent : 15,
      subItems: [],
      isExpanded: true,
      settings: null
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
      isExpanded: true,
      settings: null
    };
  }
  
  // Pour les postes et sous-postes
  const previousItem = findPreviousItem(categories, categoryId, parentId, type);
  const isNewPost = isWorkTable && (type === 'post' || type === 'subPost');
  return {
    id: generateId(),
    type,
    parentId,
    name: getDefaultName(type),
    quantity: previousItem?.quantity || 0,
    number: previousItem?.number || 0,
    unit: previousItem?.unit || '-',
    rate: previousItem?.rate || 0,
    socialCharges: previousItem?.socialCharges || '',
    agencyPercent: settings.defaultAgencyPercent !== undefined ? settings.defaultAgencyPercent : (previousItem?.agencyPercent || 10),
    marginPercent: settings.defaultMarginPercent !== undefined ? settings.defaultMarginPercent : (previousItem?.marginPercent || 15),
    subItems: [],
    isExpanded: true,
    settings: null,
    ...(isNewPost ? { isNewPost: true } : {})
  };
}