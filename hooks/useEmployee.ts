import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isEmployee } from '@/lib/supabase';

export const EMPLOYEE_STATUS_QUERY_KEY = ['employee-status'] as const;

export function useEmployee() {
  return useQuery({
    queryKey: EMPLOYEE_STATUS_QUERY_KEY,
    queryFn: isEmployee,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // Don't retry if user is not employee
  });
}

export function useSetEmployeeStatus() {
  const queryClient = useQueryClient();

  return (employeeStatus: boolean) => {
    queryClient.setQueryData(EMPLOYEE_STATUS_QUERY_KEY, employeeStatus);
  };
}

export function useClearEmployeeStatus() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.removeQueries({
      queryKey: EMPLOYEE_STATUS_QUERY_KEY,
    });
  };
}
