import React from 'react';
import { QuoteStatus } from '../../types/project';
import { CheckCircle2, Clock, XCircle, CloudOff } from 'lucide-react';

interface QuoteStatusBadgeProps {
  status: QuoteStatus;
  isOffline?: boolean;
  className?: string;
  showAnimation?: boolean;
}

export function QuoteStatusBadge({ 
  status, 
  isOffline, 
  className = '',
  showAnimation = false
}: QuoteStatusBadgeProps) {
  if (isOffline) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <CloudOff size={12} />
        Hors ligne
      </span>
    );
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'validated':
        return {
          icon: CheckCircle2,
          text: 'Validé',
          classes: 'bg-green-100 text-green-800'
        };
      case 'rejected':
        return {
          icon: XCircle,
          text: 'Refusé',
          classes: 'bg-red-100 text-red-800'
        };
      case 'draft':
      default:
        return {
          icon: Clock,
          text: 'En attente',
          classes: 'bg-amber-100 text-amber-800'
        };
    }
  };

  const { icon: Icon, text, classes } = getStatusConfig();

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${classes} ${className} ${
      showAnimation ? 'animate-pulse' : ''
    }`}>
      <Icon size={12} />
      {text}
    </span>
  );
}