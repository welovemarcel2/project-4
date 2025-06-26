import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { BudgetCategory, BudgetLine, BudgetUnit } from '../../types/budget';
import { CurrencyCell } from './currency/CurrencyCell';
import { useCurrencyStore } from '../../stores/currencyStore';
import { CurrencyCode } from '../../types/currency';
import { BudgetRow } from './BudgetRow';
import { QuoteSettings } from '../../types/quoteSettings';

// Types enrichis
export interface BudgetInitialLine {
  id: string;
  name: string;
  quantity: number;
  number: number;
  unit: string;
  rate: number;
  overtime: number;
  socialChargeRate: number; // en %
}
export interface WorkLine {
  initialId?: string;
  isExtra?: boolean;
  name: string;
  quantity: number;
  number: number;
  unit: string;
  rate: number;
  overtime: number;
  socialChargeRate: number;
  currency?: CurrencyCode; // Ajout du champ currency
}

// Interface pour les props du WorkTable
interface WorkTableProps {
  budget: BudgetCategory[]; // Le vrai budget de l'onglet Budget
  workBudget?: WorkLine[];
  setWorkBudget?: (workBudget: WorkLine[]) => void;
  settings: QuoteSettings;
}

const CURRENCIES = [
  { code: 'EUR', symbol: '€' },
  { code: 'USD', symbol: '$' }
];

function flattenBudgetLines(categories: BudgetCategory[]): BudgetInitialLine[] {
  const lines: BudgetInitialLine[] = [];
  function recurse(items: BudgetLine[], parentId: string | null) {
          for (const item of items) {
      if (item.type === 'post' || item.type === 'subPost') {
        lines.push({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          number: item.number,
          unit: item.unit,
          rate: item.rate,
          overtime: item.overtime || 0,
          socialChargeRate: item.socialChargeRate || 0
        });
      }
      if (item.subItems && item.subItems.length > 0) {
        recurse(item.subItems, item.id);
      }
    }
  }
  for (const cat of categories) {
    recurse(cat.items, cat.id);
  }
  return lines;
}

