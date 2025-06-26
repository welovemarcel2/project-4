import { CurrencyCode } from './currency';
import { Distribution } from './distribution';

export type BudgetUnit = 'Jour' | 'Forfait' | 'Semaine' | 'Heure' | 'Unités' | '%' | '-';

export const PROTECTED_UNITS: BudgetUnit[] = ['%'];

export type BudgetItemType = 'category' | 'subCategory' | 'post' | 'subPost';

export interface BudgetLine {
  id: string;
  type: BudgetItemType;
  name: string;
  parentId: string | null;
  quantity: number;
  number: number;
  unit: BudgetUnit;
  rate: number;
  cost?: number; // Added cost field
  selectedCategories?: string[];
  calculatedAmount?: number;
  overtime?: number;
  overtimeDetails?: string;
  socialCharges: string;
  socialChargeRate?: number;
  agencyPercent: number;
  marginPercent: number;
  subItems: BudgetLine[];
  isExpanded?: boolean;
  currency?: CurrencyCode;
  distributions?: Distribution[];
  includeSocialCharges?: boolean;
  includeSocialChargesInDistribution?: boolean;
  comments?: string;
  applySocialChargesMargins?: boolean;
  isNewPost?: boolean;
  comment?: {
    text: string;
    checked: boolean;
  };
  tarifRef?: { nameFr: string; nameEn: string; pricingBase?: string };
  availableUnits?: string[];
  tarifVariants?: any[];
}

export interface BudgetCategory {
  id: string;
  name: string;
  items: BudgetLine[];
  isExpanded: boolean;
}