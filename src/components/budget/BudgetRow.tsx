import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, MessageCircle, CheckCircle, Search } from 'lucide-react';
import { BudgetLine, BudgetCategory } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';
import { DeleteButton } from './DeleteButton';
import { SocialChargesCell } from './SocialChargesCell';
import { OvertimeCell } from './overtime/OvertimeCell';
import { CurrencyCell } from './currency/CurrencyCell';
import { MarginCell } from './margins/MarginCell';
import { AgencyCell } from './margins/AgencyCell';
import { QuickInputCell } from './QuickInputCell';
import { CategorySelector } from './CategorySelector';
import { formatNumber } from '../../utils/formatNumber';
import { calculateLineTotal, calculateLineTotalWithCurrency } from '../../utils/budgetCalculations/base';
import { calculateSocialCharges } from '../../utils/budgetCalculations/base';
import { useCurrencyStore } from '../../stores/currencyStore';
import { AddSubItemButton } from './AddSubItemButton';
import { BudgetUnit } from '../../types/budget';
import { DistributionCell } from './distribution/DistributionCell';
import { formatItemNumber } from '../../utils/formatItemNumber';
import { useExpenseCategoriesStore } from '../../stores/expenseCategoriesStore';
import { formatOvertimeDetails } from '../../utils/overtime/calculations';
import { CurrencyDisplay } from './CurrencyDisplay';
import { CurrencyCode } from '../../types/currency';
import PostCurrencySelector from './PostCurrencySelector';
import { computePercentageBase, getBaseStructureKey } from '../../utils/budget/percentageBase';

interface BudgetRowProps {
  item: BudgetLine;
  parentNumbers: string[];
  settings: QuoteSettings;
  categories: BudgetCategory[];
  onUpdate: (updates: Partial<BudgetLine>) => void;
  onDelete: () => void;
  disabled?: boolean;
  isWorkBudget?: boolean;
  quoteId: string;
  selectedCurrency: CurrencyCode;
  onOpenRatesGrid?: (onSelect: (poste: any) => void) => void;
}

// Helper pour obtenir tous les ids de postes d'une catégorie
function getAllPostIdsFromCategory(categoryId: string, categories: BudgetCategory[]): string[] {
  const cat = categories.find(c => c.id === categoryId);
  if (!cat) return [];
  const ids: string[] = [];
  cat.items.forEach(item => {
    if (item.type === 'post' || item.type === 'subPost') {
      ids.push(item.id);
    }
    if (item.subItems) {
      item.subItems.forEach(subItem => {
        if (subItem.type === 'post' || subItem.type === 'subPost') {
          ids.push(subItem.id);
        }
      });
    }
  });
  return ids;
}

