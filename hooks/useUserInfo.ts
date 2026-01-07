import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  getCurrentUserInfo,
  signOutUser,
  updateUserEmail,
  updateUserProfile,
  type UserInfo,
  type UpdateUserInfoParams,
  type UpdateUserProfileParams,
} from '@/lib/supabase';

export const USER_INFO_QUERY_KEY = ['userInfo'] as const;

export function useUserInfo() {
  return useQuery({
    queryKey: USER_INFO_QUERY_KEY,
    queryFn: getCurrentUserInfo,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry if user is not authenticated
      if (
        error &&
        'message' in error &&
        typeof error.message === 'string' &&
        error.message.includes('not authenticated')
      ) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useUpdateUserInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateUserInfoParams) => {
      const { email, ...profile } = params;

      if (email !== undefined) {
        await updateUserEmail(email);
      }

      const hasProfileUpdates =
        (profile as UpdateUserProfileParams).first_name !== undefined ||
        (profile as UpdateUserProfileParams).last_name !== undefined ||
        (profile as UpdateUserProfileParams).phone !== undefined;

      if (hasProfileUpdates) {
        return updateUserProfile(profile as UpdateUserProfileParams);
      }

      // If only email was updated, return current user info
      return getCurrentUserInfo();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_INFO_QUERY_KEY });
    },
  });
}

export function useInvalidateUserInfo() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({
      queryKey: USER_INFO_QUERY_KEY,
    });
  };
}

export function useSetUserInfo() {
  const queryClient = useQueryClient();

  return (userInfo: UserInfo | null) => {
    queryClient.setQueryData(USER_INFO_QUERY_KEY, userInfo);
  };
}

export function useClearUserInfo() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.removeQueries({
      queryKey: USER_INFO_QUERY_KEY,
    });
  };
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return async () => {
    try {
      await signOutUser();
      // Clear user info cache after successful logout
      queryClient.removeQueries({
        queryKey: USER_INFO_QUERY_KEY,
      });
      // Clear admin status cache
      queryClient.removeQueries({
        queryKey: ['admin-status'],
      });
    } catch (error) {
      // Even if logout fails, clear the cache
      queryClient.removeQueries({
        queryKey: USER_INFO_QUERY_KEY,
      });
      // Clear admin status cache
      queryClient.removeQueries({
        queryKey: ['admin-status'],
      });
      throw error;
    }
  };
}
