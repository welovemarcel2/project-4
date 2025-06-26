import { BudgetItemType } from '../../../types/budget';

interface RowStyles {
  row: string;
  cell: string;
  input: string;
}

export function useRowStyles(type: BudgetItemType): RowStyles {
  const baseRow = "group border-b hover:bg-gray-50/80";
  const baseCell = "px-1.5 py-1";
  const baseInput = "bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1";

  switch (type) {
    case 'category':
      return {
        row: `${baseRow} bg-blue-200/70`,
        cell: `${baseCell}`,
        input: `${baseInput} text-xs font-semibold`
      };
    
    case 'subCategory':
      return {
        row: `${baseRow} bg-blue-50 w-full`,
        cell: `${baseCell}`,
        input: `${baseInput} text-xs font-medium`
      };
    
    case 'post':
      return {
        row: `${baseRow}`,
        cell: `${baseCell}`,
        input: `${baseInput} text-xs`
      };
    
    case 'subPost':
      return {
        row: `${baseRow} bg-gray-50/30`,
        cell: `${baseCell}`,
        input: `${baseInput} text-xs italic`
      };
  }
}