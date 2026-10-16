import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import type { UrgencyLevel } from '../types';

interface UrgencyBadgeProps {
  urgency: UrgencyLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({
  urgency,
  size = 'md',
  showIcon = true,
}) => {
  const getStyles = () => {
    switch (urgency) {
      case 'High':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200 ring-red-500/20',
          dot: 'bg-red-500',
          icon: <AlertCircle className="w-3.5 h-3.5 text-red-600" />,
          label: 'High Urgency',
        };
      case 'Medium':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-500/20',
          dot: 'bg-amber-500',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
          label: 'Medium Urgency',
        };
      case 'Low':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
          dot: 'bg-emerald-500',
          icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />,
          label: 'Low Urgency',
        };
      case 'Unable to Determine':
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300 ring-slate-500/20',
          dot: 'bg-slate-500',
          icon: <HelpCircle className="w-3.5 h-3.5 text-slate-600" />,
          label: 'Unable to Determine',
        };
    }
  };

  const style = getStyles();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-xs ${style.bg} ${sizeClasses}`}
    >
      {showIcon && style.icon}
      <span>{style.label}</span>
    </span>
  );
};
