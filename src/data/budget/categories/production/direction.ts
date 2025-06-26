import { BudgetLine } from '../../../../types/budget';

export const direction: BudgetLine = {
  id: 'direction',
  type: 'subCategory',
  name: 'Mise en scène',
  parentId: 'production',
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
      id: 'director',
      type: 'post',
      name: 'Réalisateur',
      parentId: 'direction',
      quantity: 5,
      number: 1,
      unit: 'Jour',
      rate: 800,
      socialCharges: '3',
      agencyPercent: 10,
      marginPercent: 15,
      subItems: []
    },
    {
      id: 'first-ad',
      type: 'post',
      name: '1er Assistant réalisateur',
      parentId: 'direction',
      quantity: 5,
      number: 1,
      unit: 'Jour',
      rate: 350,
      socialCharges: '65',
      agencyPercent: 10,
      marginPercent: 15,
      subItems: []
    }
  ]
};