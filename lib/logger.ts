import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

export type ErrorContext = {
  screen?: string;
  action?: string;
  userRole?: string;
  isFatal?: boolean;
  source?: 'global' | 'ErrorBoundary' | 'query' | 'mutation';
  [key: string]: unknown;
};

export async function logError(
  error: unknown,
  context?: ErrorContext
): Promise<void> {
  if (__DEV__) {
    console.error('[logError]', error, context);
    return;
  }

  try {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? (error.stack ?? null) : null;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from('client_errors').insert({
      user_id: user?.id ?? null,
      user_role: context?.userRole ?? null,
      error_message: message,
      error_stack: stack,
      context: context ?? null,
      platform: Platform.OS,
      app_version: Constants.expoConfig?.version ?? null,
    });
  } catch {
    // intentionally silent — logger must never throw
  }
}
