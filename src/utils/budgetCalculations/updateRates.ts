import { BudgetLine } from '../../types/budget';

export function updateItemWithRates(
  item: BudgetLine,
  rateId: string,
  updates: { agencyPercent?: number; marginPercent?: number }
): BudgetLine {
  const updatedItem = { ...item };

  if (item.socialCharges === rateId) {
    if (updates.agencyPercent !== undefined) {
      updatedItem.agencyPercent = updates.agencyPercent;
    }
    if (updates.marginPercent !== undefined) {
      updatedItem.marginPercent = updates.marginPercent;
    }
  }

  if (item.subItems) {
    updatedItem.subItems = item.subItems.map(subItem => 
      updateItemWithRates(subItem, rateId, updates)
    );
  }

  return updatedItem;
}