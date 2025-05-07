"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatCard, ActivityList, QuickActionsPanel } from '@/components/admin/dashboard';
import adminService, { DashboardStats, UserActivity } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Mock data để hiện thị khi API chưa sẵn sàng hoặc gặp lỗi
  const mockStats = {
    totalUsers: { value: '2,458', change: '+12%' },
    activeSubscriptions: { value: '1,432', change: '+8%' },
    revenue: { value: '$42,389', change: '+18%' },
    systemLoad: { value: '28%', change: '-2%' }
  };

  const mockActivities = [
    { user: 'John Doe', action: 'Created a new account', time: '1 hour ago' },
    { user: 'Sarah Smith', action: 'Purchased Pro plan', time: '3 hours ago' },
    { user: 'Mike Johnson', action: 'Updated profile', time: '5 hours ago' },
    { user: 'Anna Williams', action: 'Submitted a support ticket', time: '1 day ago' }
  ];

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // Parallel data fetching 
        const [statsData, activitiesData] = await Promise.all([
          adminService.getDashboardStats().catch(() => mockStats),
          adminService.getRecentActivities().catch(() => mockActivities)
        ]);
        
        setStats(statsData);
        setActivities(activitiesData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data. Showing mock data instead.',
          variant: 'destructive'
        });
        
        // Fallback to mock data
        setStats(mockStats);
        setActivities(mockActivities);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  // Quick action handlers
  const handleAction = async (action: string) => {
    setActionLoading(action);
    
    try {
      // Add actual implementation for these actions later
      switch (action) {
        case 'Add User':
          router.push('/admin/users/new');
          break;
        case 'Send Newsletter':
          toast({ title: 'Success', description: 'Newsletter has been scheduled' });
          break;
        case 'View Reports':
          router.push('/admin/reports');
          break;
        case 'System Settings':
          router.push('/admin/settings');
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Error executing action ${action}:`, error);
      toast({
        title: 'Error',
        description: `Failed to execute ${action}`,
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Quick actions configuration
  const quickActions = [
    { 
      label: 'Add User', 
      onClick: () => handleAction('Add User'),
      isLoading: actionLoading === 'Add User'
    },
    { 
      label: 'Send Newsletter', 
      onClick: () => handleAction('Send Newsletter'),
      isLoading: actionLoading === 'Send Newsletter'
    },
    { 
      label: 'View Reports', 
      onClick: () => handleAction('View Reports'),
      isLoading: actionLoading === 'View Reports'
    },
    { 
      label: 'System Settings', 
      onClick: () => handleAction('System Settings'),
      isLoading: actionLoading === 'System Settings'
    }
  ];

  // Handle view all activities
  const handleViewAllActivities = () => {
    router.push('/admin/activities');
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard Overview</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats && (
          <>
            <StatCard 
              title="Total Users" 
              value={stats.totalUsers.value} 
              change={stats.totalUsers.change} 
              isLoading={isLoading}
            />
            <StatCard 
              title="Active Subscriptions" 
              value={stats.activeSubscriptions.value} 
              change={stats.activeSubscriptions.change} 
              isLoading={isLoading}
            />
            <StatCard 
              title="Revenue" 
              value={stats.revenue.value} 
              change={stats.revenue.change} 
              isLoading={isLoading}
            />
            <StatCard 
              title="System Load" 
              value={stats.systemLoad.value} 
              change={stats.systemLoad.change} 
              isLoading={isLoading}
            />
          </>
        )}
      </div>
      
      {/* Recent Activity */}
      <ActivityList 
        activities={activities} 
        isLoading={isLoading}
        onViewAll={handleViewAllActivities}
      />
      
      {/* Quick Actions Panel */}
      <QuickActionsPanel 
        actions={quickActions}
        isLoading={isLoading}
      />
    </div>
  );
}
