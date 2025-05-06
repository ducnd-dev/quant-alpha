'use client';

import React from 'react';
import { AuthProvider } from '../auth/AuthContext';
import '../i18n'; // Import i18n configuration
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

// Tạo một instance của QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Removed invalid cacheTime property
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}