import jsPDF from 'jspdf';
import { BudgetCategory } from '../types/budget';
import { QuoteSettings } from '../types/quoteSettings';
import { formatNumber } from './formatNumber';
import { calculateTotalCosts } from './budgetCalculations/totals';
import { useCurrencyStore } from '../stores/currencyStore';

// Constants for PDF layout
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH - (2 * MARGIN);

// Helper functions
async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

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

  // Get currency symbol
  const { selectedCurrency, currencies } = useCurrencyStore.getState();
  const currency = currencies.find(c => c.code === selectedCurrency);
  const currencySymbol = currency?.symbol || '€';

  let currentY = await drawHeader(pdf, settings);
  currentY = drawSummary(pdf, categories, settings, currentY, currencySymbol);
  
  if (notes) {
    currentY = drawNotes(pdf, notes, currentY);
  }

  if (settings.termsAndConditions) {
    drawTerms(pdf, settings.termsAndConditions);
  }

  pdf.save('devis.pdf');
}

async function drawHeader(pdf: jsPDF, settings: QuoteSettings): Promise<number> {
  let yPos = MARGIN;
  
  // Logo
  if (settings.production.logo) {
    try {
      const img = await loadImage(settings.production.logo);
      const imgWidth = 40;
      const imgHeight = (img.height * imgWidth) / img.width;
      
      pdf.addImage(settings.production.logo, 'JPEG', MARGIN, yPos, imgWidth, imgHeight);
      yPos += imgHeight + 5;
    } catch (error) {
      console.error('Error loading logo:', error);
      yPos += 10;
    }
  }

  // Production info
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  
  if (settings.production.name) {
    pdf.text(settings.production.name, MARGIN, yPos);
    yPos += 5;
  }
  
  if (settings.production.address) {
    const addressLines = settings.production.address.split('\n');
    for (const line of addressLines) {
      pdf.text(line, MARGIN, yPos);
      yPos += 5;
    }
  }

  yPos += 10;

  // Project title
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  
  const title = settings.information.projectName || 'Devis';
  pdf.text(title, PAGE_WIDTH / 2, yPos, { align: 'center' });
  yPos += 10;

  // Project type
  if (settings.information.projectType) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(settings.information.projectType, PAGE_WIDTH / 2, yPos, { align: 'center' });
    yPos += 15;
  } else {
    yPos += 5;
  }

  // Custom fields
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  
  const customFieldsPerRow = 2;
  const fieldWidth = CONTENT_WIDTH / customFieldsPerRow;
  
  for (let i = 0; i < settings.information.customFields.length; i += customFieldsPerRow) {
    const row = settings.information.customFields.slice(i, i + customFieldsPerRow);
    
    // Titles
    pdf.setFont('helvetica', 'bold');
    row.forEach((field, index) => {
      if (field.title && field.content) {
        const xPos = MARGIN + index * fieldWidth;
        pdf.text(field.title, xPos, yPos);
      }
    });
    yPos += 5;
    
    // Contents
    pdf.setFont('helvetica', 'normal');
    row.forEach((field, index) => {
      if (field.content) {
        const xPos = MARGIN + index * fieldWidth;
        pdf.text(field.content, xPos, yPos);
      }
    });
    yPos += 10;
  }

  return yPos + 5;
}

function drawSummary(pdf: jsPDF, categories: BudgetCategory[], settings: QuoteSettings, startY: number, currencySymbol: string): number {
  let yPos = startY;
  
  // Calculate totals
  const totals = calculateTotalCosts(categories, settings);
  
  // Summary table header
  pdf.setFillColor(240, 240, 240);
  pdf.rect(MARGIN, yPos, CONTENT_WIDTH, 8, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('RÉCAPITULATIF', MARGIN + 5, yPos + 5);
  
  yPos += 10;
  
  // Summary table rows
  pdf.setFont('helvetica', 'normal');
  pdf.text('Coût de base', MARGIN + 5, yPos);
  pdf.text(`${formatNumber(totals.baseCost)} ${currencySymbol}`, PAGE_WIDTH - MARGIN - 5, yPos, { align: 'right' });
  yPos += 6;
  
  pdf.text('Charges sociales', MARGIN + 5, yPos);
  pdf.text(`${formatNumber(totals.totalSocialCharges)} ${currencySymbol}`, PAGE_WIDTH - MARGIN - 5, yPos, { align: 'right' });
  yPos += 6;
  
  pdf.text('Coût total', MARGIN + 5, yPos);
  pdf.text(`${formatNumber(totals.totalCost)} ${currencySymbol}`, PAGE_WIDTH - MARGIN - 5, yPos, { align: 'right' });
  yPos += 6;
  
  // Custom rate labels
  const rate1Label = settings.rateLabels?.rate1Label || 'TX 1';
  const rate2Label = settings.rateLabels?.rate2Label || 'TX 2';
  
  pdf.text(`${rate1Label} (${formatNumber(totals.agencyPercent)}%)`, MARGIN + 5, yPos);
  pdf.text(`${formatNumber(totals.agency)} ${currencySymbol}`, PAGE_WIDTH - MARGIN - 5, yPos, { align: 'right' });
  yPos += 6;
  
  pdf.text(`${rate2Label} (${formatNumber(totals.marginPercent)}%)`, MARGIN + 5, yPos);
  pdf.text(`${formatNumber(totals.margin)} ${currencySymbol}`, PAGE_WIDTH - MARGIN - 5, yPos, { align: 'right' });
  yPos += 8;
  
  // Total HT
  pdf.setFillColor(230, 240, 255);
  pdf.rect(MARGIN, yPos, CONTENT_WIDTH, 8, 'F');
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL HT', MARGIN + 5, yPos + 5);
  pdf.text(`${formatNumber(totals.grandTotal)} ${currencySymbol}`, PAGE_WIDTH - MARGIN - 5, yPos + 5, { align: 'right' });
  
  return yPos + 15;
}

function drawNotes(pdf: jsPDF, notes: string, startY: number): number {
  let yPos = startY;
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Notes :', MARGIN, yPos);
  yPos += 6;
  
  pdf.setFont('helvetica', 'normal');
  
  // Convert HTML notes to plain text
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = notes;
  const plainText = tempDiv.textContent || tempDiv.innerText || '';
  
  const splitText = pdf.splitTextToSize(plainText, CONTENT_WIDTH);
  pdf.text(splitText, MARGIN, yPos);
  
  return yPos + splitText.length * 5 + 10;
}

function drawTerms(pdf: jsPDF, termsAndConditions: string): void {
  // Check if we need a new page
  if (pdf.internal.getCurrentPageInfo().pageNumber > 1 || 
      pdf.internal.getCurrentPageInfo().pageNumber === 1 && 
      pdf.internal.getVerticalCoordinateString() > PAGE_HEIGHT - 50) {
    pdf.addPage();
  }
  
  let yPos = pdf.internal.getVerticalCoordinateString() < 50 ? 
    MARGIN : 
    pdf.internal.getVerticalCoordinateString();
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Conditions Générales :', MARGIN, yPos);
  yPos += 5;
  
  pdf.setFont('helvetica', 'normal');
  
  // Convert HTML terms to plain text
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = termsAndConditions;
  const plainText = tempDiv.textContent || tempDiv.innerText || '';
  
  const splitText = pdf.splitTextToSize(plainText, CONTENT_WIDTH);
  
  // Check if we need a new page for terms
  if (yPos + splitText.length * 3.5 > PAGE_HEIGHT - MARGIN) {
    pdf.addPage();
    yPos = MARGIN;
  }
  
  pdf.text(splitText, MARGIN, yPos);
}