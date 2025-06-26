export interface Distribution {
  id: string;
  name: string;
  amount: number;
  type: 'percentage' | 'fixed';
}

export interface DistributionCategory {
  id: string;
  name: string;
  color: string;
}

export interface DistributionData {
  distributions: Distribution[];
  includeSocialCharges: boolean;
}