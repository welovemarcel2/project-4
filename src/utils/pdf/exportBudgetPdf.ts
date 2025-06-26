import { Project } from '../../types/project';
import { BudgetCategory, BudgetLine } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';
import { calculateTotalCosts } from '../budgetCalculations/totals';

interface ExportBudgetPdfOptions {
  project: Project;
  budget: BudgetCategory[];
  settings: QuoteSettings;
  terms?: string;
  notes?: string;
}

function getSocialCharges(line: BudgetLine, settings: QuoteSettings) {
  if (!line.socialCharges) return null;
  const rate = settings.socialChargeRates.find(r => r.id === line.socialCharges);
  if (!rate) return null;
  const base = (line.quantity || 0) * (line.number || 0) * (line.rate || 0);
  const amount = base * rate.rate;
  return {
    label: rate.label || 'Charges sociales',
    amount
  };
}

function getCategoryTotal(category: BudgetCategory, settings: QuoteSettings) {
  let total = 0;
  category.items.forEach(item => {
    if (item.type === 'subCategory' && item.subItems) {
      item.subItems.forEach(sub => {
        total += (sub.quantity || 0) * (sub.number || 0) * (sub.rate || 0);
        const sc = getSocialCharges(sub, settings);
        if (sc) total += sc.amount;
      });
    } else {
      total += (item.quantity || 0) * (item.number || 0) * (item.rate || 0);
      const sc = getSocialCharges(item, settings);
      if (sc) total += sc.amount;
    }
  });
  return total;
}

function formatNumber(n: number | undefined | null | string) {
  // Convertir en nombre si c'est une chaîne
  const num = typeof n === 'string' ? Number(n) : n;
  
  // Vérifier si la valeur est valide
  if (num === undefined || num === null || isNaN(num) || typeof num !== 'number') {
    return '0,00';
  }
  
  // Vérifier que le nombre est fini
  if (!isFinite(num)) {
    return '0,00';
  }
  
  // Espace fine insécable pour les milliers
  return num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\s/g, '\u202F');
}

// Mapping français pour les labels dynamiques
const LABELS_FR: Record<string, string> = {
  client: 'Annonceur',
  agency: 'Agence',
  duration: 'Durée',
  format: 'Format',
  notes: 'Notes',
  product: 'Produit',
  location: 'Lieu de tournage',
  nbDays: 'Nb de jours',
  production: 'Production',
  reference: 'Référence',
  projectName: 'Nom du projet',
  projectType: 'Type de projet',
  summary: 'Résumé',
  informations: 'Informations',
  contact: 'Contact',
  version: 'Version',
};

