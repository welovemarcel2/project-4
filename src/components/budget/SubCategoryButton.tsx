import React from 'react';
import { FolderPlus } from 'lucide-react';

interface SubCategoryButtonProps {
  onClick: () => void;
}

export function SubCategoryButton({ onClick }: SubCategoryButtonProps) {
  return (
    <tr className="h-8 hover:bg-gray-50">
      <td colSpan={10}>
        <button
          onClick={onClick}
          className="flex items-center gap-2 px-3 py-1.5 mx-auto text-sm text-blue-600 hover:text-blue-800"
        >
          <FolderPlus size={14} />
          Ajouter une sous-catégorie
        </button>
      </td>
    </tr>
  );
}