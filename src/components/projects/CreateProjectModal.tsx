import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { QuoteSettings } from '../../types/quoteSettings';
import { ProjectBasicInfo } from './wizard/ProjectBasicInfo';
import { ProjectRatesSettings } from './wizard/ProjectRatesSettings';
import { ProjectInformationSettings } from './wizard/ProjectInformationSettings';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: { 
    name: string; 
    client: string;
    settings?: Partial<QuoteSettings>;
  }) => void;
}

export function CreateProjectModal({ isOpen, onClose, onSubmit }: CreateProjectModalProps) {
  const [step, setStep] = useState(1);
  const [projectData, setProjectData] = useState({
    name: '',
    client: '',
    settings: {
      defaultAgencyPercent: 10,
      defaultMarginPercent: 15,
      rateLabels: {
        rate1Label: 'TX 1',
        rate2Label: 'TX 2'
      },
      information: {
        projectName: '',
        projectType: '',
        customFields: [
          { id: '1', title: 'Réalisateur.ice', content: '' },
          { id: '2', title: 'Client/Diffuseur', content: '' },
          { id: '3', title: 'Jours de tournage', content: '' },
          { id: '4', title: 'Dates de tournage', content: '' }
        ]
      },
      socialChargeRates: [
        { id: '65', label: 'Techniciens', rate: 0.65 },
        { id: '55', label: 'Artistes', rate: 0.55 },
        { id: '3', label: 'Auteur', rate: 0.03 }
      ]
    }
  });

  if (!isOpen) return null;

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleBasicInfoSubmit = (data: { name: string; client: string }) => {
    setProjectData(prev => ({
      ...prev,
      name: data.name,
      client: data.client,
      settings: {
        ...prev.settings,
        information: {
          ...prev.settings.information,
          projectName: data.name,
          projectType: data.client
        }
      }
    }));
    handleNext();
  };

  const handleRatesSubmit = (data: { 
    defaultAgencyPercent: number; 
    defaultMarginPercent: number;
    rate1Label: string;
    rate2Label: string;
    socialChargeRates: any[];
  }) => {
    setProjectData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        defaultAgencyPercent: data.defaultAgencyPercent,
        defaultMarginPercent: data.defaultMarginPercent,
        rateLabels: {
          rate1Label: data.rate1Label,
          rate2Label: data.rate2Label
        },
        socialChargeRates: data.socialChargeRates
      }
    }));
    handleNext();
  };

  const handleInformationSubmit = (data: {
    agency: string;
    advertiser: string;
    product: string;
    title: string;
    customFields: any[];
  }) => {
    const updatedProjectData = {
      ...projectData,
      settings: {
        ...projectData.settings,
        information: {
          ...projectData.settings.information,
          customFields: data.customFields
        }
      }
    };
    
    setProjectData(updatedProjectData);
    onSubmit(updatedProjectData);
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
        return "Paramètres de taux";
      case 3:
        return "Champs personnalisés";
      default:
        return "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Nouveau projet - {renderStepTitle()}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        {renderStepIndicator()}
        
        {step === 1 && (
          <ProjectBasicInfo 
            initialData={{ name: projectData.name, client: projectData.client }}
            onSubmit={handleBasicInfoSubmit}
            onCancel={onClose}
          />
        )}
        
        {step === 2 && (
          <ProjectRatesSettings 
            initialData={{
              defaultAgencyPercent: projectData.settings.defaultAgencyPercent,
              defaultMarginPercent: projectData.settings.defaultMarginPercent,
              rate1Label: projectData.settings.rateLabels.rate1Label,
              rate2Label: projectData.settings.rateLabels.rate2Label,
              socialChargeRates: projectData.settings.socialChargeRates
            }}
            onSubmit={handleRatesSubmit}
            onBack={handleBack}
          />
        )}
        
        {step === 3 && (
          <ProjectInformationSettings 
            initialData={{
              agency: '',
              advertiser: '',
              product: '',
              title: '',
              customFields: projectData.settings.information.customFields
            }}
            onSubmit={handleInformationSubmit}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}