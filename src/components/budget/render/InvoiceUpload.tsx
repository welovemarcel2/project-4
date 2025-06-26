import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { RenderItem, InvoiceStatus } from './RenderTable';
import { extractDataFromPDF, ExtractedInvoiceData } from '../../../utils/pdfExtraction';

interface InvoiceUploadProps {
  onUpload: (file: File, extractedData: Partial<RenderItem>) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export function InvoiceUpload({ onUpload, onCancel, isProcessing = false }: InvoiceUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File) => {
    if (!file) return;
    
    // Check file type
    if (!file.type.match('application/pdf') && !file.type.match('image/')) {
      setError('Veuillez sélectionner un fichier PDF ou une image');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Le fichier est trop volumineux (max 5MB)');
      return;
    }
    
    setFile(file);
    setError(null);
  };

  const handleAnalyzeDocument = async () => {
    if (!file) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Extract data from document with OpenAI
      const extractedData = await extractDataFromPDF(file);
      
      // Convert extracted data to RenderItem format
      const renderItemData: Partial<RenderItem> = {
        companyName: extractedData.companyName,
        amountHT: extractedData.amountHT,
        amountTTC: extractedData.amountTTC,
        invoiceStatus: 'received' as InvoiceStatus,
        attachment: file
      };
      
      // Send file and extracted data to parent
      onUpload(file, renderItemData);
    } catch (err) {
      console.error('Error processing file:', err);
      setError('Une erreur est survenue lors de l\'analyse du document. Veuillez réessayer.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Importer un justificatif</h3>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <X size={20} className="text-gray-500" />
        </button>
      </div>
      
      {isAnalyzing || isProcessing ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600 text-center">
            {isAnalyzing ? 'Analyse du document en cours...' : 'Traitement en cours...'}
            <br />
            <span className="text-sm text-gray-500">
              Nous extrayons automatiquement les informations pertinentes
            </span>
          </p>
        </div>
      ) : (
        <>
          {!file ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-500'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              
              <p className="text-gray-600 mb-4">
                Glissez votre fichier ici ou
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-800 font-medium mx-1"
                >
                  parcourez vos fichiers
                </button>
              </p>
              
              <p className="text-sm text-gray-500">
                Formats acceptés: PDF, JPG, PNG (max 5MB)
              </p>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-50 rounded-lg mr-3">
                  <FileText size={24} className="text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB • {file.type}
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleAnalyzeDocument}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Upload size={16} />
                  Analyser le document
                </button>
              </div>
            </div>
          )}
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Comment ça marche ?</h4>
            <p className="text-sm text-blue-700">
              Notre système utilise l'intelligence artificielle pour extraire automatiquement les informations pertinentes de vos factures et justificatifs. Nous convertissons d'abord le document en texte, puis analysons ce texte pour identifier les informations clés comme le nom de la société, les montants et les dates.
            </p>
          </div>
        </>
      )}
    </div>
  );
}