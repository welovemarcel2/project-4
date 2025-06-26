import { BudgetCategory } from '../../types/budget';

export const socialCharges: BudgetCategory = {
  id: 'social-charges',
  name: 'Charges Sociales',
  isExpanded: true,
  items: [
    {
      id: 'technicians',
      type: 'post',
      name: 'Techniciens',
      parentId: 'social-charges',
      quantity: 1,
      number: 1,
      unit: 'Forfait',
      rate: 0,
      socialCharges: '',
      agencyPercent: 0,
      marginPercent: 0,
      subItems: []
    },
    {
      id: 'artists',
      type: 'post',
      name: 'Artistes',
      parentId: 'social-charges',
      quantity: 1,
      number: 1,
      unit: 'Forfait',
      rate: 0,
      socialCharges: '',
      agencyPercent: 0,
      marginPercent: 0,
      subItems: []
    },
    {
      id: 'authors',
      type: 'post',
      name: 'Auteurs',
      parentId: 'social-charges',
      quantity: 1,
      number: 1,
      unit: 'Forfait',
      rate: 0,
      socialCharges: '',
      agencyPercent: 0,
      marginPercent: 0,
      subItems: []
    }
  ]
};