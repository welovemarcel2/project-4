import { BudgetLine } from '../types/budget';

export function generateItemNumber(item: BudgetLine, parentNumbers: string[] = []): string {
  const currentLevel = [...parentNumbers, item.id];
  const numberParts = currentLevel.map((_, index) => 
    currentLevel.slice(0, index + 1).length
  );
  
  return numberParts.join('.');
}

export function getItemLevel(item: BudgetLine): number {
  switch (item.type) {
    case 'category': return 1;
    case 'subCategory': return 2;
    case 'post': return 3;
    case 'subPost': return 4;
    default: return 0;
  }
}