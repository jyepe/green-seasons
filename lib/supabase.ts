import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ENV } from '@/config/env';

const supabaseUrl = ENV.SUPABASE_URL;
const supabaseAnonKey = ENV.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail fast during dev to surface missing config
  // Do not throw in production builds to avoid app crash on splash
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn(
      'Supabase env not set. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in app.json under expo.extra'
    );
  }
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export type SignUpParams = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export type UserInfo = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  owned_restaurant_id?: string;
};

export async function signUpUser(params: SignUpParams) {
  const { email, password, firstName, lastName, phone } = params;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        firstName,
        lastName,
        phone,
      },
      emailRedirectTo: undefined,
    },
  });

  if (error) throw error;
  return data;
}

export type SignInParams = {
  email: string;
  password: string;
};

export async function signInUser(params: SignInParams) {
  const { email, password } = params;
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function getCurrentUserInfo(): Promise<UserInfo | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase.from('me').select('*').single();

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error fetching user info:', error);
    }
    throw error;
  }

  return data;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export type Restaurant = {
  id: string;
  name: string;
  owner_id: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postal_code: string;
  country: string;
  created_at: string;
  updated_at: string;
};

export type CreateRestaurantParams = {
  name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code: string;
  country?: string;
};

export async function createRestaurant(
  params: CreateRestaurantParams
): Promise<Restaurant> {
  const { data, error } = await supabase.rpc('create_my_restaurant', {
    p_name: params.name,
    p_address_line1: params.address_line1,
    p_address_line2: params.address_line2 || '',
    p_city: params.city,
    p_postal_code: params.postal_code,
    p_country: params.country || 'US',
  });

  if (error) throw error;
  return data;
}

export async function getRestaurantById(
  restaurantId: string
): Promise<Restaurant | null> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', restaurantId)
    .single();

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error fetching restaurant:', error);
    }
    return null;
  }

  return data;
}

export type Order = {
  id: string;
  restaurant_id: string;
  user_id: string;
  status: 'pending' | 'in_transit' | 'delivered';
  total_amount: number;
  order_date: string;
  delivery_date: string;
  created_at: string;
  updated_at: string;
};

export async function getOrdersForUser(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error fetching orders:', error);
    }
    throw error;
  }

  return data || [];
}
