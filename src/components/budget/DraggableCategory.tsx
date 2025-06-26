import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { BudgetCategory, BudgetLine, BudgetItemType } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';
import { BudgetRow } from './BudgetRow';
import { SubCategorySocialCharges } from './SubCategorySocialCharges';
import { AddPostButton } from './AddPostButton';
import { formatItemNumber } from '../../utils/formatItemNumber';
import { CurrencyCode } from '../../types/currency';
import { getBaseStructureKey } from '../../utils/budget/percentageBase';

interface DraggableCategoryProps {
  category: BudgetCategory;
  index: number;
  settings: QuoteSettings;
  onUpdateCategory: (updates: Partial<BudgetCategory>) => void;
  onUpdateItem: (itemId: string, updates: Partial<BudgetLine>) => void;
  onDeleteItem: (itemId: string) => void;
  onAddItem: (parentId: string | null, type: BudgetItemType) => void;
  quoteId: string;
  categories: BudgetCategory[];
  selectedCurrency: CurrencyCode;
}

export function DraggableCategory({
  category,
  index,
  settings,
  onUpdateCategory,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  quoteId,
  categories,
  selectedCurrency
}: DraggableCategoryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  // Format category number based on settings
  const categoryNumber = settings.numbering 
    ? formatItemNumber(
        [index + 1],
        [settings.numbering.category],
        settings.numbering.separator
      )
    : (index + 1).toString();

  const renderItems = (items: BudgetLine[], parentNumbers: string[] = []): React.ReactNode[] => {
    const result: React.ReactNode[] = [];

    items.forEach((item, itemIndex) => {
      const currentNumbers = [...parentNumbers, (itemIndex + 1).toString()];
      
      let extraKey = '';
      if (item.unit === '%' && item.selectedCategories) {
        extraKey = getBaseStructureKey(item.selectedCategories, categories);
      }
      result.push(
        <BudgetRow
          key={item.id + '-' + extraKey}
          item={item}
          parentNumbers={currentNumbers}
          settings={settings}
          categories={categories}
          onUpdate={(updates) => onUpdateItem(item.id, updates)}
          onDelete={() => onDeleteItem(item.id)}
          quoteId={quoteId}
          selectedCurrency={selectedCurrency}
        />
      );

      if (item.isExpanded) {
        if (item.subItems && item.subItems.length > 0) {
          result.push(...renderItems(item.subItems, currentNumbers));
        }

        if (item.type === 'subCategory') {
          if (settings.socialChargesDisplay === 'detailed') {
            result.push(
              <SubCategorySocialCharges
                key={`${item.id}-charges`}
                subCategory={item}
                settings={settings}
                level={parentNumbers.length}
                onUpdateItem={(updates) => onUpdateItem(item.id, updates)}
                quoteId={quoteId}
              />
            );
          }

          result.push(
            <tr key={`${item.id}-add-post`}>
              <td colSpan={13} className="px-0 py-0">
                <AddPostButton
                  onClick={() => onAddItem(item.id, 'post')}
                  level={currentNumbers.length}
                />
              </td>
            </tr>
          );
        }
      }
    });

    return result;
  };

  return (
    <>
      <tr ref={setNodeRef} style={style} className="group h-8 border-b bg-blue-800">
        <td className="w-10 relative" colSpan={1}>
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity px-1 cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={16} className="text-white/70" />
          </span>
        </td>
        <td colSpan={12} className="w-full">
          <div className="flex items-center">
            <span className="text-[11px] text-white/70 font-mono mr-2">{categoryNumber}</span>
            <input
              type="text"
              value={category.name}
              onChange={(e) => onUpdateCategory({ name: e.target.value })}
              className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-white/30 rounded px-0.5 text-xs font-bold uppercase tracking-wide text-white"
            />
          </div>
        </td>
      </tr>
      {category.isExpanded && renderItems(category.items, [categoryNumber])}
    </>
  );
}