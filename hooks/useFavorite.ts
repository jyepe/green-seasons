import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleFavorite, Item } from '@/lib/supabase';
import { ITEMS_QUERY_KEY } from './useItems';

type ToggleFavoriteParams = {
  itemId: string;
  currentlyFavorite: boolean;
};

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, currentlyFavorite }: ToggleFavoriteParams) =>
      toggleFavorite(itemId, currentlyFavorite),
    // Optimistic update
    onMutate: async ({ itemId, currentlyFavorite }: ToggleFavoriteParams) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ITEMS_QUERY_KEY });

      // Snapshot the previous value
      const previousItems = queryClient.getQueryData<Item[]>(ITEMS_QUERY_KEY);

      // Optimistically update to the new value
      if (previousItems) {
        queryClient.setQueryData<Item[]>(ITEMS_QUERY_KEY, items =>
          items?.map(item =>
            item.id === itemId
              ? { ...item, is_favorite: !currentlyFavorite }
              : item
          )
        );
      }

      // Return a context object with the snapshotted value
      return { previousItems };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err, _params, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(ITEMS_QUERY_KEY, context.previousItems);
      }
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY });
    },
  });
}
