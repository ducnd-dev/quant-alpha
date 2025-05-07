"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface UserActivity {
  user: string;
  action: string;
  time: string;
}

interface ActivityListProps {
  activities: UserActivity[];
  isLoading?: boolean;
  onViewAll?: () => void;
}

export const ActivityList = ({ activities, isLoading = false, onViewAll }: ActivityListProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">Recent Activity</CardTitle>
        <Button 
          variant="ghost" 
          onClick={onViewAll}
          disabled={isLoading}
        >
          View all
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          // Loading skeleton
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-4 mb-4 last:mb-0">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-[100px]" />
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700">
                  {activity.user.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{activity.user}</p>
                  <p className="text-sm text-gray-500">{activity.action}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};