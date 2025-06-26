import React, { useState } from 'react';
import { RenderItem, InvoiceStatus, RenderSubCategoryType } from './RenderTable';
import { formatNumber } from '../../../utils/formatNumber';
import { Eye, FileText, Trash2, Upload, Calendar, Save } from 'lucide-react';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { InvoiceUpload } from './InvoiceUpload';
import { CalendarModal } from './CalendarModal';
import { SocialChargeRate } from '../../../types/quoteSettings';

interface RenderItemDetailsProps {
  item: RenderItem;
  socialChargeRates?: SocialChargeRate[];
  onUpdate: (updates: Partial<RenderItem>) => void;
  onDelete: () => void;
}

const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  not_received: 'Non reçue',
  received: 'Reçue',
  to_pay: 'À payer',
  paid: 'Payée'
};

export function RenderItemDetails({ item, socialChargeRates = [], onUpdate, onDelete }: RenderItemDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const handleUpload = (file: File, extractedData: Partial<RenderItem>) => {
    onUpdate({
      ...extractedData,
      attachment: file
    });
    setShowUpload(false);
  };

  const handleWorkDaysUpdate = (dates: string[]) => {
    const dailyRate = item.grossSalary && dates.length > 0 
      ? item.grossSalary / dates.length 
      : 0;
      
    onUpdate({ 
      workDays: dates,
      dailyRate
    });
    setShowCalendar(false);
  };

  const renderFields = () => {
    switch (item.type) {
      case 'salaries':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <input
                type="text"
                value={item.lastName || ''}
                onChange={(e) => onUpdate({ lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom
              </label>
              <input
                type="text"
                value={item.firstName || ''}
                onChange={(e) => onUpdate({ firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Poste
              </label>
              <input
                type="text"
                value={item.position || ''}
                onChange={(e) => onUpdate({ position: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Salaire brut
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={item.grossSalary || ''}
                  onChange={(e) => onUpdate({ grossSalary: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Charges sociales (%)
              </label>
              <select
                value={item.socialChargesPercent || 65}
                onChange={(e) => onUpdate({ socialChargesPercent: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {socialChargeRates.length > 0 ? (
                  socialChargeRates.map(rate => (
                    <option key={rate.id} value={rate.rate * 100}>
                      {rate.label} ({rate.rate * 100}%)
                    </option>
                  ))
                ) : (
                  <>
                    <option value={65}>Techniciens (65%)</option>
                    <option value={55}>Artistes (55%)</option>
                    <option value={3}>Auteur (3%)</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jours travaillés
              </label>
              <button
                onClick={() => setShowCalendar(true)}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <span>{item.workDays?.length || 0} jour{(item.workDays?.length || 0) > 1 ? 's' : ''}</span>
                <Calendar size={16} className="text-gray-400" />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tarif journalier
              </label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700">
                {item.workDays && item.workDays.length > 0 && item.grossSalary
                  ? formatNumber(item.grossSalary / item.workDays.length) + ' €'
                  : '-'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coût global
              </label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700">
                {item.grossSalary && item.socialChargesPercent
                  ? formatNumber(item.grossSalary * (1 + item.socialChargesPercent / 100)) + ' €'
                  : '-'}
              </div>
            </div>
          </div>
        );

      case 'suppliers':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Société
              </label>
              <input
                type="text"
                value={item.companyName || ''}
                onChange={(e) => onUpdate({ companyName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant HT
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={item.amountHT || ''}
                  onChange={(e) => onUpdate({ amountHT: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
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
                  value={item.amountTTC || ''}
                  onChange={(e) => onUpdate({ amountTTC: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IBAN
              </label>
              <input
                type="text"
                value={item.iban || ''}
                onChange={(e) => onUpdate({ iban: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
              />
            </div>
          </div>
        );

      case 'expenses':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <input
                type="text"
                value={item.lastName || ''}
                onChange={(e) => onUpdate({ lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom
              </label>
              <input
                type="text"
                value={item.firstName || ''}
                onChange={(e) => onUpdate({ firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Poste
              </label>
              <input
                type="text"
                value={item.position || ''}
                onChange={(e) => onUpdate({ position: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant HT
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={item.amountHT || ''}
                  onChange={(e) => onUpdate({ amountHT: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
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
                  value={item.amountTTC || ''}
                  onChange={(e) => onUpdate({ amountTTC: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {item.type === 'suppliers' ? 'Détails du prestataire' : 
           item.type === 'expenses' ? 'Détails de la note de frais' : 
           'Détails du salaire'}
        </h3>
        <button
          type="button"
          onClick={onDelete}
          className="p-2 text-red-500 hover:bg-red-50 rounded"
          title="Supprimer"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="space-y-6">
        {renderFields()}

        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={item.invoiceStatus}
                onChange={(e) => onUpdate({ invoiceStatus: e.target.value as InvoiceStatus })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(invoiceStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Justificatif
              </label>
              <div className="flex items-center gap-2">
                {item.attachment ? (
                  <div className="flex-1 flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
                    <FileText size={18} className="text-blue-500" />
                    <span className="text-sm text-gray-700 truncate flex-1">
                      {item.attachment.name}
                    </span>
                    <button
                      onClick={() => setShowPreview(true)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Voir le document"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowUpload(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-md w-full"
                  >
                    <Upload size={16} />
                    Importer un justificatif
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          onClick={() => onUpdate({})}
        >
          <Save size={16} />
          Enregistrer
        </button>
      </div>

      {showPreview && item.attachment && (
        <DocumentPreviewModal
          file={item.attachment}
          onClose={() => setShowPreview(false)}
        />
      )}

      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-full max-w-2xl">
            <InvoiceUpload
              onUpload={(file, extractedData) => {
                onUpdate({
                  ...extractedData,
                  attachment: file
                });
                setShowUpload(false);
              }}
              onCancel={() => setShowUpload(false)}
            />
          </div>
        </div>
      )}

      {showCalendar && (
        <CalendarModal
          selectedDates={item.workDays || []}
          onSave={handleWorkDaysUpdate}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </div>
  );
}