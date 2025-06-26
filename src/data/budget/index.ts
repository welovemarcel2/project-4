import { BudgetCategory } from '../../types/budget';
import { preProduction } from './categories/preProduction';
import { production } from './categories/production';
import { postProduction } from './categories/postProduction';
import { socialCharges } from './categories/socialCharges';

export const initialBudget: BudgetCategory[] = [
  preProduction,
  production,
  postProduction,
  socialCharges // Ajout de la catégorie des charges sociales
];