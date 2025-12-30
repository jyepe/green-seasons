import { useQuery } from '@tanstack/react-query';
import { isAdmin } from '@/lib/supabase';

export function useAdmin() {
  return useQuery({
    queryKey: ['admin-status'],
    queryFn: isAdmin,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // Don't retry if user is not admin
  });
}