export function WorkTable({ budget, workBudget: externalWorkBudget, setWorkBudget: setExternalWorkBudget, settings }: WorkTableProps) {
  const { selectedCurrency, currencies, convertAmount } = useCurrencyStore();
  
  // On utilise le vrai budget passé en props (celui de l'onglet Budget)
  const budgetInitial = flattenBudgetLines(budget);
  
  // workBudget = suivi réel - initialisé à partir du budget passé en props
  const [internalWorkBudget, setInternalWorkBudget] = useState<WorkLine[]>(() => {
    // Initialiser avec une copie du budget passé en props
    return budgetInitial.map(line => ({
      initialId: line.id,
      name: line.name,
      quantity: line.quantity,
      number: line.number,
      unit: line.unit,
      rate: line.rate,
      overtime: line.overtime,
      socialChargeRate: line.socialChargeRate
    }));
  });
  
  // Utiliser le workBudget externe s'il est fourni, sinon utiliser l'interne
  const workBudget = externalWorkBudget || internalWorkBudget;
  const setWorkBudget = setExternalWorkBudget || setInternalWorkBudget;
  
  const [currency, setCurrency] = useState('EUR');

  // Synchroniser le workBudget avec le budget passé en props si nécessaire
  React.useEffect(() => {
    const currentWorkBudgetIds = workBudget.filter(wl => wl.initialId).map(wl => wl.initialId);
    const budgetInitialIds = budgetInitial.map(line => line.id);
    
    // Vérifier si tous les postes du budget sont présents dans le workBudget
    const missingIds = budgetInitialIds.filter(id => !currentWorkBudgetIds.includes(id));
    
    if (missingIds.length > 0) {
      // Ajouter les postes manquants
      const missingLines = budgetInitial.filter(line => missingIds.includes(line.id));
      const newWorkBudget = [
        ...workBudget,
        ...missingLines.map(line => ({
          initialId: line.id,
          name: line.name,
          quantity: line.quantity,
          number: line.number,
          unit: line.unit,
          rate: line.rate,
          overtime: line.overtime,
          socialChargeRate: line.socialChargeRate
        }))
      ];
      setWorkBudget(newWorkBudget);
    }
  }, [budgetInitial, workBudget, setWorkBudget]);

  // Gestion du changement de devise
  const handleCurrencyChange = (idx: number, currencyCode: CurrencyCode, rate?: number) => {
    const currencyObj = currencies.find(c => c.code === currencyCode);
    if (!currencyObj) return;
    
    setWorkBudget(workBudget.map((line, i) => {
      if (i === idx) {
        if (currencyCode === selectedCurrency) {
          // Si on revient à la devise par défaut, on supprime la devise spécifique
          return { ...line, currency: undefined };
        } else {
          // Si on change la devise, on garde le même montant dans la nouvelle devise
          return { ...line, currency: currencyCode };
        }
      }
      return line;
    }));
  };

  // Ajout d'une ligne hors budget
  const handleAddExtra = () => {
    setWorkBudget([
      ...workBudget,
      { isExtra: true, name: 'Nouveau poste hors budget', quantity: 1, number: 1, unit: 'Jour', rate: 0, overtime: 0, socialChargeRate: 50 }
    ]);
  };

  // Edition
  const handleEdit = (idx: number, field: keyof WorkLine, value: any) => {
    setWorkBudget(workBudget.map((line, i) => i === idx ? { ...line, [field]: value } : line));
  };

  // Suppression
  const handleDelete = (idx: number) => {
    setWorkBudget(workBudget.filter((_, i) => i !== idx));
  };

  // Format monétaire
  const formatMoney = (val: number) => {
    const symbol = CURRENCIES.find(c => c.code === currency)?.symbol || '';
    return val.toLocaleString('fr-FR', { style: 'currency', currency, minimumFractionDigits: 2 }) + ' ' + symbol;
  };

  // Pour chaque ligne du budget initial, on cherche la ligne de suivi correspondante
  const rows = budgetInitial.map((initLine) => {
    const workLine = workBudget.find(wl => wl.initialId === initLine.id);
    return { initLine, workLine };
  });
  // On ajoute les lignes hors budget
  const extraRows = workBudget.filter(wl => wl.isExtra);

  // Sécurisation des settings et selectedCurrency
  const safeSettings = settings || { numbering: undefined, rateLabels: {}, showEmptyItems: true, socialChargesDisplay: 'detailed', applySocialChargesMargins: false, budgetLang: 'fr' };
  const safeSelectedCurrency = selectedCurrency || 'EUR';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-bold">Suivi budgétaire</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handleAddExtra}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={16} /> Ajouter un poste hors budget
          </button>
          <label className="flex items-center gap-2">
            Devise&nbsp;:
            <select value={currency} onChange={e => setCurrency(e.target.value)} className="border rounded px-2 py-1">
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
            </select>
          </label>
        </div>
      </div>
      
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th colSpan={8} className="text-center border-r text-xs font-medium text-gray-600">
                  Budget initial
                </th>
                <th colSpan={8} className="text-center border-r text-xs font-medium text-gray-600">
                  Suivi réel
                </th>
                <th className="text-center text-xs font-medium text-gray-600">Écart</th>
                <th className="text-center text-xs font-medium text-gray-600">Actions</th>
              </tr>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-1.5 py-1.5 min-w-[200px] text-xs font-medium text-gray-600">Nom</th>
                <th className="text-center px-1.5 py-1.5 w-14 text-xs font-medium text-gray-600">Qté</th>
                <th className="text-center px-1.5 py-1.5 w-14 text-xs font-medium text-gray-600">Nb</th>
                <th className="text-center px-1.5 py-1.5 w-16 text-xs font-medium text-gray-600">Unité</th>
                <th className="text-right px-1.5 py-1.5 w-16 text-xs font-medium text-gray-600">Tarif</th>
                <th className="text-center px-1.5 py-1.5 w-8 text-xs font-medium text-gray-600">H.S.</th>
                <th className="text-center px-1.5 py-1.5 w-16 text-xs font-medium text-gray-600">Ch. Soc.</th>
                <th className="text-right px-1.5 py-1.5 w-20 text-xs font-medium text-gray-600 border-r">Total</th>
                <th className="text-center px-1.5 py-1.5 w-14 text-xs font-medium text-gray-600">Qté</th>
                <th className="text-center px-1.5 py-1.5 w-14 text-xs font-medium text-gray-600">Nb</th>
                <th className="text-center px-1.5 py-1.5 w-16 text-xs font-medium text-gray-600">Unité</th>
                <th className="text-right px-1.5 py-1.5 w-16 text-xs font-medium text-gray-600">Tarif</th>
                <th className="text-center px-1.5 py-1.5 w-8 text-xs font-medium text-gray-600">H.S.</th>
                <th className="text-center px-1.5 py-1.5 w-16 text-xs font-medium text-gray-600">Ch. Soc.</th>
                <th className="text-center px-1.5 py-1.5 w-14 text-xs font-medium text-gray-600">Devise</th>
                <th className="text-right px-1.5 py-1.5 w-20 text-xs font-medium text-gray-600 border-r">Total</th>
                <th className="text-center px-1.5 py-1.5 w-14 text-xs font-medium text-gray-600">Écart</th>
                <th className="text-center px-1.5 py-1.5 w-24 text-xs font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ initLine, workLine }, idx) => {
                // Construction sécurisée de l'objet BudgetLine pour BudgetRow
                const safeItem = {
                  id: initLine.id || `init-${idx}`,
                  type: 'post' as const,
                  name: initLine.name || '',
                  parentId: null,
                  number: initLine.number ?? 1,
                  quantity: initLine.quantity ?? 1,
                  unit: (initLine.unit as BudgetUnit) || 'h',
                  rate: initLine.rate ?? 0,
                  overtime: initLine.overtime ?? 0,
                  socialCharges: '0',
                  socialChargeRate: initLine.socialChargeRate ?? 0,
                  agencyPercent: 0,
                  marginPercent: 0,
                  subItems: [],
                  isExpanded: false,
                  currency: undefined,
                  distributions: [],
                  includeSocialCharges: false,
                  includeSocialChargesInDistribution: false,
                  comments: '',
                  applySocialChargesMargins: false,
                  isNewPost: false,
                  comment: undefined,
                  tarifRef: undefined,
                  availableUnits: [],
                  tarifVariants: []
                };
                // Log de debug
                console.log('BudgetRow item (init)', safeItem);
                let leftCell;
                try {
                  leftCell = (
                    <BudgetRow
                      item={safeItem}
                      parentNumbers={[]}
                      settings={safeSettings}
                      categories={budget}
                      onUpdate={() => {}}
                      onDelete={() => {}}
                      disabled={true}
                      isWorkBudget={false}
                      quoteId={''}
                      selectedCurrency={safeSelectedCurrency}
                    />
                  );
                } catch (e) {
                  leftCell = <td colSpan={8} className="bg-red-100 text-red-700">Erreur BudgetRow: {String(e)}</td>;
                }
                return (
                  <tr key={initLine.id || idx}>
                    <td colSpan={8} className="p-0 bg-gray-100 border-r align-top">
                      {leftCell}
                    </td>
                    {/* ... partie droite ... */}
                  </tr>
                );
              })}
              {/* Lignes hors budget */}
              {extraRows.map((workLine, idx) => {
                const totalWork = (workLine.quantity * workLine.number * workLine.rate) + (workLine.overtime * workLine.rate);
                const chargesWork = totalWork * (workLine.socialChargeRate / 100);
                const totalWorkFinal = totalWork + chargesWork;
                
                // Calculer le total converti pour l'affichage
                const convertedTotalWork = workLine.currency && workLine.currency !== selectedCurrency
                  ? convertAmount(totalWorkFinal, workLine.currency, selectedCurrency)
                  : totalWorkFinal;
                
                return (
                  <tr key={workLine.name + idx} className="group border-b hover:bg-gray-50/80 h-6 bg-blue-50">
                    {/* Budget initial (vide, grisé) */}
                    <td className="px-1 py-0.5 bg-gray-50">
                      <span className="text-[11px] text-gray-400 italic">—</span>
                    </td>
                    <td className="text-center px-1 py-0.5 bg-gray-50">
                      <span className="text-[11px] text-gray-400">—</span>
                    </td>
                    <td className="text-center px-1 py-0.5 bg-gray-50">
                      <span className="text-[11px] text-gray-400">—</span>
                    </td>
                    <td className="text-center px-1 py-0.5 bg-gray-50">
                      <span className="text-[11px] text-gray-400">—</span>
                    </td>
                    <td className="text-right px-1 py-0.5 bg-gray-50">
                      <span className="text-[11px] text-gray-400">—</span>
                    </td>
                    <td className="text-center px-1 py-0.5 bg-gray-50">
                      <span className="text-[11px] text-gray-400">—</span>
                    </td>
                    <td className="text-center px-1 py-0.5 bg-gray-50">
                      <span className="text-[11px] text-gray-400">—</span>
                    </td>
                    <td className="text-right px-1 py-0.5 bg-gray-50 border-r">
                      <span className="text-[11px] text-gray-400">—</span>
                    </td>
                    {/* Suivi réel (modifiable) */}
                    <td className="text-center px-1 py-0.5">
                      <input 
                        type="text" 
                        className="w-32 text-center bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-0.5 text-[11px] italic" 
                        value={workLine.name} 
                        onChange={e => handleEdit(workBudget.length - extraRows.length + idx, 'name', e.target.value)} 
                      />
                    </td>
                    <td className="text-center px-1 py-0.5">
                      <input 
                        type="number" 
                        className="w-16 text-center bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-0.5 text-[11px]" 
                        value={workLine.quantity} 
                        min={0} 
                        onChange={e => handleEdit(workBudget.length - extraRows.length + idx, 'quantity', Number(e.target.value))} 
                      />
                    </td>
                    <td className="text-center px-1 py-0.5">
                      <input 
                        type="number" 
                        className="w-16 text-center bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-0.5 text-[11px]" 
                        value={workLine.number} 
                        min={0} 
                        onChange={e => handleEdit(workBudget.length - extraRows.length + idx, 'number', Number(e.target.value))} 
                      />
                    </td>
                    <td className="text-center px-1 py-0.5">
                      <input 
                        type="text" 
                        className="w-16 text-center bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-0.5 text-[11px]" 
                        value={workLine.unit} 
                        onChange={e => handleEdit(workBudget.length - extraRows.length + idx, 'unit', e.target.value)} 
                      />
                    </td>
                    <td className="text-right px-1 py-0.5">
                      <input 
                        type="number" 
                        className="w-20 text-right bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-0.5 text-[11px]" 
                        value={workLine.rate} 
                        min={0} 
                        onChange={e => handleEdit(workBudget.length - extraRows.length + idx, 'rate', Number(e.target.value))} 
                      />
                    </td>
                    <td className="text-center px-1 py-0.5">
                      <input 
                        type="number" 
                        className="w-16 text-center bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-0.5 text-[11px]" 
                        value={workLine.overtime} 
                        min={0} 
                        onChange={e => handleEdit(workBudget.length - extraRows.length + idx, 'overtime', Number(e.target.value))} 
                      />
                    </td>
                    <td className="text-center px-1 py-0.5">
                      <input 
                        type="number" 
                        className="w-16 text-center bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-0.5 text-[11px]" 
                        value={workLine.socialChargeRate} 
                        min={0} 
                        onChange={e => handleEdit(workBudget.length - extraRows.length + idx, 'socialChargeRate', Number(e.target.value))} 
                      />
                    </td>
                    <td className="text-center px-1 py-0.5">
                      <CurrencyCell
                        value={workLine.currency}
                        onChange={(currencyCode, rate) => handleCurrencyChange(workBudget.length - extraRows.length + idx, currencyCode, rate)}
                        highlight={!!workLine.currency}
                        rate={workLine.currency ? workLine.rate : undefined}
                        hasSocialCharges={false}
                        disabled={false}
                        currentCurrency={safeSelectedCurrency}
                        currentRate={workLine.rate}
                      />
                    </td>
                    <td className="text-right px-1 py-0.5 border-r">
                      <span className="text-[11px]">{formatMoney(convertedTotalWork)}</span>
                    </td>
                    <td className="text-center px-1 py-0.5">
                      <span className="text-[11px] text-blue-600">{formatMoney(totalWorkFinal)}</span>
                    </td>
                    <td className="text-center px-1 py-0.5">
                      <button onClick={() => handleDelete(workBudget.length - extraRows.length + idx)} className="text-red-600 hover:text-red-800" title="Supprimer">
                        <Trash2 size={14} />
                      </button>
                </td>
              </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}