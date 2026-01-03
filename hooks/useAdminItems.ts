import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createItem,
  updateItem,
  deleteItem,
  getAllItemsForAdmin,
  type CreateItemParams,
  type UpdateItemParams,
} from '@/lib/supabase';
import { ITEMS_QUERY_KEY } from './useItems';

export const ADMIN_ITEMS_QUERY_KEY = ['admin-items'] as const;

export function useAdminItems() {
  return useQuery({
    queryKey: ADMIN_ITEMS_QUERY_KEY,
    queryFn: getAllItemsForAdmin,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateItemParams) => createItem(params),
    onSuccess: () => {
      // Invalidate both admin items and regular items queries
      queryClient.invalidateQueries({
        queryKey: ADMIN_ITEMS_QUERY_KEY,
      });
      queryClient.invalidateQueries({
        queryKey: ITEMS_QUERY_KEY,
      });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      params,
    }: {
      itemId: string;
      params: UpdateItemParams;
    }) => updateItem(itemId, params),
    onSuccess: () => {
      // Invalidate both admin items and regular items queries
      queryClient.invalidateQueries({
        queryKey: ADMIN_ITEMS_QUERY_KEY,
      });
      queryClient.invalidateQueries({
        queryKey: ITEMS_QUERY_KEY,
      });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => deleteItem(itemId),
    onSuccess: () => {
      // Invalidate both admin items and regular items queries
      queryClient.invalidateQueries({
        queryKey: ADMIN_ITEMS_QUERY_KEY,
      });
      queryClient.invalidateQueries({
        queryKey: ITEMS_QUERY_KEY,
      });
    },
  });
}
