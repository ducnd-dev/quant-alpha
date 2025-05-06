import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Alpha Quant - Admin Dashboard',
  description: 'Admin dashboard for managing Alpha Quant platform',
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-4">
        <div className="text-xl font-bold mb-8">Alpha Quant Admin</div>
        <nav className="space-y-2">
          <a href="/admin" className="block py-2 px-4 rounded hover:bg-gray-800">Dashboard</a>
          <a href="/admin/users" className="block py-2 px-4 rounded hover:bg-gray-800">Users</a>
          <a href="/admin/settings" className="block py-2 px-4 rounded hover:bg-gray-800">Settings</a>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            <div>
              <button className="bg-gray-100 px-4 py-2 rounded shadow">Log out</button>
            </div>
          </div>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
