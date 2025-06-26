import { BudgetLine } from '../../../../types/budget';

export const image: BudgetLine = {
  id: 'image',
  type: 'subCategory',
  name: 'Image',
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
      id: 'dop',
      type: 'post',
      name: 'Directeur de la photographie',
      parentId: 'image',
      quantity: 5,
      number: 1,
      unit: 'Jour',
      rate: 800,
      socialCharges: '65',
      agencyPercent: 10,
      marginPercent: 15,
      subItems: []
    },
    {
      id: 'camera-op',
      type: 'post',
      name: 'Opérateur caméra',
      parentId: 'image',
      quantity: 5,
      number: 1,
      unit: 'Jour',
      rate: 450,
      socialCharges: '65',
      agencyPercent: 10,
      marginPercent: 15,
      subItems: []
    },
    {
      id: 'first-ac',
      type: 'post',
      name: '1er Assistant caméra',
      parentId: 'image',
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