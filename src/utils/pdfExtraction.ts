import { createClient } from '@supabase/supabase-js';
import { extractTextFromFile } from './pdfTextExtraction';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface ExtractedInvoiceData {
  companyName?: string;
  amountHT?: number;
  amountTTC?: number;
  invoiceDate?: string;
  invoiceNumber?: string;
  rawText?: string;
}

export async function extractDataFromPDF(file: File): Promise<ExtractedInvoiceData> {
  try {
    // First, extract text from the file
    console.log('Extracting text from file:', file.name);
    const extractedText = await extractTextFromFile(file);
    console.log('Extracted text:', extractedText.substring(0, 200) + '...');

    // Create request body with the file information and extracted text
    const body = {
      text: extractedText,
      filename: file.name,
      contentType: file.type
    };

    // Call the Supabase Edge Function directly using the provided URL
    const response = await fetch('https://tqczrvcojysvcgomtnga.supabase.co/functions/v1/extract-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge Function error:', errorText);
      throw new Error(`Failed to extract data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || !data.data) {
      throw new Error('No data received from PDF extraction');
    }

    // Parse and validate the extracted data
    const extractedData = data.data;
    
    // Ensure numeric values are properly handled
    let amountHT = 0;
    let amountTTC = 0;
    
    if (extractedData.amountHT !== undefined) {
      amountHT = typeof extractedData.amountHT === 'number' 
        ? extractedData.amountHT 
        : parseFloat(String(extractedData.amountHT).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    } else if (extractedData.amount_ht !== undefined) {
      amountHT = typeof extractedData.amount_ht === 'number'
        ? extractedData.amount_ht
        : parseFloat(String(extractedData.amount_ht).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    }
    
    if (extractedData.amountTTC !== undefined) {
      amountTTC = typeof extractedData.amountTTC === 'number'
        ? extractedData.amountTTC
        : parseFloat(String(extractedData.amountTTC).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    } else if (extractedData.amount_ttc !== undefined) {
      amountTTC = typeof extractedData.amount_ttc === 'number'
        ? extractedData.amount_ttc
        : parseFloat(String(extractedData.amount_ttc).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    }
    
    console.log('Extracted data:', {
      companyName: extractedData.companyName || extractedData.company_name || '',
      amountHT,
      amountTTC,
      invoiceDate: extractedData.invoiceDate || extractedData.invoice_date || '',
      invoiceNumber: extractedData.invoiceNumber || extractedData.invoice_number || '',
    });
    
    return {
      companyName: extractedData.companyName || extractedData.company_name || '',
      amountHT,
      amountTTC,
      invoiceDate: extractedData.invoiceDate || extractedData.invoice_date || '',
      invoiceNumber: extractedData.invoiceNumber || extractedData.invoice_number || '',
      rawText: extractedData.rawText || ''
    };
  } catch (error) {
    console.error('Error extracting data:', error);
    throw new Error(`Failed to extract data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}