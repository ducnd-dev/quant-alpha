"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ActionButtonProps {
  label: string;
  bgColor: string;
  textColor: string;
  hoverColor: string;
  isLoading?: boolean;
  onClick?: () => void;
}

export const QuickActionButton: React.FC<ActionButtonProps> = ({
  label,
  bgColor,
  textColor,
  hoverColor,
  isLoading = false,
  onClick
}) => {
  const baseClasses = cn(
    "p-3 rounded-lg transition w-full text-left",
    bgColor, 
    textColor,
    `hover:${hoverColor}`
  );

  return (
    <Button
      className={baseClasses}
      variant="ghost"
      onClick={onClick}
      isLoading={isLoading}
    >
      {label}
    </Button>
  );
};