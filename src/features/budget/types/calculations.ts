export interface BudgetTotals {
  baseTotal: number;
  socialCharges: number;
  agency: number;
  margin: number;
}

export interface CategoryTotals extends BudgetTotals {
  marginPercentage: number;
  grandTotal: number;
}

export interface SocialChargesByType {
  [key: string]: number;
}