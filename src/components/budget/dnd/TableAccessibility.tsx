import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface TableAccessibilityProps {
  id: string;
  children: React.ReactNode;
}

export function TableAccessibility({ id, children }: TableAccessibilityProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <tr ref={setNodeRef} role="row" className="sr-only">
      <td colSpan={11} role="cell">
        {children}
      </td>
    </tr>
  );
}