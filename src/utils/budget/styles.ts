import { BudgetLine, BudgetCategory } from '../../types/budget';

export function getCategoryStyle(): string {
  return 'bg-blue-100/50 h-8 border-b border-blue-200/50';
}

export function getCategoryInputStyle(): string {
  return 'bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-0.5 text-xs font-bold uppercase tracking-wide text-blue-900';
}

export function getRowStyle(item: BudgetLine, hasSubItems: boolean): string {
  switch (item.type) {
    case 'subCategory':
      return 'bg-blue-50/30 font-semibold text-blue-800 text-[11px]';
    case 'post':
      return `${hasSubItems ? 'bg-gray-50/30' : ''} text-[11px]`;
    case 'subPost':
      return 'text-[11px] text-gray-600';
    default:
      return '';
  }
}

export function shouldShowExpandButton(item: BudgetLine, hasSubItems: boolean): boolean {
  return hasSubItems && item.type === 'post';
}

export function getInputStyle(item: BudgetLine): string {
  const base = "w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-0.5";
  
  switch (item.type) {
    case 'subCategory':
      return `${base} font-semibold text-blue-800 text-[11px]`;
    case 'post':
    case 'subPost':
      return `${base} text-[11px]`;
    default:
      return base;
  }
}