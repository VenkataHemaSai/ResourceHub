import { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fetch the current user session
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiClient('/api/v1/auth/me'),
    retry: false,
    staleTime: Infinity, // don't continually refetch the session, rely on mutations to update it
  });

  useEffect(() => {
    // If the query finishes and returns user data, mark as authenticated
    if (data?.user) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [data]);

  const handleSessionChange = () => {
    // CRITICAL: Clear all cached data so org A's data doesn't leak into org B's session
    queryClient.clear();
    // Re-fetch the session
    refetch();
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
      window.location.href = '/login'; // hard redirect to clear app state fully
    },
  });

  const value = {
    user: data?.user || null,
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
