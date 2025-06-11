'use client';
import React from 'react';
import { ActiveThemeProvider } from '../active-theme';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/utils/trpc';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthContextProvider } from '@/context/AuthContext';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <ActiveThemeProvider initialTheme={activeThemeValue}>
          <AuthContextProvider>
          {children}
          </AuthContextProvider>
        </ActiveThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </>
  );
}
