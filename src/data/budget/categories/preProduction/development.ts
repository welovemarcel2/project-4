import { BudgetLine } from '../../../../types/budget';

export const development: BudgetLine = {
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
      quantity: 5,
      number: 1,
      unit: 'Jour',
      rate: 450,
      socialCharges: '3',
      agencyPercent: 10,
      marginPercent: 15,
      subItems: []
    },
    {
      id: 'director-dev',
      type: 'post',
      name: 'Réalisateur - Développement',
      parentId: 'development',
      quantity: 3,
      number: 1,
      unit: 'Jour',
      rate: 800,
      socialCharges: '3',
      agencyPercent: 10,
      marginPercent: 15,
      subItems: []
    }
  ]
};