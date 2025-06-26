export interface LineTotals {
  baseTotal: number;
  socialCharges: number;
  agency: number;
  margin: number;
  totalCost: number;
}

export interface CategoryTotals extends LineTotals {
  marginPercentage: number;
  grandTotal: number;
}

export interface SocialChargesByType {
  [key: string]: number;
}