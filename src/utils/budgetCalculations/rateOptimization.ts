const PRECISION = 1e-10;

interface OptimalRates {
  agencyRate: number;
  marginRate: number;
}

export function calculateOptimalRates(
  baseCost: number,
  targetTotal: number,
  agencyRatio: number
): OptimalRates {
  if (baseCost <= 0) {
    throw new Error("Le coût de base doit être positif");
  }

  if (targetTotal <= baseCost) {
    throw new Error("Le montant total doit être supérieur au coût de base");
  }

  // Calcul du pourcentage total nécessaire pour atteindre le montant cible
  const totalMarginPercent = ((targetTotal / baseCost) - 1) * 100;

  // Les frais généraux sont mis à 0
  const agencyRate = 0;
  // Toute la différence est mise sur la marge
  const marginRate = totalMarginPercent;

  // Vérification que le montant obtenu correspond bien au montant cible
  const calculatedTotal = baseCost * (1 + agencyRate/100 + marginRate/100);
  if (Math.abs(calculatedTotal - targetTotal) > PRECISION) {
    throw new Error("Impossible d'atteindre exactement ce montant");
  }

  return {
    agencyRate: 0, // FG toujours à 0
    marginRate    // Garde la précision complète pour la marge
  };
}