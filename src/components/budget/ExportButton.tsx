import React, { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import { useBudgetState } from '../../hooks/useBudgetState';
import { useQuoteSettings } from '../../hooks/useQuoteSettings';
import { exportBudgetPdfClient } from '../../utils/pdf/exportBudgetPdfClient';

interface ExportButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const ExportButton: React.FC<ExportButtonProps> = ({ 
  className = '', 
  variant = 'default',
  size = 'md'
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { projects } = useProjects();
  const { getBudget } = useBudgetState();
  const { settings } = useQuoteSettings();

  // Prendre le premier projet actif (vous pourriez adapter selon vos besoins)
  const project = projects[0];
  const budget = project ? getBudget(project.id) : [];

  const handleExport = async () => {
    if (!project || !budget || !settings) {
      console.error('Données manquantes pour l\'export');
      return;
    }

    setIsExporting(true);
    try {
      await exportBudgetPdfClient({
        project,
        budget,
        settings,
        notes: '',
        terms: ''
      });
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      // Ici vous pourriez ajouter une notification d'erreur pour l'utilisateur
    } finally {
      setIsExporting(false);
    }
  };

  const getButtonClasses = () => {
    const baseClasses = 'flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors';
    
    if (variant === 'outline') {
      return `${baseClasses} border border-gray-300 text-gray-700 hover:bg-gray-50 ${className}`;
    } else if (variant === 'ghost') {
      return `${baseClasses} text-gray-600 hover:bg-gray-100 ${className}`;
    } else {
      return `${baseClasses} text-white bg-blue-600 hover:bg-blue-700 ${className}`;
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting || !project || !budget || !settings}
      className={getButtonClasses()}
    >
      {isExporting ? (
        <>
          <FileText className="w-4 h-4 animate-pulse" />
          Génération...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Exporter PDF
        </>
      )}
    </button>
  );
};