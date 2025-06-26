import React, { useState } from 'react';
import { X, Percent, Eye, Box, Info, FileText, Building2, Coins } from 'lucide-react';
import { QuoteSettings as QuoteSettingsType } from '../../../types/quoteSettings';
import { BudgetCategory } from '../../../types/budget';
import { SocialChargesSettings } from './SocialChargesSettings';
import { UnitsSettings } from './UnitsSettings';
import { DefaultRatesSettings } from './DefaultRatesSettings';
import { DisplaySettings } from './DisplaySettings';
import { ProductionSettings } from './ProductionSettings';
import { InformationSettings } from './InformationSettings';
import { TermsAndConditionsSettings } from './TermsAndConditionsSettings';
import { CurrencySettings } from './CurrencySettings';

type SettingsTab = 'production' | 'information' | 'rates' | 'display' | 'units' | 'terms' | 'currency' | 'langCurrency';

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ isActive, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {icon}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

interface QuoteSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: QuoteSettingsType;
  onUpdateSettings: (settings: Partial<QuoteSettingsType>) => void;
  budget: BudgetCategory[];
  onUpdateBudget: (budget: BudgetCategory[]) => void;
}

export function QuoteSettings({ 
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  budget,
  onUpdateBudget
}: QuoteSettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('production');

  const tabs = [
    { id: 'production' as const, label: 'Production', icon: <Building2 size={16} /> },
    { id: 'information' as const, label: 'Informations', icon: <Info size={16} /> },
    { id: 'rates' as const, label: 'Taux', icon: <Percent size={16} /> },
    { id: 'display' as const, label: 'Affichage', icon: <Eye size={16} /> },
    { id: 'units' as const, label: 'Unités', icon: <Box size={16} /> },
    { id: 'langCurrency' as const, label: 'Langue & Monnaie', icon: <Coins size={16} /> },
    { id: 'terms' as const, label: 'CGV', icon: <FileText size={16} /> }
  ];

  const handleUpdateSettings = (updates: Partial<QuoteSettingsType>) => {
    const newSettings = { ...settings, ...updates };
    onUpdateSettings(newSettings);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Paramètres du devis</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className="flex border-b overflow-x-auto">
          {tabs.map(tab => (
            <TabButton
              key={tab.id}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              icon={tab.icon}
              label={tab.label}
            />
          ))}
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'production' && (
            <ProductionSettings
              production={settings.production}
              onChange={(production) => handleUpdateSettings({ production })}
            />
          )}

          {activeTab === 'information' && (
            <InformationSettings
              information={settings.information}
              onChange={(information) => handleUpdateSettings({ information })}
            />
          )}

          {activeTab === 'rates' && (
            <div className="space-y-8">
              <SocialChargesSettings
                rates={settings.socialChargeRates}
                onChange={(rates) => handleUpdateSettings({ socialChargeRates: rates })}
              />

              <DefaultRatesSettings
                agencyPercent={settings.defaultAgencyPercent}
                marginPercent={settings.defaultMarginPercent}
                onChange={(updates) => handleUpdateSettings(updates)}
                onApplyToAll={() => {}}
              />
            </div>
          )}

          {activeTab === 'display' && (
            <DisplaySettings
              showEmptyItems={settings.showEmptyItems}
              socialChargesDisplay={settings.socialChargesDisplay}
              applySocialChargesMargins={settings.applySocialChargesMargins}
              onChange={(updates) => handleUpdateSettings(updates)}
            />
          )}

          {activeTab === 'units' && (
            <UnitsSettings
              units={settings.availableUnits}
              onChange={(units) => handleUpdateSettings({ availableUnits: units })}
            />
          )}

          {activeTab === 'langCurrency' && (
            <div className="space-y-8">
              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-2">Langue du budget</h4>
                <select
                  value={settings.budgetLang || 'fr'}
                  onChange={e => handleUpdateSettings({ budgetLang: e.target.value as 'fr' | 'en' })}
                  className="px-3 py-2 border rounded text-sm"
                >
                  <option value="fr">Français</option>
                  <option value="en">Anglais</option>
                </select>
              </div>
              <CurrencySettings
                budget={budget}
                onUpdateBudget={onUpdateBudget}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
              />
            </div>
          )}

          {activeTab === 'terms' && (
            <TermsAndConditionsSettings
              content={settings.termsAndConditions}
              onChange={(content) => handleUpdateSettings({ termsAndConditions: content })}
            />
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}