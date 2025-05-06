import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Tạo một instance của QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Tắt tính năng tự động refetch khi focus vào cửa sổ
      retry: 1, // Số lần thử lại khi request thất bại
      staleTime: 5 * 60 * 1000, // Dữ liệu được coi là "stale" sau 5 phút
      // cacheTime: 10 * 60 * 1000, // Dữ liệu được cache trong 10 phút
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}