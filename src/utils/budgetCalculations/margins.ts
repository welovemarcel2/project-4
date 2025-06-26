import { BudgetLine } from '../../types/budget';

export const calculateMargins = (
  line: BudgetLine,
  baseTotal: number
): { agency: number; margin: number } => {
  if (!baseTotal || baseTotal === 0) {
    return { agency: 0, margin: 0 };
  }

  const agencyPercent = line.agencyPercent || 0;
  const marginPercent = line.marginPercent || 0;

  // Les marges s'appliquent uniquement sur le coût de base
  const agency = baseTotal * (agencyPercent / 100);
  const margin = baseTotal * (marginPercent / 100);

  return { agency, margin };
};