// Helper pour normaliser les chaînes (minuscule, sans accents, trim)
function normalizeString(str: string) {
  return (str || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

// Nouvelle version robuste : calcule dynamiquement la base d'un poste %
function getDynamicBaseForPercentage(
  item: BudgetLine,
  categories: BudgetCategory[],
  settings: QuoteSettings,
  convertAmount: (amount: number, fromCurrency?: CurrencyCode, toCurrency?: CurrencyCode) => number,
  selectedCurrency: CurrencyCode
): number {
  if (!item.selectedCategories || item.selectedCategories.length === 0) return 0;

  // Map pour retrouver rapidement une catégorie ou un post par ID
  const categoryMap = new Map<string, BudgetCategory>();
  const postMap = new Map<string, BudgetLine>();
  function indexAll(categories: BudgetCategory[]) {
    for (const cat of categories) {
      categoryMap.set(cat.id, cat);
      if (cat.items) {
        for (const post of cat.items) {
          postMap.set(post.id, post);
          if (post.subItems && post.subItems.length > 0) {
            indexPosts(post.subItems);
          }
        }
      }
    }
  }
  function indexPosts(posts: BudgetLine[]) {
    for (const post of posts) {
      postMap.set(post.id, post);
      if (post.subItems && post.subItems.length > 0) {
        indexPosts(post.subItems);
      }
    }
  }
  indexAll(categories);

  // Pour éviter les doublons : si un parent est sélectionné, on ignore ses enfants
  const selectedSet = new Set(item.selectedCategories);
  const alreadyIncluded = new Set<string>();

  // Helper pour savoir si un parent (catégorie ou sous-catégorie) est sélectionné
  function isParentSelected(post: BudgetLine, parentChain: string[]): boolean {
    return parentChain.some(parentId => selectedSet.has(parentId));
  }

  // Calcule le sous-total d'une catégorie (tous ses items, récursif)
  function sumCategory(cat: BudgetCategory): number {
    let total = 0;
    if (cat.items) {
      for (const post of cat.items) {
        total += sumPost(post, [cat.id]);
      }
    }
    return total;
  }

  // Calcule le sous-total d'une sous-catégorie (BudgetLine de type subCategory)
  function sumSubCategory(subCat: BudgetLine, parentChain: string[]): number {
    let total = 0;
    if (subCat.subItems) {
      for (const post of subCat.subItems) {
        total += sumPost(post, [...parentChain, subCat.id]);
      }
    }
    return total;
  }

  // Calcule le total d'un poste ou sous-poste (et ses sous-items, sauf si parent sélectionné)
  function sumPost(post: BudgetLine, parentChain: string[]): number {
    if (alreadyIncluded.has(post.id) || isParentSelected(post, parentChain)) return 0;
    alreadyIncluded.add(post.id);
    // Si c'est une sous-catégorie sélectionnée, on prend son sous-total
    if (post.type === 'subCategory' && selectedSet.has(post.id)) {
      return sumSubCategory(post, parentChain);
    }
    // Si c'est un poste ou sous-poste sélectionné, on prend uniquement ce poste
    if ((post.type === 'post' || post.type === 'subPost') && selectedSet.has(post.id)) {
      return calculateLineTotalWithCurrency(post, settings, convertAmount, selectedCurrency);
    }
    // Sinon, on descend dans les sous-items
    let total = 0;
    if (post.subItems && post.subItems.length > 0) {
      for (const sub of post.subItems) {
        total += sumPost(sub, [...parentChain, post.id]);
      }
    }
    return total;
  }

  // Additionne la base dynamique sans doublons ni recoupement parent/enfant
  let base = 0;
  for (const id of item.selectedCategories) {
    if (categoryMap.has(id)) {
      // Catégorie sélectionnée : on prend son sous-total direct
      base += sumCategory(categoryMap.get(id)!);
    } else if (postMap.has(id)) {
      const post = postMap.get(id)!;
      if (post.type === 'subCategory') {
        // Sous-catégorie sélectionnée : on prend son sous-total direct
        base += sumSubCategory(post, []);
      } else if (post.type === 'post' || post.type === 'subPost') {
        // Poste ou sous-poste sélectionné : on prend uniquement ce poste
        base += calculateLineTotalWithCurrency(post, settings, convertAmount, selectedCurrency);
      }
    }
  }
  return base;
}

// Ajout du composant RenderCounter pour debug
function RenderCounter() {
  const renderCount = useRef(0);
  renderCount.current += 1;
  return <div style={{ color: '#64748b' }}>Render #{renderCount.current}</div>;
}

export function BudgetRow({
  item,
  parentNumbers,
  settings,
  categories,
  onUpdate,
  onDelete,
  disabled = false,
  isWorkBudget = false,
  quoteId,
  selectedCurrency,
  onOpenRatesGrid
}: BudgetRowProps) {
  const indentation = parentNumbers.length * 12;
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const showExpandButton = hasSubItems;
  
  // Format item number based on settings
  const itemNumber = settings.numbering 
    ? formatItemNumber(
        parentNumbers.map(n => parseInt(n)),
        [
          settings.numbering.category,
          settings.numbering.subCategory,
          settings.numbering.post,
          settings.numbering.subPost
        ],
        settings.numbering.separator
      )
    : parentNumbers.join('.');
  
  const { convertAmount, currencies } = useCurrencyStore();
  const { getCategories, showExpenseDistribution } = useExpenseCategoriesStore();
  const expenseCategories = getCategories(quoteId);

  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [isNameEditing, setIsNameEditing] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [forceRecalc, setForceRecalc] = useState(0);
  const comment = item.comment;
  const hasActiveComment = comment && comment.text && !comment.checked;

  // Obtenir les labels des taux personnalisés
  const rate1Label = settings.rateLabels?.rate1Label || 'TX 1';
  const rate2Label = settings.rateLabels?.rate2Label || 'TX 2';

  // Ajout d'un état pour mémoriser le dernier champ modifié
  const [lastEditedField, setLastEditedField] = useState<string | null>(null);

  // Pour le bouton de devise
  const [showCurrencyTooltip, setShowCurrencyTooltip] = useState(false);
  // Pour le bouton de charges sociales
  const [showCharges, setShowCharges] = useState(false);

  const [loupeClicked, setLoupeClicked] = useState(false);

  const debugKey = useMemo(() => {
    if (!item.selectedCategories) return '';
    return item.selectedCategories
      .map(id => {
        const cat = categories.find(c => c.id === id);
        if (cat) {
          // Hash simple : id, name, ids des items
          return `${cat.id}:${cat.name}:${cat.items.map(i => i.id).join(',')}`;
        }
        // Cherche le post dans toutes les catégories/items/sous-items
        const findPostRecursively = (posts: BudgetLine[]): BudgetLine | undefined => {
          for (const post of posts) {
            if (post.id === id) return post;
            if (post.subItems && post.subItems.length > 0) {
              const found = findPostRecursively(post.subItems);
              if (found) return found;
            }
          }
          return undefined;
        };
        for (const cat of categories) {
          const post = findPostRecursively(cat.items);
          if (post) {
            // Hash simple : id, name, ids des subItems
            return `${post.id}:${post.name}:${(post.subItems || []).map(i => i.id).join(',')}`;
          }
        }
        return id;
      })
      .join('|');
  }, [item.selectedCategories, categories]);

  useEffect(() => {
    if (isNameEditing) {
      requestAnimationFrame(() => {
        nameInputRef.current?.select();
      });
    }
  }, [isNameEditing]);

  const handleRateClick = () => {
    if (item.unit === '%') {
      setShowCategorySelector(true);
    }
  };

  // Récupérer le taux original (non converti)
  const originalRate = item.rate;
  
  // Pour le budget de travail, on utilise le coût s'il est disponible
  const originalValue = isWorkBudget && item.cost !== undefined ? item.cost : item.rate;
  
  // Afficher le taux dans la devise de la ligne (ou devise du budget si undefined)
  const displayRate = item.rate;
  const displayCurrency = item.currency || selectedCurrency;
  
  // Pour le calcul, on convertit toujours vers la devise sélectionnée si nécessaire
  // Pour le budget de travail, utiliser le coût s'il est défini
  const rateForCalculation = isWorkBudget && item.cost !== undefined ? item.cost : item.rate;
  const convertedRate = item.currency && item.currency !== selectedCurrency 
    ? convertAmount(rateForCalculation, item.currency, selectedCurrency) 
    : rateForCalculation;
  
  // Calculer le total en tenant compte des sous-postes et des heures supplémentaires
  const calculateTotalWithSubItems = () => {
    if (hasSubItems) {
      return item.subItems.reduce((total, subItem) => {
        if (subItem.unit === '%') {
          const rate = isWorkBudget && subItem.cost !== undefined ? subItem.cost : subItem.rate;
          return total + ((rate * (subItem.number || 0)) / 100);
        }
        // Utiliser la fonction avec conversion de devise
        const subItemTotal = calculateLineTotalWithCurrency(subItem, settings, convertAmount, selectedCurrency);
        return total + subItemTotal;
      }, 0);
    } else {
      if (item.unit === '%') {
        // Cas spécial : si selectedCategories contient des ids de catégorie, on prend dynamiquement tous les postes de la catégorie
        let ids = item.selectedCategories || [];
        let total = 0;
        ids.forEach(id => {
          // Si c'est une catégorie, on prend tous ses postes dynamiquement
          const cat = categories.find(c => c.id === id);
          if (cat) {
            getAllPostIdsFromCategory(id, categories).forEach(postId => {
              // Chercher le poste dans toutes les catégories
              const post = categories.flatMap(c => c.items.concat(...(c.items.flatMap(i => i.subItems || [])))).find(p => p.id === postId);
              if (post) {
                total += calculateLineTotalWithCurrency(post, settings, convertAmount, selectedCurrency);
              }
            });
          } else {
            // Sinon, c'est un poste ou sous-poste sélectionné directement
            const post = categories.flatMap(c => c.items.concat(...(c.items.flatMap(i => i.subItems || [])))).find(p => p.id === id);
            if (post) {
              total += calculateLineTotalWithCurrency(post, settings, convertAmount, selectedCurrency);
            }
          }
        });
        return (item.rate * total) / 100;
      }
      // Utiliser la fonction avec conversion de devise
      return calculateLineTotalWithCurrency(item, settings, convertAmount, selectedCurrency);
    }
  };
  
  // Utiliser useMemo pour recalculer automatiquement le total
  const convertedTotal = useMemo(() => {
    const total = calculateTotalWithSubItems();
    return total;
  }, [
    item.rate, item.currency, item.quantity, item.number, item.overtime, selectedCurrency, convertAmount, settings, hasSubItems, item.subItems, isWorkBudget, forceRecalc,
    // Dépendance profonde sur la base dynamique d'un poste %
    ...(item.unit === '%' && item.selectedCategories ? [getBaseStructureKey(item.selectedCategories, categories)] : [])
  ]);

  const handleCurrencyChange = (currencyCode: CurrencyCode, convertedRate?: number) => {
    // Si on revient à la devise par défaut, on supprime la devise spécifique
    if (currencyCode === selectedCurrency) {
      onUpdate({ currency: undefined });
    } else {
      onUpdate({ currency: currencyCode, rate: convertedRate ?? item.rate });
    }
  };

  const handleUnitChange = (newUnit: string) => {
    if (newUnit === '%') {
      setShowCategorySelector(true);
      const updates: Partial<BudgetLine> = {
        unit: newUnit as BudgetUnit,
        selectedCategories: [],
        includeSocialCharges: false
      };
      onUpdate(updates);
    } else if (item.unit === '%') {
      // Reset percentage-related fields when switching from %
      onUpdate({
        unit: newUnit as BudgetUnit,
        selectedCategories: undefined,
        rate: 0
      });
    } else {
      // Mettre à jour le prix selon la variante tarifaire
      let newRate = item.rate;
      if (item.tarifVariants && item.tarifVariants.length > 0) {
        const variant = item.tarifVariants.find(v => v['Unit'] === newUnit);
        if (variant && variant['Price']) {
          const priceStr = String(variant['Price']).replace(/[^\d.,-]/g, '').replace(',', '.');
          newRate = parseFloat(priceStr) || 0;
        }
      }
      onUpdate({ unit: newUnit as BudgetUnit, rate: newRate });
    }
  };

  const rowStyles = {
    category: "bg-blue-800 text-white font-bold",
    subCategory: "bg-blue-100 text-black font-bold",
    post: "hover:bg-gray-50/80",
    subPost: "hover:bg-gray-50/80 italic"
  }[item.type];

  const isLocked = item.type === 'subCategory';

  const handleAddSubPost = () => {
    const newSubItem: BudgetLine = {
      id: crypto.randomUUID(),
      type: 'subPost',
      name: 'Nouveau sous-poste',
      parentId: item.id,
      quantity: item.quantity,
      number: item.number,
      unit: item.unit,
      rate: item.rate,
      socialCharges: item.socialCharges,
      agencyPercent: item.agencyPercent,
      marginPercent: item.marginPercent,
      subItems: []
    };

    onUpdate({
      subItems: [...(item.subItems || []), newSubItem],
      isExpanded: true
    });
  };

  const contentIndentation = item.type === 'post' ? indentation - 12 : indentation;
  
  // Déterminer si les champs doivent être désactivés
  // Pour les postes avec sous-postes, désactiver les champs de quantité, nombre et tarif
  const fieldsDisabled = disabled || isLocked || (item.type === 'post' && hasSubItems);

  // Tabindex for keyboard navigation
  const baseTabIndex = parseInt(parentNumbers.join('')) * 100;
  
  // On considère la bulle visible si :
  // - on survole la ligne OU le champ commentaire est ouvert OU un commentaire non checké existe
  const showCommentBubble = item.type === 'post' && (hovered || showCommentInput || (comment && comment.text && !comment.checked));
  
  return (
    <>
      <tr
        className={`group border-b ${rowStyles} h-6 ${(comment && comment.text && !comment.checked) ? 'bg-yellow-100' : ''}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <td className="w-6 px-1 py-0.5 flex items-center gap-1">
          {showExpandButton && (
            <button 
              onClick={() => onUpdate({ isExpanded: !item.isExpanded })}
              className="p-0.5 hover:bg-blue-100 rounded transition-colors"
            >
              {item.isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          )}
        </td>

        <td className="px-1 py-0.5 sticky left-0" style={{ paddingLeft: `${contentIndentation}px` }}>
          <div className="flex items-center gap-1">
            <DeleteButton type={item.type} onClick={onDelete} disabled={disabled} />
            {item.type === 'post' && (
              <AddSubItemButton onClick={handleAddSubPost} disabled={disabled} />
            )}
            <div 
              className="flex-1 cursor-pointer"
              onClick={() => !disabled && setIsNameEditing(true)}
              tabIndex={baseTabIndex}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  !disabled && setIsNameEditing(true);
                }
              }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-gray-300 font-mono tracking-tighter">{itemNumber}</span>
                {isNameEditing ? (
                  <div className="flex flex-row flex-nowrap items-center w-full min-w-0">
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={item.name}
                      onChange={(e) => onUpdate({ name: e.target.value })}
                      onBlur={() => {
                        if (!loupeClicked) setIsNameEditing(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setIsNameEditing(false);
                          const nextElement = document.querySelector(`[data-field=\"quantity\"][data-item-id=\"${item.id}\"]`);
                          if (nextElement) {
                            (nextElement as HTMLElement).focus();
                          }
                        } else if (e.key === 'Escape') {
                          setIsNameEditing(false);
                        }
                      }}
                      className="flex-1 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-0.5 text-[11px] min-w-0"
                      disabled={disabled}
                      style={{marginRight: 2}}
                    />
                    {onOpenRatesGrid && (
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-blue-100 transition-colors flex-shrink-0"
                        title="Importer depuis la grille tarifaire"
                        style={{marginLeft: 2}}
                        onMouseDown={() => setLoupeClicked(true)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setLoupeClicked(false);
                          onOpenRatesGrid((poste) => {
                            if (poste) {
                              const nameFr = poste['Name FR'] || '';
                              const nameEn = poste['Name EN'] || '';
                              const name = (settings?.budgetLang === 'en' ? nameEn : nameFr) || nameFr || nameEn || '';
                              // Parse le tarif
                              let rate = 0;
                              if (poste['Price']) {
                                const priceStr = String(poste['Price']).replace(/[^\d.,-]/g, '').replace(',', '.');
                                rate = parseFloat(priceStr) || 0;
                              }
                              // Récupère toutes les variantes pour ce poste ET cette Pricing Base
                              let tarifVariants: any[] = [];
                              let availableUnits: string[] = [];
                              if (window && (window as any).csvData) {
                                const allRows = (window as any).csvData as any[];
                                // Correction : filtrer toutes les lignes du poste ET de la Pricing Base sélectionnée (normalisé)
                                const nameFrNorm = normalizeString(nameFr);
                                const nameEnNorm = normalizeString(nameEn);
                                const pricingBaseNorm = normalizeString(poste['Pricing Base'] || '');
                                const nameFrMatch = (r: any) => normalizeString(r['Name FR']) === nameFrNorm;
                                const nameEnMatch = (r: any) => normalizeString(r['Name EN']) === nameEnNorm;
                                const pricingBaseMatch = (r: any) => normalizeString(r['Pricing Base']) === pricingBaseNorm;
                                tarifVariants = allRows.filter(r => nameFrMatch(r) && nameEnMatch(r) && pricingBaseMatch(r));
                                availableUnits = Array.from(new Set(tarifVariants.map(r => r['Unit'])));
                                // Log détaillé pour debug
                                if (nameFrNorm.includes('assistant decorateur') && pricingBaseNorm === 'uspa') {
                                  console.log('DEBUG UNITS - 1er assistant décorateur USPA', { allRows: allRows.filter(r => nameFrMatch(r) && nameEnMatch(r)), tarifVariants, availableUnits });
                                }
                              } else if (poste._variants) {
                                tarifVariants = poste._variants.filter((v: any) => v['Pricing Base'] === poste['Pricing Base']);
                                availableUnits = Array.from(new Set(poste._variants.filter((v: any) => v['Pricing Base'] === poste['Pricing Base']).map((v: any) => v['Unit'])));
                              } else if (poste['Unit']) {
                                availableUnits = [poste['Unit']];
                                tarifVariants = [poste];
                              }
                              // Unité par défaut
                              let unit = poste['Unité par défaut'] || poste['Unit'] || (availableUnits[0] || '');
                              // Heures de base (pour overtime)
                              let baseHours = poste['Hour base'] || poste['Hours base'] || undefined;
                              onUpdate({
                                name,
                                tarifRef: { nameFr, nameEn, pricingBase: poste['Pricing Base'] },
                                rate,
                                availableUnits,
                                tarifVariants,
                                unit,
                                ...(baseHours ? { baseHours: baseHours } : {}),
                              });
                              console.log('UNITS DEBUG', { nameFr, nameEn, pricingBase: poste['Pricing Base'], availableUnits, tarifVariants });
                              setIsNameEditing(false);
                            }
                          });
                        }}
                      >
                        <Search size={16} className="text-blue-600" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="block px-0.5 text-[11px] truncate">{item.name}</span>
                    {item.overtimeDetails && (
                      <span className="text-[10px] text-gray-500 italic">
                        {formatOvertimeDetails(item.overtimeDetails)}
                      </span>
                    )}
                    {showCommentBubble && (
                      <button
                        className={`ml-1 p-0.5 rounded transition-colors ${(comment && comment.text && !comment.checked) ? 'bg-yellow-200' : 'hover:bg-gray-200'}`}
                        title={comment && comment.text ? 'Voir/éditer le commentaire' : 'Ajouter un commentaire'}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCommentInput((v) => !v);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.stopPropagation();
                            setShowCommentInput((v) => !v);
                          }
                        }}
                      >
                        <MessageCircle size={14} className={(comment && comment.text && !comment.checked) ? 'text-yellow-600' : 'text-gray-500'} />
                      </button>
                    )}
                    {showCommentInput && (
                      <input
                        type="text"
                        className="ml-1 px-1 py-0.5 border rounded text-xs bg-white"
                        placeholder="Ajouter un commentaire..."
                        value={comment?.text || ''}
                        onChange={e => onUpdate({ comment: { text: e.target.value, checked: false } })}
                        onBlur={() => setShowCommentInput(false)}
                        onKeyDown={e => {
                          e.stopPropagation();
                          if (e.key === 'Enter') setShowCommentInput(false);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        autoFocus
                        style={{ minWidth: 180 }}
                      />
                    )}
                    {comment && comment.text && !comment.checked && hovered && !showCommentInput && (
                      <span 
                        className="ml-2 px-2 py-0.5 rounded text-xs bg-yellow-200 text-yellow-800"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        {comment.text}
                      </span>
                    )}
                    {comment && comment.text && !comment.checked && hovered && !showCommentInput && (
                      <button
                        className="ml-1 p-0.5 rounded hover:bg-green-100"
                        title="Marquer le commentaire comme traité"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdate({ comment: { ...comment, checked: true } });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.stopPropagation();
                            onUpdate({ comment: { ...comment, checked: true } });
                          }
                        }}
                      >
                        <CheckCircle size={14} className="text-green-600" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </td>

        <td className="text-center px-1 py-0.5">
          {item.type !== 'subCategory' && (
            <QuickInputCell
              value={item.quantity}
              onChange={(value) => onUpdate({ quantity: value })}
              type="quantity"
              itemId={item.id}
              disabled={fieldsDisabled}
              tabIndex={baseTabIndex + 1}
            />
          )}
        </td>

        <td className="text-center px-1 py-0.5">
          {item.type !== 'subCategory' && (
            <QuickInputCell
              value={item.number}
              onChange={(value) => onUpdate({ number: value })}
              type="number"
              itemId={item.id}
              disabled={fieldsDisabled}
              tabIndex={baseTabIndex + 2}
            />
          )}
        </td>

        <td className="text-center px-1 py-0.5 text-[11px]">
          {item.type !== 'subCategory' && (
            <select
              value={item.unit}
              onChange={(e) => handleUnitChange(e.target.value)}
              className="w-16 text-center bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-0.5 text-[11px]"
              disabled={fieldsDisabled}
              tabIndex={baseTabIndex + 3}
             onKeyDown={(e) => {
               if (e.key === 'Enter') {
                 e.preventDefault();
                 e.stopPropagation();
                 // Move to rate field
                 const rateElement = document.querySelector(`[data-field="rate"][data-item-id="${item.id}"]`);
                 if (rateElement) {
                   (rateElement as HTMLElement).click();
                 }
               }
             }}
            >
              {Array.isArray(item.availableUnits) && item.availableUnits.length > 0 ? (
                item.availableUnits.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))
              ) : (
                <option value="">Aucune unité disponible</option>
              )}
            </select>
          )}
        </td>

        <td className="text-right px-1 py-0.5">
          {String(item.unit) === '%' ? (
            <span className="text-[11px] font-mono text-gray-700 select-none" title="Base dynamique : somme de tous les postes de la sélection (catégorie ou sous-catégorie)">
              {formatNumber(computePercentageBase(item.selectedCategories || [], categories, settings, convertAmount, selectedCurrency, showCharges, true).total)}
              <div key={debugKey} style={{ fontSize: 12, color: '#b91c1c', background: '#fef2f2', borderRadius: 3, padding: 4, marginTop: 4, maxWidth: 350, minHeight: 30 }}>
                <b>Base dynamique :</b>
                <div style={{ marginBottom: 4 }}>
                  <label style={{ fontSize: 11 }}>
                    <input type="checkbox" checked={showCharges} onChange={e => setShowCharges(e.target.checked)} style={{ marginRight: 4 }} />
                    Inclure charges sociales dans la base
                  </label>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {(() => {
                    const baseResult = computePercentageBase(item.selectedCategories || [], categories, settings, convertAmount, selectedCurrency, showCharges, true);
                    if (baseResult.details.length === 0) {
                      return <li style={{ color: '#64748b' }} key="none">(Aucune base sélectionnée)</li>;
                    }
                    return [
                      ...baseResult.details.map(base => (
                        <li key={base.id}>
                          <span>ID: {base.id}, Nom: {base.name}, <b>Total: {formatNumber(base.amount)}</b></span>
                          {base.children && base.children.length > 0 && (
                            <ul style={{ margin: 0, paddingLeft: 12, listStyle: 'circle' }}>
                              {base.children.map(child => (
                                <li key={child.id}>Poste ID: {child.id}, Nom: {child.name}, Montant: {formatNumber(child.amount)}</li>
                              ))}
                            </ul>
                          )}
                        </li>
                      )),
                      computePercentageBase(item.selectedCategories || [], categories, settings, convertAmount, selectedCurrency, showCharges).total === 0 && <li key="warn" style={{ color: '#eab308' }}><b>⚠️ Base sélectionnée vide ou incohérente</b></li>,
                      <li key="debug-info" style={{ marginTop: 8, color: '#b91c1c', fontSize: 11 }}><RenderCounter /></li>
                    ];
                  })()}
                </ul>
                <b>Total base : {formatNumber(computePercentageBase(item.selectedCategories || [], categories, settings, convertAmount, selectedCurrency, showCharges, true).total)}</b>
              </div>
            </span>
          ) : (
            <QuickInputCell
              value={displayRate}
              onChange={(value) => {
                onUpdate({ rate: value });
              }}
              type="rate"
              itemId={item.id}
              disabled={fieldsDisabled}
              isWorkBudget={isWorkBudget}
              onClick={handleRateClick}
              isPercentage={item.unit === '%'}
              tabIndex={baseTabIndex + 4}
            />
          )}
        </td>

        <td className="text-right px-1 py-0.5 text-[11px]">
          <span className="text-[11px]">
            {item.type === 'subCategory' ? (
              formatNumber((item.subItems || []).reduce((acc, subItem) => acc + calculateLineTotalWithCurrency(subItem, settings, convertAmount, selectedCurrency), 0)) +
              ' ' + (currencies.find(c => c.code === selectedCurrency)?.symbol || selectedCurrency)
            ) : String(item.unit) === '%' && item.selectedCategories && item.selectedCategories.some(id => categories.some(cat => cat.id === id)) ? (
              (() => {
                const baseResult = computePercentageBase(item.selectedCategories || [], categories, settings, convertAmount, selectedCurrency, showCharges, true);
                return formatNumber((item.rate * baseResult.total) / 100) +
                  ' ' + (currencies.find(c => c.code === (item.currency || selectedCurrency))?.symbol || (item.currency || selectedCurrency));
              })()
            ) : (
              formatNumber((item.quantity || 0) * (item.number || 0) * (item.rate || 0)) +
              ' ' + (currencies.find(c => c.code === (item.currency || selectedCurrency))?.symbol || (item.currency || selectedCurrency))
            )}
          </span>
        </td>

        <td className="text-center px-1 py-0.5">
          {item.type !== 'subCategory' && (
            <OvertimeCell
              value={item.overtime || 0}
              hasSocialCharges={!!item.socialCharges}
              rate={displayRate}
              onChange={(updates) => onUpdate({ ...JSON.parse(JSON.stringify(updates)) })}
              disabled={disabled}
              overtimeDetails={item.overtimeDetails}
            />
          )}
        </td>

        {/* Sélecteur de devise */}
        <td className="text-center px-1 py-0.5">
          {item.type !== 'subCategory' && (
            <div className="relative flex flex-col items-center">
              <div
                onMouseEnter={() => setShowCurrencyTooltip(true)}
                onMouseLeave={() => setShowCurrencyTooltip(false)}
                className="w-full flex justify-center"
              >
                <PostCurrencySelector
                  value={item.currency || selectedCurrency}
                  onChange={currencyCode => {
                    if (currencyCode === selectedCurrency) {
                      onUpdate({ currency: undefined });
                    } else {
                      onUpdate({ currency: currencyCode as CurrencyCode });
                    }
                    setForceRecalc(prev => prev + 1);
                  }}
                  disabled={fieldsDisabled || !!item.socialCharges}
                />
                {item.socialCharges && showCurrencyTooltip && (
                  <span className="absolute z-20 top-full mt-1 left-1/2 -translate-x-1/2 bg-white border border-red-200 text-red-500 text-[10px] rounded px-2 py-1 shadow-md whitespace-pre-line max-w-[160px] text-center pointer-events-none">
                    Impossible de changer la devise d'un poste avec charges sociales
                  </span>
                )}
              </div>
            </div>
          )}
        </td>

        <td className="text-center px-1 py-0.5">
          {item.type !== 'subCategory' && (
            <div className="relative flex flex-col items-center">
              <div
                onMouseEnter={() => setShowCharges(true)}
                onMouseLeave={() => setShowCharges(false)}
                className="w-full flex justify-center"
              >
                <SocialChargesCell
                  value={item.socialCharges}
                  rates={settings.socialChargeRates}
                  onChange={(value) => onUpdate({ socialCharges: value })}
                  disabled={item.currency !== undefined && item.currency !== selectedCurrency}
                />
                {item.currency !== undefined && item.currency !== selectedCurrency && showCharges && (
                  <span className="absolute z-20 top-full mt-1 left-1/2 -translate-x-1/2 bg-white border border-red-200 text-red-500 text-[10px] rounded px-2 py-1 shadow-md whitespace-pre-line max-w-[160px] text-center pointer-events-none">
                    Les charges sociales ne sont possibles que dans la devise du budget
                  </span>
                )}
              </div>
            </div>
          )}
        </td>

        <td className="text-center px-1 py-0.5">
          {item.type !== 'subCategory' && (
            <AgencyCell
              value={item.agencyPercent}
              onChange={(value) => onUpdate({ agencyPercent: value })}
              disabled={fieldsDisabled}
              label={rate1Label}
            />
          )}
        </td>

        <td className="text-center px-1 py-0.5">
          {item.type !== 'subCategory' && (
            <MarginCell
              value={item.marginPercent}
              onChange={(value) => onUpdate({ marginPercent: value })}
              disabled={fieldsDisabled}
              label={rate2Label}
            />
          )}
        </td>

        <td className="text-center px-1 py-0.5">
          {item.type !== 'subCategory' && (
            <DistributionCell
              quoteId={quoteId}
              itemId={item.id}
              totalAmount={convertedTotal}
              hasSocialCharges={!!item.socialCharges}
              socialChargesAmount={item.socialCharges ? calculateSocialCharges(item, settings) : 0}
              onChange={(distributions, includeSocialCharges) => {
                onUpdate({ 
                  distributions,
                  includeSocialChargesInDistribution: includeSocialCharges
                });
              }}
              disabled={fieldsDisabled}
            />
          )}
        </td>

        {/* Colonnes de répartition dynamiques */}
        {showExpenseDistribution && expenseCategories.map(category => {
          // Calculer le montant distribué pour cette catégorie
          const getDistributedAmount = () => {
            const distribution = item.distributions?.find(d => d.id === category.id);
            if (!distribution) return null;
            
            let amount = 0;
            if (distribution.type === 'percentage') {
              amount = convertedTotal * (distribution.amount / 100);
            } else { // fixed
              amount = distribution.amount;
            }
            
            // Ajouter les charges sociales si nécessaire
            if (item.socialCharges && item.includeSocialChargesInDistribution) {
              const socialCharges = calculateSocialCharges(item, settings);
              if (distribution.type === 'percentage') {
                amount += socialCharges * (distribution.amount / 100);
              } else {
                // Pour les montants fixes, on ajoute proportionnellement
                const ratio = distribution.amount / convertedTotal;
                amount += socialCharges * ratio;
              }
            }
            
            return amount;
          };
          
          const distributedAmount = getDistributedAmount();
          
          return (
            <td 
              key={category.id} 
              className="text-right px-1 py-0.5 text-[11px]"
              style={{ borderLeft: `2px solid ${category.color}` }}
            >
              {distributedAmount !== null && distributedAmount > 0 && (
                <>
                  {formatNumber(distributedAmount)}
                </>
              )}
            </td>
          );
        })}
      </tr>

      {showCategorySelector && (
        <CategorySelector
          quoteId={quoteId}
          categories={categories}
          currentItemId={item.id}
          selectedCategories={item.selectedCategories}
          currentNumber={item.number || 1}
          onUpdateItem={onUpdate}
          settings={settings}
          includeSocialCharges={item.includeSocialChargesInDistribution}
          onIncludeSocialChargesChange={(include) => {
            onUpdate({ includeSocialChargesInDistribution: include });
          }}
          onSelect={(selectedIds) => {
            onUpdate({ selectedCategories: selectedIds });
            setShowCategorySelector(false);
          }}
          onClose={() => setShowCategorySelector(false)}
        />
      )}
    </>
  );
}