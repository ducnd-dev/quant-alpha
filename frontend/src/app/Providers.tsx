'use client';

import React from 'react';
import { AuthProvider } from '../auth/AuthContext';
import '../i18n'; // Import i18n configuration

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}