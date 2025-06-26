import { Project } from '../../types/project';
import { BudgetCategory, BudgetLine } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';
import { calculateTotalCosts } from '../budgetCalculations/totals';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportBudgetPdfOptions {
  project: Project;
  budget: BudgetCategory[];
  settings: QuoteSettings;
  terms?: string;
  notes?: string;
}

function formatNumber(n: number | undefined | null | string): string {
  const num = typeof n === 'string' ? Number(n) : n;
  
  if (num === undefined || num === null || isNaN(num) || typeof num !== 'number' || !isFinite(num)) {
    return '0,00';
  }
  
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

function createPDFElement({ project, budget, settings, terms, notes }: ExportBudgetPdfOptions): HTMLElement {
  const totals = calculateTotalCosts(budget, settings);
  const rate1Label = settings.rateLabels?.rate1Label || 'Frais généraux';
  const rate2Label = settings.rateLabels?.rate2Label || 'Marge';
  const currency = settings.selectedCurrency || 'EUR';
  const currencySymbol = settings.currencies?.find(c => c.code === currency)?.symbol || currency;

  // Génération du titre
  const titleText = `DEVIS ${settings.information?.title || project.informations?.title || project.name}`.trim();

  // Génération des colonnes d'infos
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

  // Résumé du projet
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

  // Génération du tableau budgétaire
  let budgetTableRows = '';
  budget.forEach(category => {
    let catTotal = 0;
    let hasLine = false;
    
    category.items.forEach(item => {
      if (item.type === 'subCategory' && item.subItems) {
        item.subItems.forEach(sub => {
          hasLine = true;
          const quantity = Number(sub.quantity) || 0;
          const rate = Number(sub.rate) || 0;
          const total = quantity * rate;
          catTotal += total;
          
          budgetTableRows += `
            <tr>
              <td>${String(sub.name || '')}</td>
              <td style="text-align: center;">${quantity || ''}</td>
              <td style="text-align: center;">${String(sub.unit || '')}</td>
              <td style="text-align: right;">${formatNumber(rate)}</td>
              <td style="text-align: right;">${formatNumber(total)}</td>
            </tr>
          `;
        });
      } else {
        hasLine = true;
        const quantity = Number(item.quantity) || 0;
        const rate = Number(item.rate) || 0;
        const total = quantity * rate;
        catTotal += total;
        
        budgetTableRows += `
          <tr>
            <td>${String(item.name || '')}</td>
            <td style="text-align: center;">${quantity || ''}</td>
            <td style="text-align: center;">${String(item.unit || '')}</td>
            <td style="text-align: right;">${formatNumber(rate)}</td>
            <td style="text-align: right;">${formatNumber(total)}</td>
          </tr>
        `;
      }
    });
    
    if (hasLine) {
      budgetTableRows += `
        <tr style="background-color: #dbeafe; font-weight: bold;">
          <td colspan="4" style="text-align: right;">TOTAL ${String(category.name || '').toUpperCase()}</td>
          <td style="text-align: right;">${formatNumber(catTotal)}</td>
        </tr>
      `;
    }
  });

  // Génération des colonnes d'infos
  const leftColumn = allEntries.slice(0, Math.ceil(allEntries.length / 2))
    .map(([key, value]) => {
      const label = LABELS_FR[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
      return `<div style="margin-bottom: 0.5rem;"><strong>${label} :</strong> ${value}</div>`;
    }).join('');

  const rightColumn = allEntries.slice(Math.ceil(allEntries.length / 2))
    .map(([key, value]) => {
      const label = LABELS_FR[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
      return `<div style="margin-bottom: 0.5rem;"><strong>${label} :</strong> ${value}</div>`;
    }).join('');

  // Créer l'élément HTML
  const container = document.createElement('div');
  container.style.cssText = `
    width: 210mm;
    min-height: 297mm;
    padding: 20mm;
    margin: 0 auto;
    background: white;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    box-sizing: border-box;
  `;

  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 2rem; border-bottom: 2px solid #2563eb; padding-bottom: 1rem;">
      <h1 style="font-size: 1.5rem; font-weight: bold; color: #1e40af; margin: 0;">${titleText}</h1>
    </div>
    
    <div style="display: flex; justify-content: space-between; margin-bottom: 2rem; gap: 2rem;">
      <div style="flex: 1;">
        ${leftColumn}
      </div>
      <div style="flex: 1;">
        ${rightColumn}
      </div>
    </div>
    
    ${summaryText ? `
      <div style="margin-bottom: 2rem; padding: 1rem; background-color: #f8fafc; border-left: 4px solid #2563eb;">
        <div style="font-size: 1.1rem; font-weight: bold; margin-bottom: 0.5rem; color: #1e40af;">Résumé du projet</div>
        <div>${summaryText}</div>
      </div>
    ` : ''}
    
    <h2 style="color: #1e40af; margin-bottom: 1rem;">Tableau budgétaire (extrait)</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem; font-size: 0.85rem;">
      <thead>
        <tr>
          <th style="background-color: #2563eb; color: white; padding: 0.75rem; text-align: left; font-weight: bold;">Poste</th>
          <th style="background-color: #2563eb; color: white; padding: 0.75rem; text-align: center; font-weight: bold;">Qté</th>
          <th style="background-color: #2563eb; color: white; padding: 0.75rem; text-align: center; font-weight: bold;">Unité</th>
          <th style="background-color: #2563eb; color: white; padding: 0.75rem; text-align: right; font-weight: bold;">Tarif (${currencySymbol})</th>
          <th style="background-color: #2563eb; color: white; padding: 0.75rem; text-align: right; font-weight: bold;">Total (${currencySymbol})</th>
        </tr>
      </thead>
      <tbody>
        ${budgetTableRows}
      </tbody>
    </table>
    
    <div style="text-align: right; margin-top: 2rem;">
      <div style="margin-bottom: 0.5rem; font-size: 0.9rem;">
        <strong>Sous-total :</strong> ${formatNumber(totals.baseCost)} ${currencySymbol}
      </div>
      <div style="margin-bottom: 0.5rem; font-size: 0.9rem;">
        <strong>${rate1Label} :</strong> ${formatNumber(totals.agency)} ${currencySymbol}
      </div>
      <div style="font-size: 1.1rem; font-weight: bold; color: #1e40af; border-top: 2px solid #2563eb; padding-top: 0.5rem; margin-top: 1rem;">
        <strong>Total général :</strong> ${formatNumber(totals.grandTotal)} ${currencySymbol}
      </div>
    </div>
  `;

  return container;
}

export async function exportBudgetPdfClient(options: ExportBudgetPdfOptions): Promise<void> {
  try {
    // Créer l'élément HTML
    const element = createPDFElement(options);
    
    // Ajouter temporairement au DOM (hors écran)
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.top = '0';
    document.body.appendChild(element);

    try {
      // Convertir en canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Meilleure qualité
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 210 * 3.779527559, // A4 width en pixels (210mm)
        height: 297 * 3.779527559, // A4 height en pixels (297mm)
      });

      // Créer le PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Calculer les dimensions
      const imgWidth = 210; // A4 width en mm
      const pageHeight = 297; // A4 height en mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Ajouter la première page
      pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Ajouter des pages supplémentaires si nécessaire
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Télécharger le PDF
      const fileName = `Budget_${options.settings.information?.projectName || options.project.name}.pdf`;
      pdf.save(fileName);

    } finally {
      // Nettoyer - retirer l'élément du DOM
      document.body.removeChild(element);
    }

  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    throw error;
  }
} 