import { BudgetLine } from '../../../../types/budget';

export const soundPost: BudgetLine = {
  id: 'sound-post',
  type: 'subCategory',
  name: 'Post-production son',
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
      id: 'sound-editor',
      type: 'post',
      name: 'Monteur son',
      parentId: 'sound-post',
      quantity: 3,
      number: 1,
      unit: 'Jour',
      rate: 400,
      socialCharges: '65',
      agencyPercent: 10,
      marginPercent: 15,
      subItems: []
    },
    {
      id: 'mixer',
      type: 'post',
      name: 'Mixeur',
      parentId: 'sound-post',
      quantity: 2,
      number: 1,
      unit: 'Jour',
      rate: 450,
      socialCharges: '65',
      agencyPercent: 10,
      marginPercent: 15,
      subItems: []
    }
  ]
};