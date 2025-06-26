import React from 'react';
import { QuickInputCell } from '../QuickInputCell';

interface MarginCellProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  label?: string;
}

export function MarginCell({ value, onChange, disabled = false, label = 'TX 2' }: MarginCellProps) {
  return (
    <QuickInputCell
      value={value}
      onChange={onChange}
      type="percentage"
      min={0}
      max={100}
      step={0.1}
      disabled={disabled}
      title={`${label} (%)`}
    />
  );
}