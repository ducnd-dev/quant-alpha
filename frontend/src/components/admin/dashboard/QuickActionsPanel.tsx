"use client";

import React from 'react';
import { QuickActionButton, ActionButtonProps } from './QuickActionButton';

interface QuickActionsPanelProps {
  actions: Omit<ActionButtonProps, 'bgColor' | 'textColor' | 'hoverColor'>[];
  isLoading?: boolean;
}

const ACTION_STYLES = [
  { bgColor: 'bg-blue-100', textColor: 'text-blue-700', hoverColor: 'bg-blue-200' },
  { bgColor: 'bg-green-100', textColor: 'text-green-700', hoverColor: 'bg-green-200' },
  { bgColor: 'bg-purple-100', textColor: 'text-purple-700', hoverColor: 'bg-purple-200' },
  { bgColor: 'bg-orange-100', textColor: 'text-orange-700', hoverColor: 'bg-orange-200' },
  { bgColor: 'bg-red-100', textColor: 'text-red-700', hoverColor: 'bg-red-200' },
  { bgColor: 'bg-indigo-100', textColor: 'text-indigo-700', hoverColor: 'bg-indigo-200' },
  { bgColor: 'bg-pink-100', textColor: 'text-pink-700', hoverColor: 'bg-pink-200' },
  { bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', hoverColor: 'bg-yellow-200' },
];

export const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  actions,
  isLoading = false
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((_, index) => (
            <div key={index} className="p-3 bg-gray-100 rounded-lg animate-pulse h-10"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action, index) => {
            const styleIndex = index % ACTION_STYLES.length;
            const styles = ACTION_STYLES[styleIndex];
            
            return (
              <QuickActionButton
                key={index}
                label={action.label}
                onClick={action.onClick}
                isLoading={action.isLoading}
                {...styles}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};