export async function exportBudgetPdf({ project, budget, settings, terms, notes }: ExportBudgetPdfOptions) {
  const pdfMakeModule = await import('pdfmake/build/pdfmake');
  const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
  const pdfMake = (pdfMakeModule as any).default || pdfMakeModule;
  const pdfFonts = (pdfFontsModule as any).default || pdfFontsModule;
  pdfMake.addVirtualFileSystem(pdfFonts);

  const totals = calculateTotalCosts(budget, settings);
  const rate1Label = settings.rateLabels?.rate1Label || 'Frais généraux';
  const rate2Label = settings.rateLabels?.rate2Label || 'Marge';
  const currency = settings.selectedCurrency || 'EUR';
  const currencySymbol = settings.currencies?.find(c => c.code === currency)?.symbol || currency;

  // Génération dynamique du titre principal centré
  const infoStrings = [
    ...(settings.information ? [settings.information.agency, settings.information.advertiser, settings.information.product, settings.information.title, settings.information.projectType, settings.information.projectName] : []),
    ...(project.informations ? [project.informations.agency, project.informations.advertiser, project.informations.product, project.informations.title] : [])
  ].filter(v => typeof v === 'string' && v.trim() !== '');
  const titleText = `DEVIS ${settings.information?.title || project.informations?.title || project.name}`.trim();
  const title = {
    text: titleText,
    fontSize: 16,
    bold: true,
    alignment: 'center',
    margin: [0, 0, 0, 20]
  };

  // Deux colonnes d'infos projet/budget personnalisées dynamiques et traduites
  const leftStack: any[] = [];
  const rightStack: any[] = [];
  // Champs principaux + customFields
  const allEntries: [string, string][] = [];
  if (settings.information) {
    ['agency', 'advertiser', 'product', 'title', 'projectType', 'projectName'].forEach(key => {
      const value = (settings.information as any)[key];
      if (typeof value === 'string' && value.trim() !== '') allEntries.push([key, value]);
    });
    if (Array.isArray(settings.information.customFields)) {
      settings.information.customFields.forEach((f: any) => {
        if (f && f.title && f.content && f.content.trim() !== '') allEntries.push([f.title, f.content]);
      });
    }
  }
  if (project.informations) {
    ['agency', 'advertiser', 'product', 'title'].forEach(key => {
      const value = (project.informations as any)[key];
      if (typeof value === 'string' && value.trim() !== '') allEntries.push([key, value]);
    });
    if (Array.isArray(project.informations.customFields)) {
      project.informations.customFields.forEach((f: any) => {
        if (f && f.title && f.content && f.content.trim() !== '') allEntries.push([f.title, f.content]);
      });
    }
  }
  allEntries.slice(0, Math.ceil(allEntries.length / 2)).forEach(([key, value]) => {
    const label = LABELS_FR[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
    leftStack.push({ text: `${label} : ${value}` });
  });
  allEntries.slice(Math.ceil(allEntries.length / 2)).forEach(([key, value]) => {
    const label = LABELS_FR[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
    rightStack.push({ text: `${label} : ${value}` });
  });

  const infoColumns = {
    columns: [
      { width: '48%', stack: leftStack, alignment: 'left' },
      { width: '48%', stack: rightStack, alignment: 'right' }
    ],
    columnGap: '4%',
    margin: [0, 0, 0, 20]
  };

  // Résumé du projet (notes ou premier customField long)
  let summaryText = notes || '';
  if (!summaryText) {
    let customFields: any[] = [];
    if (settings.information && Array.isArray(settings.information.customFields)) {
      customFields = settings.information.customFields;
    } else if (project.informations && Array.isArray(project.informations.customFields)) {
      customFields = project.informations.customFields;
    }
    const longField = customFields.find(f => typeof f.content === 'string' && f.content.length > 30);
    if (longField) summaryText = longField.content;
  }
  const summarySection = [
    { text: 'Résumé du projet', style: 'sectionHeader' },
    { text: summaryText, margin: [0, 0, 0, 20] }
  ];

  // Tableau budgétaire synthétique (extrait, sans doublon de total)
  const budgetTableBody: any[] = [
    ['Poste', 'Qté', 'Unité', `Tarif (${currencySymbol})`, `Total (${currencySymbol})`]
  ];
  budget.forEach(category => {
    let catTotal = 0;
    let hasLine = false;
    category.items.forEach(item => {
      if (item.type === 'subCategory' && item.subItems) {
        item.subItems.forEach(sub => {
          hasLine = true;
          // S'assurer que les valeurs sont des nombres
          const quantity = Number(sub.quantity) || 0;
          const rate = Number(sub.rate) || 0;
          const total = quantity * rate;
          catTotal += total;
          budgetTableBody.push([
            String(sub.name || ''),
            quantity || '',
            String(sub.unit || ''),
            formatNumber(rate),
            formatNumber(total)
          ]);
        });
      } else {
        hasLine = true;
        // S'assurer que les valeurs sont des nombres
        const quantity = Number(item.quantity) || 0;
        const rate = Number(item.rate) || 0;
        const total = quantity * rate;
        catTotal += total;
        budgetTableBody.push([
          String(item.name || ''),
          quantity || '',
          String(item.unit || ''),
          formatNumber(rate),
          formatNumber(total)
        ]);
      }
    });
    if (hasLine) {
      budgetTableBody.push([
        { text: `TOTAL ${String(category.name || '').toUpperCase()}`, colSpan: 4, alignment: 'right', bold: true }, {}, {}, {},
        formatNumber(catTotal)
      ]);
    }
  });

  const budgetTable = {
    table: {
      widths: ['*', 'auto', 'auto', 'auto', 'auto'],
      body: budgetTableBody
    },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 20]
  };

  // Bloc totaux à droite, aligné et propre
  const totalsBlock = {
    columns: [
      { width: '*', text: '' },
      {
        width: 'auto',
        stack: [
          { text: `Sous-total : ${formatNumber(totals.baseCost)} ${currencySymbol}`, bold: true, alignment: 'right' },
          { text: `${rate1Label} : ${formatNumber(totals.agency)} ${currencySymbol}`, alignment: 'right' },
          { text: `Total général : ${formatNumber(totals.grandTotal)} ${currencySymbol}`, bold: true, alignment: 'right' }
        ]
      }
    ]
  };

  // Génération du PDF
  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    content: [
      title,
      infoColumns,
      ...summarySection,
      { text: 'Tableau budgétaire (extrait)', style: 'sectionHeader' },
      budgetTable,
      totalsBlock
    ],
    styles: {
      sectionHeader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5]
      }
    }
  };

  pdfMake.createPdf(docDefinition).download(`Budget_${settings.information?.projectName || project.name}.pdf`);
} 