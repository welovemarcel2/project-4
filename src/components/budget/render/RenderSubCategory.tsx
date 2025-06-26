import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { RenderSubCategoryType, RenderItem, InvoiceStatus } from './RenderTable';
import { RenderItemRow } from './RenderItemRow';
import { formatNumber } from '../../../utils/formatNumber';
import { AddItemModal } from './AddItemModal';
import { RenderItemDetails } from './RenderItemDetails';
import { SocialChargeRate } from '../../../types/quoteSettings';

interface RenderSubCategoryProps {
  title: string;
  type: RenderSubCategoryType;
  socialChargeRates: SocialChargeRate[];
  items: RenderItem[];
  onAddItem: () => string;
  onUpdateItem: (itemId: string, updates: Partial<RenderItem>) => void;
  onReplaceItem: (item: RenderItem) => void;
  onDeleteItem: (itemId: string) => void;
  onSelectItem: (item: RenderItem) => void;
  selectedItemId?: string;
}

export function RenderSubCategory({
  title,
  type,
  socialChargeRates,
  items,
  onAddItem,
  onUpdateItem,
  onReplaceItem,
  onDeleteItem,
  onSelectItem,
  selectedItemId
}: RenderSubCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RenderItem | null>(null);

  // Calculate totals
  const calculateTotals = () => {
    let totalHT = 0;
    let totalTTC = 0;
    let totalSalaries = 0;
    let totalSocialCharges = 0;

    items.forEach(item => {
      if (type === 'suppliers' || type === 'expenses') {
        totalHT += item.amountHT || 0;
        totalTTC += item.amountTTC || 0;
      } else if (type === 'salaries') {
        const grossSalary = item.grossSalary || 0;
        const socialChargesPercent = item.socialChargesPercent || 0;
        const socialCharges = grossSalary * (socialChargesPercent / 100);
        
        totalSalaries += grossSalary;
        totalSocialCharges += socialCharges;
        totalHT += grossSalary + socialCharges;
        totalTTC += grossSalary + socialCharges;
      }
    });

    return {
      totalHT,
      totalTTC,
      totalSalaries,
      totalSocialCharges,
      count: items.length
    };
  };

  const totals = calculateTotals();

  // Get table headers based on type
  const getHeaders = () => {
    switch (type) {
      case 'salaries':
        return (
          <tr className="text-left text-xs font-medium text-gray-600 bg-gray-50 border-b">
            <th className="px-2 py-1.5">Nom</th>
            <th className="px-2 py-1.5">Prénom</th>
            <th className="px-2 py-1.5">Poste</th>
            <th className="px-2 py-1.5">Salaire Brut</th>
            <th className="px-2 py-1.5">% Ch. Soc.</th>
            <th className="px-2 py-1.5">Jours</th>
            <th className="px-2 py-1.5">Coût Global</th>
            <th className="px-2 py-1.5">Statut</th>
            <th className="px-2 py-1.5">Justificatif</th>
            <th className="px-2 py-1.5"></th>
          </tr>
        );
      case 'suppliers':
        return (
          <tr className="text-left text-xs font-medium text-gray-600 bg-gray-50 border-b">
            <th className="px-2 py-1.5">Société</th>
            <th className="px-2 py-1.5">Montant HT</th>
            <th className="px-2 py-1.5">Montant TTC</th>
            <th className="px-2 py-1.5">Statut</th>
            <th className="px-2 py-1.5">IBAN</th>
            <th className="px-2 py-1.5">Justificatif</th>
            <th className="px-2 py-1.5"></th>
          </tr>
        );
      case 'expenses':
        return (
          <tr className="text-left text-xs font-medium text-gray-600 bg-gray-50 border-b">
            <th className="px-2 py-1.5">Nom</th>
            <th className="px-2 py-1.5">Prénom</th>
            <th className="px-2 py-1.5">Poste</th>
            <th className="px-2 py-1.5">Montant HT</th>
            <th className="px-2 py-1.5">Montant TTC</th>
            <th className="px-2 py-1.5">Statut</th>
            <th className="px-2 py-1.5">Justificatif</th>
            <th className="px-2 py-1.5"></th>
          </tr>
        );
      default:
        return null;
    }
  };

  return (
    <div className="py-4">
      <div className="px-4 flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          <h3 className="text-base font-medium text-gray-900">
            {title} 
            <span className="ml-2 text-sm text-gray-500">
              ({totals.count} {totals.count > 1 ? 'éléments' : 'élément'})
            </span>
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-gray-500">Total HT:</span>
            <span className="ml-1 font-medium">{formatNumber(totals.totalHT)} €</span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
          >
            <Plus size={16} />
            Ajouter
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              {getHeaders()}
            </thead>
            <tbody>
              {items.map(item => (
                <RenderItemRow
                  key={item.id}
                  item={item}
                  type={type}
                  onUpdate={(updates) => onUpdateItem(item.id, updates)}
                  onDelete={() => onDeleteItem(item.id)}
                  onSelect={() => onSelectItem(item)}
                  isSelected={item.id === selectedItemId}
                  socialChargeRates={socialChargeRates}
                />
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    Aucun élément. Cliquez sur "Ajouter" pour créer un nouvel élément.
                  </td>
                </tr>
              )}
            </tbody>
            {items.length > 0 && (
              <tfoot className="bg-gray-50 font-medium text-sm">
                <tr>
                  {type === 'salaries' ? (
                    <>
                      <td colSpan={3} className="px-2 py-1.5 text-right">Total:</td>
                      <td className="px-2 py-1.5">{formatNumber(totals.totalSalaries)} €</td>
                      <td className="px-2 py-1.5"></td>
                      <td className="px-2 py-1.5"></td>
                      <td className="px-2 py-1.5">{formatNumber(totals.totalHT)} €</td>
                      <td colSpan={3}></td>
                    </>
                  ) : (
                    <>
                      <td className="px-2 py-1.5 text-right">Total:</td>
                      <td className="px-2 py-1.5">{formatNumber(totals.totalHT)} €</td>
                      <td className="px-2 py-1.5">{formatNumber(totals.totalTTC)} €</td>
                      <td colSpan={4}></td>
                    </>
                  )}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
      
      {showAddModal && (
        <AddItemModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={(item) => {
            console.log("Élément reçu dans RenderSubCategory:", item);
            // Utiliser la nouvelle fonction pour remplacer complètement l'élément
            onReplaceItem(item);
            setShowAddModal(false);
          }}
          type={type}
          socialChargeRates={socialChargeRates}
        />
      )}
      
      {selectedItemId && items.find(item => item.id === selectedItemId) && (
        <div className="w-full max-w-md mx-auto mt-6">
          <RenderItemDetails 
            item={items.find(item => item.id === selectedItemId)!}
            socialChargeRates={socialChargeRates}
            onUpdate={(updates) => onUpdateItem(selectedItemId, updates)}
            onDelete={() => onDeleteItem(selectedItemId)}
          />
        </div>
      )}
    </div>
  );
}