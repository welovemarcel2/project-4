import { BudgetCategory } from '../../types/budget';

export const preProduction: BudgetCategory = {
  id: 'pre-production',
  name: 'Pré-production',
  isExpanded: true,
  items: [
    {
      id: 'development',
      type: 'subCategory',
      name: 'Développement',
      parentId: 'pre-production',
      quantity: 0,
      number: 0,
      unit: 'Jour',
      rate: 0,
      socialCharges: '',
      agencyPercent: 10,
      marginPercent: 15,
      isExpanded: true,
      subItems: [
        {
          id: 'script',
          type: 'post',
          name: 'Scénariste',
          parentId: 'development',
          quantity: 7, // Réduit de 10 à 7 car 3 jours sont en recherches
          number: 1,
          unit: 'Jour',
          rate: 450,
          socialCharges: '3',
          agencyPercent: 10,
          marginPercent: 15,
          isExpanded: true,
          subItems: [
            {
              id: 'script-research',
              type: 'subPost',
              name: 'Recherches',
              parentId: 'script',
              quantity: 3,
              number: 1,
              unit: 'Jour',
              rate: 450,
              socialCharges: '3',
              agencyPercent: 10,
              marginPercent: 15,
              subItems: []
            }
          ]
        }
      ]
    }
  ]
};