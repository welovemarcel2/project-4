import React, { useState } from 'react';
import { X, Save, Calendar } from 'lucide-react';
import { RenderSubCategoryType, RenderItem, InvoiceStatus } from './RenderTable';
import { generateId } from '../../../utils/generateId';
import { CalendarModal } from './CalendarModal';
import { SocialChargeRate } from '../../../types/quoteSettings';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: RenderItem) => void;
  type: RenderSubCategoryType;
  socialChargeRates: SocialChargeRate[];
}

export function AddItemModal({ isOpen, onClose, onAdd, type, socialChargeRates }: AddItemModalProps) {
  const [formData, setFormData] = useState<Partial<RenderItem>>({
    type,
    invoiceStatus: 'not_received',
    socialChargesPercent: 65 // Valeur par défaut
  });
  const [showCalendar, setShowCalendar] = useState(false);

  if (!isOpen) return null;

  const handleWorkDaysUpdate = (dates: string[]) => {
    // Calculate daily rate if gross salary is set
    const dailyRate = formData.grossSalary && dates.length > 0 
      ? formData.grossSalary / dates.length 
      : 0;
      
    setFormData({ 
      ...formData, 
      workDays: dates,
      dailyRate
    });
    setShowCalendar(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Créer un nouvel élément complet avec toutes les propriétés du formulaire
    const newItem: RenderItem = {
      id: generateId(),
      type,
      invoiceStatus: formData.invoiceStatus || 'not_received',
      ...formData
    };
    
    console.log("Ajout d'un nouvel élément:", newItem);
    onAdd(newItem);
    onClose();
  };

  const renderForm = () => {
    switch (type) {
      case 'salaries':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Poste
              </label>
              <input
                type="text"
                value={formData.position || ''}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Salaire brut
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.grossSalary || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setFormData({ 
                      ...formData, 
                      grossSalary: value,
                      // Recalculer le tarif journalier si des jours sont sélectionnés
                      dailyRate: formData.workDays && formData.workDays.length > 0 
                        ? value / formData.workDays.length 
                        : undefined
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Charges sociales (%)
              </label>
              <select
                value={formData.socialChargesPercent || 65}
                onChange={(e) => setFormData({ ...formData, socialChargesPercent: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {socialChargeRates.map(rate => (
                  <option key={rate.id} value={rate.rate * 100}>
                    {rate.label} ({rate.rate * 100}%)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jours travaillés
              </label>
              <button
                type="button"
                onClick={() => setShowCalendar(true)}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <span>{formData.workDays?.length || 0} jour{(formData.workDays?.length || 0) > 1 ? 's' : ''}</span>
                <Calendar size={16} className="text-gray-400" />
              </button>
            </div>
            {formData.workDays && formData.workDays.length > 0 && formData.grossSalary && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tarif journalier
                </label>
                <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700">
                  {formData.grossSalary / formData.workDays.length} €
                </div>
              </div>
            )}
          </>
        );
      
      case 'suppliers':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Société
              </label>
              <input
                type="text"
                value={formData.companyName || ''}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant HT
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.amountHT || ''}
                    onChange={(e) => setFormData({ ...formData, amountHT: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant TTC
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.amountTTC || ''}
                    onChange={(e) => setFormData({ ...formData, amountTTC: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={formData.invoiceStatus || 'not_received'}
                onChange={(e) => setFormData({ ...formData, invoiceStatus: e.target.value as InvoiceStatus })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="not_received">Non reçue</option>
                <option value="received">Reçue</option>
                <option value="to_pay">À payer</option>
                <option value="paid">Payée</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IBAN
              </label>
              <input
                type="text"
                value={formData.iban || ''}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
              />
            </div>
          </>
        );
      
      case 'expenses':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Poste
              </label>
              <input
                type="text"
                value={formData.position || ''}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant HT
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.amountHT || ''}
                    onChange={(e) => setFormData({ ...formData, amountHT: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant TTC
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.amountTTC || ''}
                    onChange={(e) => setFormData({ ...formData, amountTTC: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={formData.invoiceStatus || 'not_received'}
                onChange={(e) => setFormData({ ...formData, invoiceStatus: e.target.value as InvoiceStatus })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="not_received">Non reçue</option>
                <option value="received">Reçue</option>
                <option value="to_pay">À payer</option>
                <option value="paid">Payée</option>
              </select>
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  const getModalTitle = () => {
    switch (type) {
      case 'salaries':
        return 'Ajouter un salaire';
      case 'suppliers':
        return 'Ajouter un prestataire';
      case 'expenses':
        return 'Ajouter une note de frais';
      default:
        return 'Ajouter un élément';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{getModalTitle()}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {renderForm()}
          
          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              <Save size={16} />
              Ajouter
            </button>
          </div>
        </form>
      </div>
      
      {showCalendar && (
        <CalendarModal
          selectedDates={formData.workDays || []}
          onSave={handleWorkDaysUpdate}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </div>
  );
}