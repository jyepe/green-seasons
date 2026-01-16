import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAdmin } from '@/lib/supabase';

export const ADMIN_STATUS_QUERY_KEY = ['admin-status'] as const;

export function useAdmin() {
  return useQuery({
    queryKey: ADMIN_STATUS_QUERY_KEY,
    queryFn: isAdmin,
    staleTime: Infinity, // Never refetch automatically (static for session)
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // Don't retry if user is not admin
  });
}

export function useSetAdminStatus() {
  const queryClient = useQueryClient();

  return (adminStatus: boolean) => {
    queryClient.setQueryData(ADMIN_STATUS_QUERY_KEY, adminStatus);
  };
}

export function useClearAdminStatus() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.removeQueries({
      queryKey: ADMIN_STATUS_QUERY_KEY,
    });
  };
}
