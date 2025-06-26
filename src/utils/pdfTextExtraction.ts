import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extracts text content from a PDF file
 * @param file The PDF file to extract text from
 * @returns A promise that resolves to the extracted text
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    // Get the total number of pages
    const numPages = pdf.numPages;
    console.log(`PDF loaded with ${numPages} pages`);
    
    // Extract text from each page
    let fullText = '';
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    console.log('Extracted text from PDF:', fullText.substring(0, 200) + '...');
    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extracts text content from an image file using OCR
 * @param file The image file to extract text from
 * @returns A promise that resolves to the extracted text
 */
export async function extractTextFromImage(file: File): Promise<string> {
  // For now, just return a placeholder message
  // In a real implementation, we would use an OCR service
  return `[This is an image file: ${file.name}. Image text extraction not implemented yet.]`;
}

/**
 * Extracts text content from a file (PDF or image)
 * @param file The file to extract text from
 * @returns A promise that resolves to the extracted text
 */
export async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    return extractTextFromPDF(file);
  } else if (file.type.startsWith('image/')) {
    return extractTextFromImage(file);
  } else {
    throw new Error(`Unsupported file type: ${file.type}`);
  }
}