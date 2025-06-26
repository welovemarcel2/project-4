import React from 'react';

interface ItemNumberProps {
  number: string;
}

export function ItemNumber({ number }: ItemNumberProps) {
  return (
    <span className="inline-flex min-w-[2.5rem] text-xs text-gray-400 font-mono select-none mr-2">
      {number}
    </span>
  );
}