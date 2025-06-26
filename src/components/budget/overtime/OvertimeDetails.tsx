import React from 'react';
import { formatNumber } from '../../../utils/formatNumber';
import { formatOvertimeDetails } from '../../../utils/overtime/calculations';

interface OvertimeDetails {
  normalHours: number;
  normalRate: number;
  x1_5Hours: number;
  x1_5Rate: number;
  x2Hours: number;
  x2Rate: number;
}

interface OvertimeDetailsProps {
  details: OvertimeDetails | null;
}

export function OvertimeDetails({ details }: OvertimeDetailsProps) {
  if (!details) return null;

  // Convert details object to string format for the formatter
  const detailsString = JSON.stringify(details);
  const formattedDetails = formatOvertimeDetails(detailsString);

  return (
    <tr className="border-t border-gray-100">
      <td></td>
      <td colSpan={10} className="pl-8 py-0.5">
        <div className="text-[10px] text-gray-500 italic">
          {formattedDetails}
        </div>
      </td>
    </tr>
  );
}