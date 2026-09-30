import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";

function handleGlobalAuthError(error) {
  // If it's a 401 and NOT from an auth endpoint, kick them to login
  if (error?.status === 401) {
    const currentPath = window.location.pathname;
    if (
      !currentPath.startsWith("/login") &&
      !currentPath.startsWith("/register")
    ) {
      // Hard redirect, blowing away state, preserving intent
      window.location.href = `/login?redirectTo=${encodeURIComponent(currentPath)}`;
    }
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      handleGlobalAuthError(error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      handleGlobalAuthError(error);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Never retry 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry network failures or 5xx up to 3 times
        return failureCount < 3;
      },
      refetchOnWindowFocus: false, // Prevents refetch storms when switching tabs
    },
  },
});
