import React from 'react';
import { RenderMainCategory, RenderSubCategoryType, RenderItem } from './RenderTable';
import { RenderSubCategory } from './RenderSubCategory';

interface RenderCategoryProps {
  category: RenderMainCategory;
  onAddItem: (subType: RenderSubCategoryType, item: RenderItem) => void;
  onUpdateItem: (subType: RenderSubCategoryType, itemId: string, updates: Partial<RenderItem>) => void;
  onDeleteItem: (subType: RenderSubCategoryType, itemId: string) => void;
}

const categoryTitles: Record<string, string> = {
  preproduction: 'Pré-production + Production',
  postproduction: 'Post-production',
  other: 'Autres'
};

export function RenderCategory({
  category,
  onAddItem,
  onUpdateItem,
  onDeleteItem
}: RenderCategoryProps) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {categoryTitles[category.type]}
        </h2>
      </div>

      <div className="divide-y divide-gray-200">
        {['intermittents', 'director', 'talents', 'freelancers', 'expenses', 'suppliers'].map((subType) => (
          <RenderSubCategory
            key={subType}
            type={subType as RenderSubCategoryType}
            items={category.subCategories.find(sc => sc.type === subType)?.items || []}
            onAddItem={(item) => onAddItem(subType as RenderSubCategoryType, item)}
            onUpdateItem={(itemId, updates) => onUpdateItem(subType as RenderSubCategoryType, itemId, updates)}
            onDeleteItem={(itemId) => onDeleteItem(subType as RenderSubCategoryType, itemId)}
          />
        ))}
      </div>
    </div>
  );
}