import { BudgetLine } from '../../../../types/budget';

export const sound: BudgetLine = {
  id: 'sound',
  type: 'subCategory',
  name: 'Son',
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
      id: 'sound-engineer',
      type: 'post',
      name: 'Ingénieur du son',
      parentId: 'sound',
      quantity: 5,
      number: 1,
      unit: 'Jour',
      rate: 400,
      socialCharges: '65',
      agencyPercent: 10,
      marginPercent: 15,
      subItems: []
    },
    {
      id: 'boom-op',
      type: 'post',
      name: 'Perchman',
      parentId: 'sound',
      quantity: 5,
      number: 1,
      unit: 'Jour',
      rate: 300,
      socialCharges: '65',
      agencyPercent: 10,
      marginPercent: 15,
      subItems: []
    }
  ]
};