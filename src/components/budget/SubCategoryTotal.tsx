import React from 'react';
import { BudgetLine } from '../../types/budget';
import { formatNumber } from '../../utils/formatNumber';

interface SubCategoryTotalProps {
  // Les items doivent déjà avoir leur total dans la devise du budget !
  items: { total: number }[];
  selectedCurrency: string;
}

// Ce composant n'affiche plus rien, il est conservé pour compatibilité mais retourne null
export function SubCategoryTotal() {
  return null;
}