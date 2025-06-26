import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Quote } from '../../types/project';
import { BudgetCategory } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';
import { QuoteBasicInfo } from './wizard/QuoteBasicInfo';
import { QuoteTemplateSelection } from './wizard/QuoteTemplateSelection';
import { QuoteDisplaySettings } from './wizard/QuoteDisplaySettings';

interface CreateQuoteWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { 
    name: string; 
    type: 'main' | 'additive'; 
    parentQuoteId?: string; 
    initialBudget?: BudgetCategory[];
    settings?: Partial<QuoteSettings>;
  }) => void;
  existingQuotes: Quote[];
  projectSettings?: QuoteSettings;
}

export function CreateQuoteWizard({ 
  isOpen, 
  onClose, 
  onSubmit, 
  existingQuotes,
  projectSettings
}: CreateQuoteWizardProps) {
  const [step, setStep] = useState(1);
  const [quoteData, setQuoteData] = useState({
    name: '',
    type: 'main' as 'main' | 'additive',
    parentQuoteId: undefined as string | undefined,
    initialBudget: undefined as BudgetCategory[] | undefined,
    templateId: undefined as string | undefined,
    settings: {
      showEmptyItems: projectSettings?.showEmptyItems !== undefined ? projectSettings.showEmptyItems : true,
      socialChargesDisplay: projectSettings?.socialChargesDisplay || 'detailed',
      applySocialChargesMargins: projectSettings?.applySocialChargesMargins !== undefined ? projectSettings.applySocialChargesMargins : false
    }
  });

  if (!isOpen) return null;

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleBasicInfoSubmit = (data: { 
    name: string; 
    type: 'main' | 'additive';
    parentQuoteId?: string;
  }) => {
    setQuoteData(prev => ({
      ...prev,
      name: data.name,
      type: data.type,
      parentQuoteId: data.parentQuoteId
    }));
    handleNext();
  };

  const handleTemplateSubmit = (data: { 
    initialBudget?: BudgetCategory[];
    templateId?: string;
  }) => {
    setQuoteData(prev => ({
      ...prev,
      initialBudget: data.initialBudget,
      templateId: data.templateId
    }));
    handleNext();
  };

  const handleSettingsSubmit = (settings: Partial<QuoteSettings>) => {
    console.log("Settings submitted:", settings);
    
    const finalData = {
      ...quoteData,
      settings: {
        ...quoteData.settings,
        ...settings
      }
    };
    
    console.log("Final data to submit:", finalData);
    
    onSubmit({
      name: finalData.name,
      type: finalData.type,
      parentQuoteId: finalData.parentQuoteId,
      initialBudget: finalData.initialBudget,
      settings: finalData.settings
    });
    
    // Reset form
    setStep(1);
    setQuoteData({
      name: '',
      type: 'main',
      parentQuoteId: undefined,
      initialBudget: undefined,
      templateId: undefined,
      settings: {
        showEmptyItems: projectSettings?.showEmptyItems !== undefined ? projectSettings.showEmptyItems : true,
        socialChargesDisplay: projectSettings?.socialChargesDisplay || 'detailed',
        applySocialChargesMargins: projectSettings?.applySocialChargesMargins !== undefined ? projectSettings.applySocialChargesMargins : false
      }
    });
    
    // Close the modal
    onClose();
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            1
          </div>
          <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            2
          </div>
          <div className={`w-16 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            3
          </div>
        </div>
      </div>
    );
  };

  const renderStepTitle = () => {
    switch (step) {
      case 1:
        return "Informations de base";
      case 2:
        return "Choix du modèle";
      case 3:
        return "Charges Sociales";
      default:
        return "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Nouveau budget - {renderStepTitle()}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        {renderStepIndicator()}
        
        {step === 1 && (
          <QuoteBasicInfo 
            initialData={{ 
              name: quoteData.name, 
              type: quoteData.type,
              parentQuoteId: quoteData.parentQuoteId
            }}
            existingQuotes={existingQuotes.map(q => ({ id: q.id, name: q.name }))}
            onSubmit={handleBasicInfoSubmit}
            onCancel={onClose}
          />
        )}
        
        {step === 2 && (
          <QuoteTemplateSelection 
            onSubmit={handleTemplateSubmit}
            onBack={handleBack}
          />
        )}
        
        {step === 3 && (
          <QuoteDisplaySettings 
            initialSettings={{
              socialChargesDisplay: quoteData.settings.socialChargesDisplay,
              applySocialChargesMargins: quoteData.settings.applySocialChargesMargins
            }}
            onSubmit={handleSettingsSubmit}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}