import { BudgetCategory } from '../../types/budget';

export const production: BudgetCategory = {
  id: 'production',
  name: 'Production',
  isExpanded: true,
  items: [
    {
      id: 'direction',
      type: 'subCategory',
      name: 'Direction',
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
          quantity: 3, // Réduit de 5 à 3 car 2 jours sont en préparation
          number: 1,
          unit: 'Jour',
          rate: 800,
          socialCharges: '3',
          agencyPercent: 10,
          marginPercent: 15,
          isExpanded: true,
          subItems: [
            {
              id: 'director-prep',
              type: 'subPost',
              name: 'Préparation',
              parentId: 'director',
              quantity: 2,
              number: 1,
              unit: 'Jour',
              rate: 800,
              socialCharges: '3',
              agencyPercent: 10,
              marginPercent: 15,
              subItems: []
            }
          ]
        }
      ]
    },
    {
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
          quantity: 4, // Réduit de 5 à 4 car 1 jour est en préparation
          number: 1,
          unit: 'Jour',
          rate: 700,
          socialCharges: '65',
          agencyPercent: 10,
          marginPercent: 15,
          isExpanded: true,
          subItems: [
            {
              id: 'dop-prep',
              type: 'subPost',
              name: 'Préparation',
              parentId: 'dop',
              quantity: 1,
              number: 1,
              unit: 'Jour',
              rate: 700,
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