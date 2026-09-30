import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";

function handleGlobalAuthError(error, query) {
  if (error?.status === 401) {
    const currentPath = window.location.pathname;

    // /api/v1/auth/me returning 401 is completely normal for logged-out visitors.
    // Do NOT redirect public pages to login just because the session check failed.
    const isSessionCheck = query?.queryKey?.[0] === 'auth';
    if (isSessionCheck) return;

    if (
      !currentPath.startsWith("/login") &&
      !currentPath.startsWith("/register")
    ) {
      window.location.href = `/login?redirectTo=${encodeURIComponent(currentPath)}`;
    }
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      handleGlobalAuthError(error, query);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      handleGlobalAuthError(error);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: (failureCount, error) => {
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
  },
});
