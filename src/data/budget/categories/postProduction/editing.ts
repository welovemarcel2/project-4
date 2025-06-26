import { BudgetLine } from '../../../../types/budget';

export const editing: BudgetLine = {
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
      quantity: 8,
      number: 1,
      unit: 'Jour',
      rate: 400,
      socialCharges: '65',
      agencyPercent: 10,
      marginPercent: 15,
      subItems: []
    },
    {
      id: 'assistant-editor',
      type: 'post',
      name: 'Assistant monteur',
      parentId: 'editing',
      quantity: 8,
      number: 1,
      unit: 'Jour',
      rate: 250,
      socialCharges: '65',
      agencyPercent: 10,
      marginPercent: 15,
      subItems: []
    }
  ]
};