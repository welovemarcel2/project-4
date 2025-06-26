import { BudgetTemplate } from '../types/templates';
import { BudgetCategory, BudgetLine, BudgetItemType } from '../types/budget';
import { QuoteSettings, NumberingFormat } from '../types/quoteSettings';
import Papa from 'papaparse';
import { formatItemNumber, toAlphabetic, toRoman } from './formatItemNumber';

// Fonction pour aplatir la structure hiérarchique du budget
function flattenBudget(budget: BudgetCategory[], settings?: QuoteSettings): any[] {
  const rows: any[] = [];
  const numbering = settings?.numbering;

  // Parcourir chaque catégorie
  budget.forEach((category, categoryIndex) => {
    // Formater le numéro de catégorie selon les paramètres
    const categoryNumber = numbering 
      ? formatItemNumber(
          [categoryIndex + 1],
          [numbering.category],
          numbering.separator
        )
      : (categoryIndex + 1).toString();
    
    // Ajouter la catégorie
    rows.push({
      level: categoryNumber,
      name: category.name,
      unit: '',
      price: '',
      cost: ''
    });

    // Parcourir les items de la catégorie
    category.items.forEach((item, itemIndex) => {
      // Formater le numéro de l'item selon les paramètres
      const itemLevel = numbering
        ? formatItemNumber(
            [categoryIndex + 1, itemIndex + 1],
            [numbering.category, numbering.subCategory],
            numbering.separator
          )
        : `${categoryNumber}.${itemIndex + 1}`;
      
      // Ajouter l'item avec son niveau hiérarchique
      addItemToRows(rows, item, itemLevel, categoryNumber, numbering);
    });
  });

  return rows;
}

// Fonction récursive pour ajouter un item et ses sous-items
function addItemToRows(
  rows: any[], 
  item: BudgetLine, 
  level: string, 
  parentLevel: string,
  numbering?: QuoteSettings['numbering']
): void {
  // Ajouter l'item
  rows.push({
    level,
    name: item.name,
    unit: item.unit,
    price: item.rate,
    cost: item.cost !== undefined ? item.cost : item.rate
  });

  // Ajouter les sous-items s'il y en a
  if (item.subItems && item.subItems.length > 0) {
    const parts = level.split(numbering?.separator || '.');
    const currentDepth = parts.length;
    
    item.subItems.forEach((subItem, index) => {
      // Déterminer le format de numérotation approprié en fonction de la profondeur
      let subItemFormat: NumberingFormat = 'numeric';
      if (numbering) {
        if (currentDepth === 2) subItemFormat = numbering.post;
        else if (currentDepth === 3) subItemFormat = numbering.subPost;
      }
      
      // Formater le numéro du sous-item
      const subItemLevel = numbering
        ? `${level}${numbering.separator}${formatNumber(index + 1, subItemFormat)}`
        : `${level}.${index + 1}`;
      
      addItemToRows(rows, subItem, subItemLevel, level, numbering);
    });
  }
}

// Fonction pour formater un nombre selon le format spécifié
function formatNumber(num: number, format: NumberingFormat): string {
  switch (format) {
    case 'numeric':
      return num.toString();
    case 'alphabetic':
      return toAlphabetic(num);
    case 'roman':
      return toRoman(num);
    case 'none':
      return '';
    default:
      return num.toString();
  }
}

// Fonction pour calculer le total d'un item
function calculateItemTotal(item: BudgetLine): number {
  const baseTotal = (item.quantity || 0) * (item.number || 0) * (item.rate || 0);
  return baseTotal;
}

// Fonction principale pour exporter un modèle en CSV
export function exportTemplateToCSV(template: BudgetTemplate, settings?: QuoteSettings): void {
  // Aplatir la structure du budget en utilisant les paramètres de numérotation
  const flatData = flattenBudget(template.budget, settings);

  // Convertir en CSV
  const csv = Papa.unparse(flatData, {
    delimiter: ';',
    header: true
  });

  // Créer un blob et un lien de téléchargement
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${template.name.replace(/\s+/g, '_')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}