export type BudgetUnit = 'Jour' | 'Forfait' | 'Semaine' | 'Heure' | 'Variable';

export type BudgetItemType = 'category' | 'subCategory' | 'post' | 'subPost' | 'detail' | 'variable';

export interface BudgetLine {
  id: string;
  type: BudgetItemType;
  name: string;
  parentId: string | null;
  quantity: number;
  number: number;
  unit: BudgetUnit;
  rate: number;
  overtime?: number;
  overtimeDetails?: string;
  socialCharges: string;
  agencyPercent: number;
  marginPercent: number;
  subItems: BudgetLine[];
  isExpanded?: boolean;
}

export interface BudgetCategory {
  id: string;
  name: string;
  items: BudgetLine[];
  isExpanded: boolean;
}