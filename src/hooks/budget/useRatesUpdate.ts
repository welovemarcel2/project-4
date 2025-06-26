import { BudgetCategory, BudgetLine } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';

export function updateItemRates(item: BudgetLine, settings: QuoteSettings): BudgetLine {
  const updatedItem = {
    ...item,
    agencyPercent: settings.defaultAgencyPercent,
    marginPercent: settings.defaultMarginPercent
  };

  if (item.subItems) {
    updatedItem.subItems = item.subItems.map(subItem => 
      updateItemRates(subItem, settings)
    );
  }

  return updatedItem;
}

export function updateAllRates(
  categories: BudgetCategory[],
  settings: QuoteSettings
): BudgetCategory[] {
  return categories.map(category => ({
    ...category,
    items: category.items.map(item => updateItemRates(item, settings))
  }));
}