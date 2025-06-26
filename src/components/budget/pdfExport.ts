import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BudgetCategory } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';
import { formatNumber } from '../../utils/formatNumber';
import { calculateTotalCosts } from '../../utils/budgetCalculations/totals';

export async function exportToPDF(
  categories: BudgetCategory[],
  settings: QuoteSettings,
  notes: string
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Définir les marges et dimensions
  const margin = 15;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - 2 * margin;

  // Ajouter l'en-tête
  let yPos = margin;
  
  // Logo et informations de production
  if (settings.production.logo) {
    try {
      const img = new Image();
      img.src = settings.production.logo;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      const imgWidth = 40;
      const imgHeight = (img.height * imgWidth) / img.width;
      
      pdf.addImage(settings.production.logo, 'JPEG', margin, yPos, imgWidth, imgHeight);
      yPos += imgHeight + 5;
    } catch (error) {
      console.error('Error loading logo:', error);
      yPos += 10; // Espace si le logo ne charge pas
    }
  }

  // Informations de production
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  
  if (settings.production.name) {
    pdf.text(settings.production.name, margin, yPos);
    yPos += 5;
  }
  
  if (settings.production.address) {
    const addressLines = settings.production.address.split('\n');
    for (const line of addressLines) {
      pdf.text(line, margin, yPos);
      yPos += 5;
    }
  }

  yPos += 10;

  // Titre du devis
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  
  const title = settings.information.projectName || 'Devis';
  pdf.text(title, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Type de projet
  if (settings.information.projectType) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(settings.information.projectType, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
  } else {
    yPos += 5;
  }

  // Informations personnalisées
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  
  const customFieldsPerRow = 2;
  const fieldWidth = contentWidth / customFieldsPerRow;
  
  for (let i = 0; i < settings.information.customFields.length; i += customFieldsPerRow) {
    const row = settings.information.customFields.slice(i, i + customFieldsPerRow);
    
    // Titres
    pdf.setFont('helvetica', 'bold');
    row.forEach((field, index) => {
      if (field.title && field.content) {
        const xPos = margin + index * fieldWidth;
        pdf.text(field.title, xPos, yPos);
      }
    });
    yPos += 5;
    
    // Contenus
    pdf.setFont('helvetica', 'normal');
    row.forEach((field, index) => {
      if (field.content) {
        const xPos = margin + index * fieldWidth;
        pdf.text(field.content, xPos, yPos);
      }
    });
    yPos += 10;
  }

  yPos += 5;

  // Calcul des totaux
  const totals = calculateTotalCosts(categories, settings);
  
  // Tableau récapitulatif
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, yPos, contentWidth, 8, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('RÉCAPITULATIF', margin + 5, yPos + 5);
  
  yPos += 10;
  
  // Lignes du récapitulatif
  pdf.setFont('helvetica', 'normal');
  pdf.text('Coût de base', margin + 5, yPos);
  pdf.text(`${formatNumber(totals.baseCost)} €`, pageWidth - margin - 5, yPos, { align: 'right' });
  yPos += 6;
  
  pdf.text('Charges sociales', margin + 5, yPos);
  pdf.text(`${formatNumber(totals.totalSocialCharges)} €`, pageWidth - margin - 5, yPos, { align: 'right' });
  yPos += 6;
  
  pdf.text('Coût total', margin + 5, yPos);
  pdf.text(`${formatNumber(totals.totalCost)} €`, pageWidth - margin - 5, yPos, { align: 'right' });
  yPos += 6;
  
  // Taux personnalisés
  const rate1Label = settings.rateLabels?.rate1Label || 'TX 1';
  const rate2Label = settings.rateLabels?.rate2Label || 'TX 2';
  
  pdf.text(`${rate1Label} (${formatNumber(totals.agencyPercent)}%)`, margin + 5, yPos);
  pdf.text(`${formatNumber(totals.agency)} €`, pageWidth - margin - 5, yPos, { align: 'right' });
  yPos += 6;
  
  pdf.text(`${rate2Label} (${formatNumber(totals.marginPercent)}%)`, margin + 5, yPos);
  pdf.text(`${formatNumber(totals.margin)} €`, pageWidth - margin - 5, yPos, { align: 'right' });
  yPos += 8;
  
  // Total HT
  pdf.setFillColor(230, 240, 255);
  pdf.rect(margin, yPos, contentWidth, 8, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL HT', margin + 5, yPos + 5);
  pdf.text(`${formatNumber(totals.grandTotal)} €`, pageWidth - margin - 5, yPos + 5, { align: 'right' });
  
  yPos += 15;

  // Notes
  if (notes) {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Notes :', margin, yPos);
    yPos += 6;
    
    pdf.setFont('helvetica', 'normal');
    
    // Convertir les notes HTML en texte simple
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = notes;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    const splitText = pdf.splitTextToSize(plainText, contentWidth);
    pdf.text(splitText, margin, yPos);
    yPos += splitText.length * 5 + 10;
  }

  // Conditions générales
  if (settings.termsAndConditions && yPos < pageHeight - 50) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Conditions Générales :', margin, yPos);
    yPos += 5;
    
    pdf.setFont('helvetica', 'normal');
    
    // Convertir les CGV HTML en texte simple
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = settings.termsAndConditions;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    const splitText = pdf.splitTextToSize(plainText, contentWidth);
    
    // Vérifier si on a besoin d'une nouvelle page
    if (yPos + splitText.length * 3.5 > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
    }
    
    pdf.text(splitText, margin, yPos);
  }

  // Télécharger le PDF
  pdf.save('devis.pdf');
}