import React from 'react';
import { BudgetCategory, BudgetLine, BudgetItemType } from '../../../types/budget';
import { QuoteSettings } from '../../../types/quoteSettings';
import { formatNumber } from '../../../utils/formatNumber';
import { calculateLineTotal } from '../../../utils/budgetCalculations/base';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';

interface BudgetComparisonProps {
  budget: BudgetCategory[];
  workBudget: BudgetCategory[];
  settings: QuoteSettings;
  onAddItem: (categoryId: string | null, parentId: string | null, type: BudgetItemType) => void;
  onUpdateItem: (categoryId: string, itemId: string, updates: Partial<BudgetLine>) => void;
}

function BudgetColumn({ 
  budget, 
  isReadOnly = false,
  onAddItem,
  onUpdateItem
}: { 
  budget: BudgetCategory[];
  isReadOnly?: boolean;
  onAddItem?: (categoryId: string | null, parentId: string | null, type: BudgetItemType) => void;
  onUpdateItem?: (categoryId: string, itemId: string, updates: Partial<BudgetLine>) => void;
}) {
  const renderItems = (items: BudgetLine[], categoryId: string, parentNumbers: string[] = []) => {
    return items.map((item, index) => {
      const currentNumbers = [...parentNumbers, (index + 1).toString()];
      const indentation = parentNumbers.length * 12;
      
      return (
        <React.Fragment key={item.id}>
          <tr className={`group border-b ${isReadOnly ? 'bg-gray-50/50' : 'hover:bg-gray-50/80'} h-6`}>
            <td className="w-6 px-1 py-0.5">
              {item.subItems && item.subItems.length > 0 && (
                <button className="p-0.5 hover:bg-blue-100 rounded transition-colors">
                  {item.isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
              )}
            </td>
            <td className="px-1 py-0.5 sticky left-0" style={{ paddingLeft: `${indentation + 4}px` }}>
              <div className="flex items-center">
                <span className="text-[11px] text-gray-400 font-mono mr-2">{currentNumbers.join('.')}</span>
                {isReadOnly ? (
                  <span className={`text-[11px] ${item.type === 'subCategory' ? 'font-semibold text-blue-900' : ''}`}>
                    {item.name}
                  </span>
                ) : (
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => onUpdateItem?.(categoryId, item.id, { name: e.target.value })}
                    className={`w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-0.5 text-[11px] ${
                      item.type === 'subCategory' ? 'font-semibold text-blue-900' : ''
                    }`}
                  />
                )}
              </div>
            </td>
            <td className="text-center px-1 py-0.5">
              {isReadOnly ? (
                <span className="text-[11px] text-gray-600">
                  {item.quantity > 0 ? formatNumber(item.quantity) : '-'}
                </span>
              ) : (
                <input
                  type="number"
                  value={item.quantity || ''}
                  onChange={(e) => onUpdateItem?.(categoryId, item.id, { 
                    quantity: parseFloat(e.target.value) || 0 
                  })}
                  className="w-14 text-center bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-0.5 text-[11px]"
                  min="0"
                  step="0.5"
                />
              )}
            </td>
            <td className="text-center px-1 py-0.5">
              {isReadOnly ? (
                <span className="text-[11px] text-gray-600">
                  {item.number > 0 ? formatNumber(item.number) : '-'}
                </span>
              ) : (
                <input
                  type="number"
                  value={item.number || ''}
                  onChange={(e) => onUpdateItem?.(categoryId, item.id, { 
                    number: parseFloat(e.target.value) || 0 
                  })}
                  className="w-14 text-center bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-0.5 text-[11px]"
                  min="0"
                  step="1"
                />
              )}
            </td>
            <td className="text-center px-1 py-0.5">
              <span className="text-[11px] text-gray-600">
                {item.unit !== '-' ? item.unit : '-'}
              </span>
            </td>
            <td className="text-right px-1 py-0.5">
              {isReadOnly ? (
                <span className="text-[11px] text-gray-600">
                  {item.rate > 0 ? formatNumber(item.rate) : '-'}
                </span>
              ) : (
                <input
                  type="number"
                  value={item.rate || ''}
                  onChange={(e) => onUpdateItem?.(categoryId, item.id, { 
                    rate: parseFloat(e.target.value) || 0 
                  })}
                  className="w-16 text-right bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-0.5 text-[11px]"
                  min="0"
                  step="0.01"
                />
              )}
            </td>
            <td className="text-right px-1 py-0.5">
              <span className="text-[11px]">
                {formatNumber(calculateLineTotal(item))}
              </span>
            </td>
            {!isReadOnly && (
              <td className="px-1 py-0.5 w-8">
                {item.type === 'subCategory' && (
                  <button
                    onClick={() => onAddItem?.(categoryId, item.id, 'post')}
                    className="p-1 hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Ajouter un poste"
                  >
                    <Plus size={14} className="text-blue-600" />
                  </button>
                )}
                {item.type === 'post' && (
                  <button
                    onClick={() => onAddItem?.(categoryId, item.id, 'subPost')}
                    className="p-1 hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Ajouter un sous-poste"
                  >
                    <Plus size={14} className="text-blue-600" />
                  </button>
                )}
              </td>
            )}
          </tr>
          {item.subItems && item.subItems.length > 0 && renderItems(item.subItems, categoryId, currentNumbers)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="flex-1 bg-white rounded-lg shadow border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr className="border-b">
              <th className="w-6 px-1"></th>
              <th className="text-left px-1.5 py-1.5 min-w-[300px] text-xs font-medium text-gray-600 sticky left-0 bg-gray-50">
                Ligne de coût
              </th>
              <th className="text-center px-1.5 py-1.5 w-14 text-xs font-medium text-gray-600">Qté</th>
              <th className="text-center px-1.5 py-1.5 w-14 text-xs font-medium text-gray-600">Nb</th>
              <th className="text-center px-1.5 py-1.5 w-16 text-xs font-medium text-gray-600">Unité</th>
              <th className="text-right px-1.5 py-1.5 w-16 text-xs font-medium text-gray-600">Tarif</th>
              <th className="text-right px-1.5 py-1.5 w-20 text-xs font-medium text-gray-600">Total</th>
              {!isReadOnly && <th className="w-8 px-1.5 py-1.5"></th>}
            </tr>
          </thead>
          <tbody>
            {budget.map((category, index) => (
              <React.Fragment key={category.id}>
                <tr className={`${isReadOnly ? 'bg-blue-50/80' : 'bg-blue-50/50'} h-8 border-b border-blue-200/50`}>
                  <td className="px-1 py-1"></td>
                  <td className="px-2 py-1" colSpan={5}>
                    <div className="flex items-center">
                      <span className="text-[11px] text-gray-600 font-mono mr-2">{index + 1}</span>
                      <span className="text-xs font-bold uppercase tracking-wide text-blue-900">
                        {category.name}
                      </span>
                    </div>
                  </td>
                  <td className="text-right px-2 py-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-blue-900">
                      {formatNumber(calculateLineTotal(category))}
                    </span>
                  </td>
                  {!isReadOnly && (
                    <td className="px-1 py-1">
                      <button
                        onClick={() => onAddItem?.(category.id, null, 'subCategory')}
                        className="p-1 hover:bg-blue-100/50 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Ajouter une sous-catégorie"
                      >
                        <Plus size={14} className="text-blue-600" />
                      </button>
                    </td>
                  )}
                </tr>
                {renderItems(category.items, category.id, [(index + 1).toString()])}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BudgetComparison({
  budget,
  workBudget,
  settings,
  onAddItem,
  onUpdateItem
}: BudgetComparisonProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Budget Initial</h3>
          <BudgetColumn budget={budget} isReadOnly={true} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Budget de Travail</h3>
          <BudgetColumn 
            budget={workBudget} 
            onAddItem={onAddItem}
            onUpdateItem={onUpdateItem}
          />
        </div>
      </div>
    </div>
  );
}