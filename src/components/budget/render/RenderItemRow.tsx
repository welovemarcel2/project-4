import React, { useState } from 'react';
import { Trash2, Upload, FileCheck, Eye, Calendar, Pencil } from 'lucide-react';
import { RenderItem, InvoiceStatus, RenderSubCategoryType } from './RenderTable';
import { formatNumber } from '../../../utils/formatNumber';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { CalendarModal } from './CalendarModal';
import { SocialChargeRate } from '../../../types/quoteSettings';

interface RenderItemRowProps {
  item: RenderItem;
  type: RenderSubCategoryType;
  socialChargeRates: SocialChargeRate[];
  onUpdate: (updates: Partial<RenderItem>) => void;
  onDelete: () => void;
  onSelect: () => void;
  isSelected: boolean;
}

const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  not_received: 'Non reçue',
  received: 'Reçue',
  to_pay: 'À payer',
  paid: 'Payée'
};

const invoiceStatusColors: Record<InvoiceStatus, string> = {
  not_received: 'bg-gray-100 text-gray-800',
  received: 'bg-blue-100 text-blue-800',
  to_pay: 'bg-amber-100 text-amber-800',
  paid: 'bg-green-100 text-green-800'
};

export function RenderItemRow({ 
  item, 
  type, 
  socialChargeRates,
  onUpdate, 
  onDelete, 
  onSelect,
  isSelected
}: RenderItemRowProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Calculate daily rate for salaries
  const dailyRate = item.workDays && item.workDays.length > 0 && item.grossSalary 
    ? item.grossSalary / item.workDays.length 
    : 0;
  
  // Calculate total cost for salaries
  const totalCost = type === 'salaries' && item.grossSalary && item.socialChargesPercent
    ? item.grossSalary * (1 + item.socialChargesPercent / 100)
    : 0;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpdate({ attachment: file });
    }
  };

  const handleWorkDaysUpdate = (dates: string[]) => {
    onUpdate({ 
      workDays: dates,
      dailyRate: item.grossSalary && dates.length > 0 ? item.grossSalary / dates.length : 0
    });
    setShowCalendar(false);
  };

  return (
    <>
      <tr 
        className={`border-t border-gray-100 hover:bg-gray-50 cursor-pointer text-[11px] ${isSelected ? 'bg-blue-50' : ''}`}
        onClick={onSelect}
      >
        {type === 'salaries' && (
          <>
            <td className="px-2 py-1.5">{item.lastName || '-'}</td>
            <td className="px-2 py-1.5">{item.firstName || '-'}</td>
            <td className="px-2 py-1.5">{item.position || '-'}</td>
            <td className="px-2 py-1.5">{item.grossSalary ? formatNumber(item.grossSalary) + ' €' : '-'}</td>
            <td className="px-2 py-1.5">
              <select
                value={item.socialChargesPercent || 65}
                onChange={(e) => onUpdate({ socialChargesPercent: parseFloat(e.target.value) })}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-2 py-1 text-xs border rounded"
              >
                {socialChargeRates.map(rate => (
                  <option key={rate.id} value={rate.rate * 100}>
                    {rate.label} ({rate.rate * 100}%)
                  </option>
                ))}
              </select>
            </td>
            <td className="px-2 py-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCalendar(true);
                }}
                className="flex items-center gap-1 px-2 py-1 text-[10px] bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
              >
                <Calendar size={12} />
                {item.workDays?.length || 0} jour{(item.workDays?.length || 0) > 1 ? 's' : ''}
              </button>
            </td>
            <td className="px-2 py-1.5 font-medium">
              {totalCost > 0 ? formatNumber(totalCost) + ' €' : '-'}
            </td>
          </>
        )}

        {type === 'suppliers' && (
          <>
            <td className="px-2 py-1.5">{item.companyName || '-'}</td>
            <td className="px-2 py-1.5">{item.amountHT ? formatNumber(item.amountHT) + ' €' : '-'}</td>
            <td className="px-2 py-1.5">{item.amountTTC ? formatNumber(item.amountTTC) + ' €' : '-'}</td>
          </>
        )}

        {type === 'expenses' && (
          <>
            <td className="px-2 py-1.5">{item.lastName || '-'}</td>
            <td className="px-2 py-1.5">{item.firstName || '-'}</td>
            <td className="px-2 py-1.5">{item.position || '-'}</td>
            <td className="px-2 py-1.5">{item.amountHT ? formatNumber(item.amountHT) + ' €' : '-'}</td>
            <td className="px-2 py-1.5">{item.amountTTC ? formatNumber(item.amountTTC) + ' €' : '-'}</td>
          </>
        )}

        <td className="px-2 py-1.5">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${invoiceStatusColors[item.invoiceStatus]}`}>
            {invoiceStatusLabels[item.invoiceStatus]}
          </span>
        </td>

        {type === 'suppliers' && (
          <td className="px-2 py-1.5 text-[10px] text-gray-500">
            {item.iban ? item.iban.substring(0, 8) + '...' : '-'}
          </td>
        )}

        <td className="px-2 py-1.5">
          <div className="flex items-center gap-2">
            <input
              type="file"
              id={`file-${item.id}`}
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <label
              htmlFor={`file-${item.id}`}
              className="cursor-pointer p-1 hover:bg-gray-100 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              {item.attachment ? (
                <FileCheck size={16} className="text-green-500" />
              ) : (
                <Upload size={16} className="text-gray-400" />
              )}
            </label>
            {item.attachment && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPreview(true);
                }}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                title="Voir le document"
              >
                <Eye size={16} />
              </button>
            )}
          </div>
        </td>

        <td className="px-2 py-1.5">
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="p-1 text-blue-500 hover:bg-blue-50 rounded"
              title="Modifier"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 text-red-500 hover:bg-red-50 rounded"
              title="Supprimer"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>

      {showPreview && item.attachment && (
        <DocumentPreviewModal
          file={item.attachment}
          onClose={() => setShowPreview(false)}
        />
      )}

      {showCalendar && (
        <CalendarModal
          selectedDates={item.workDays || []}
          onSave={handleWorkDaysUpdate}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </>
  );
}