import React from 'react';

export default function AdminDashboard() {
  // Mock data for the dashboard
  const stats = [
    { name: 'Total Users', value: '2,458', change: '+12%' },
    { name: 'Active Subscriptions', value: '1,432', change: '+8%' },
    { name: 'Revenue', value: '$42,389', change: '+18%' },
    { name: 'System Load', value: '28%', change: '-2%' }
  ];

  const recentActivities = [
    { user: 'John Doe', action: 'Created a new account', time: '1 hour ago' },
    { user: 'Sarah Smith', action: 'Purchased Pro plan', time: '3 hours ago' },
    { user: 'Mike Johnson', action: 'Updated profile', time: '5 hours ago' },
    { user: 'Anna Williams', action: 'Submitted a support ticket', time: '1 day ago' }
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard Overview</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">{stat.name}</p>
            <div className="flex items-end justify-between mt-2">
              <p className="text-2xl font-semibold">{stat.value}</p>
              <p className={`text-sm ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                {stat.change}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {recentActivities.map((activity, index) => (
            <div key={index} className="flex justify-between pb-2 border-b">
              <div>
                <p className="font-medium">{activity.user}</p>
                <p className="text-sm text-gray-500">{activity.action}</p>
              </div>
              <p className="text-sm text-gray-400">{activity.time}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 text-right">
          <button className="text-blue-500 hover:underline text-sm">View all activity</button>
        </div>
      </div>
      
      {/* Quick Actions Panel */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-3 bg-blue-100 rounded-lg text-blue-700 hover:bg-blue-200 transition">
            Add User
          </button>
          <button className="p-3 bg-green-100 rounded-lg text-green-700 hover:bg-green-200 transition">
            Send Newsletter
          </button>
          <button className="p-3 bg-purple-100 rounded-lg text-purple-700 hover:bg-purple-200 transition">
            View Reports
          </button>
          <button className="p-3 bg-orange-100 rounded-lg text-orange-700 hover:bg-orange-200 transition">
            System Settings
          </button>
        </div>
      </div>
    </div>
  );
}
