import { BudgetCategory } from '../../types/budget';

export const postProduction: BudgetCategory = {
  id: 'post-production',
  name: 'Post-production',
  isExpanded: true,
  items: [
    {
      id: 'editing',
      type: 'subCategory',
      name: 'Montage',
      parentId: 'post-production',
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
          id: 'editor',
          type: 'post',
          name: 'Monteur',
          parentId: 'editing',
          quantity: 5, // Réduit de 8 à 5 car 3 jours sont pour l'ours
          number: 1,
          unit: 'Jour',
          rate: 400,
          socialCharges: '65',
          agencyPercent: 10,
          marginPercent: 15,
          isExpanded: true,
          subItems: [
            {
              id: 'editor-rough-cut',
              type: 'subPost',
              name: 'Ours',
              parentId: 'editor',
              quantity: 3,
              number: 1,
              unit: 'Jour',
              rate: 400,
              socialCharges: '65',
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