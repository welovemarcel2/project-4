import { BudgetLine } from '../../../../types/budget';

export const preparation: BudgetLine = {
  id: 'prep',
  type: 'subCategory',
  name: 'Préparation',
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
      id: 'director-prep',
      type: 'post',
      name: 'Réalisateur - Préparation',
      parentId: 'prep',
      quantity: 3,
      number: 1,
      unit: 'Jour',
      rate: 800,
      socialCharges: '3',
      agencyPercent: 10,
      marginPercent: 15,
      subItems: []
    },
    {
      id: 'producer-prep',
      type: 'post',
      name: 'Directeur de production',
      parentId: 'prep',
      quantity: 5,
      number: 1,
      unit: 'Jour',
      rate: 500,
      socialCharges: '65',
      agencyPercent: 10,
      marginPercent: 15,
      subItems: []
    }
  ]
};