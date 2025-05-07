"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLoading?: boolean;
  icon?: React.ReactNode;
  change?: string;
}

export const StatCard = ({ title, value, trend, isLoading = false, icon }: StatCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        {icon && <div className="h-8 w-8 text-gray-500">{icon}</div>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-16" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {trend && (
              <div className={`flex items-center text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? (
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 mr-1" />
                )}
                <span>{Math.abs(trend.value)}%</span>
                <span className="ml-1 text-gray-500">from last month</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};