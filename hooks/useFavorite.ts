import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toggleFavorite, getFavoriteItems, Item } from '@/lib/supabase';
import { ITEMS_QUERY_KEY } from './useItems';

export const FAVORITE_ITEMS_QUERY_KEY = ['favoriteItems'] as const;

type ToggleFavoriteParams = {
  itemId: string;
  currentlyFavorite: boolean;
};

export function useFavoriteItems() {
  return useQuery({
    queryKey: FAVORITE_ITEMS_QUERY_KEY,
    queryFn: getFavoriteItems,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, currentlyFavorite }: ToggleFavoriteParams) =>
      toggleFavorite(itemId, currentlyFavorite),
    // Optimistic update
    onMutate: async ({ itemId, currentlyFavorite }: ToggleFavoriteParams) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ITEMS_QUERY_KEY });
      await queryClient.cancelQueries({ queryKey: FAVORITE_ITEMS_QUERY_KEY });

      // Snapshot the previous values
      const previousItems = queryClient.getQueryData<Item[]>(ITEMS_QUERY_KEY);
      const previousFavorites = queryClient.getQueryData<Item[]>(
        FAVORITE_ITEMS_QUERY_KEY
      );

      // Optimistically update items list
      if (previousItems) {
        queryClient.setQueryData<Item[]>(ITEMS_QUERY_KEY, items =>
          items?.map(item =>
            item.id === itemId
              ? { ...item, is_favorite: !currentlyFavorite }
              : item
          )
        );
      }

      // Optimistically update favorites list
      if (previousFavorites) {
        if (currentlyFavorite) {
          // Remove from favorites
          queryClient.setQueryData<Item[]>(FAVORITE_ITEMS_QUERY_KEY, items =>
            items?.filter(item => item.id !== itemId)
          );
        } else {
          // Add to favorites - we need to get the item from items list
          const itemToAdd = previousItems?.find(item => item.id === itemId);
          if (itemToAdd) {
            queryClient.setQueryData<Item[]>(FAVORITE_ITEMS_QUERY_KEY, items =>
              [...(items || []), { ...itemToAdd, is_favorite: true }].sort(
                (a, b) => a.name.localeCompare(b.name)
              )
            );
          }
        }
      }

      // Return a context object with the snapshotted values
      return { previousItems, previousFavorites };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err, _params, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(ITEMS_QUERY_KEY, context.previousItems);
      }
      if (context?.previousFavorites) {
        queryClient.setQueryData(
          FAVORITE_ITEMS_QUERY_KEY,
          context.previousFavorites
        );
      }
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: FAVORITE_ITEMS_QUERY_KEY });
    },
  });
}
