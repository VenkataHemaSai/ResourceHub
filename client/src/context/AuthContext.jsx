import { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiClient('/api/v1/auth/me'),
    retry: false,
    staleTime: Infinity,
  });

  const isAuthenticated = !!data?.id;

  const handleSessionChange = () => {
    // CRITICAL: Clear all cached data so org A's data doesn't leak into org B's session
    queryClient.resetQueries();
  };

  const loginMutation = useMutation({
    mutationFn: (credentials) => apiClient('/api/v1/auth/login', { body: credentials }),
    onSuccess: () => {
      handleSessionChange();
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData) => apiClient('/api/v1/auth/register', { body: userData }),
    onSuccess: () => {
      handleSessionChange();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiClient('/api/v1/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      handleSessionChange();
      window.location.href = '/login';
    },
  });

  const value = {
    user: data || null,
    organization: data?.organization || null,
    isLoading,
    isAuthenticated,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
