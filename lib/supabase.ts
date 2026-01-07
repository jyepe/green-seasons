import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ENV } from '@/config/env';
import * as Linking from 'expo-linking';

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
      emailRedirectTo: 'https://greenseasonsdelivery.com/auth/callback',
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
    throw error;
  }

  if (!data) {
    throw new Error('User data not found');
  }

  return {
    ...data,
    email: user.email ?? data.email,
  };
}

/**
 * Get user info by ID (admin only)
 * Note: This requires an RPC function or view that includes email
 * For now, we'll get what we can from profiles
 */
export async function getUserInfoById(
  userId: string
): Promise<UserInfo | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, phone, role, owned_restaurant_id')
    .eq('id', userId)
    .single();

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error fetching user info:', error);
    }
    return null;
  }

  // Email is not in profiles table, we'll need to get it from auth
  // For now, return what we have - email will need to be handled separately
  // or via an RPC function that joins with auth.users
  return {
    ...data,
    email: '', // Email will need to be fetched separately or via RPC
  };
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export type ResetPasswordParams = {
  email: string;
};

export async function resetPassword(params: ResetPasswordParams) {
  const { email } = params;
  const redirectTo = Linking.createURL('auth/callback');
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) throw error;
}

// Dedicated helpers for updating different parts of the user
export async function updateUserPassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function updateUserEmail(email: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  if (email && email !== user.email) {
    const { error: authError } = await supabase.auth.updateUser({
      email,
    });
    if (authError) throw authError;

    // Note: If email confirmation is required, Supabase will send a confirmation email
    // The user's email won't change until they confirm via the link
  }
}

export type UpdateUserProfileParams = {
  first_name?: string;
  last_name?: string;
  phone?: string;
};

export async function updateUserProfile(params: UpdateUserProfileParams) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const updates: {
    first_name?: string;
    last_name?: string;
    phone?: string | null;
  } = {};

  if (params.first_name !== undefined) updates.first_name = params.first_name;
  if (params.last_name !== undefined) updates.last_name = params.last_name;
  if (params.phone !== undefined) {
    updates.phone = params.phone === '' ? null : params.phone;
  }

  if (Object.keys(updates).length > 0) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // If no profile fields were provided, return current profile data
  const { data, error } = await supabase
    .from('profiles')
    .select()
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
}

export type UpdateUserInfoParams = {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
};

export async function updateUserInfo(params: UpdateUserInfoParams) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  if (params.email && params.email !== user.email) {
    await updateUserEmail(params.email);
  }

  const updates: {
    first_name?: string;
    last_name?: string;
    phone?: string | null;
  } = {};
  if (params.first_name !== undefined) updates.first_name = params.first_name;
  if (params.last_name !== undefined) updates.last_name = params.last_name;
  if (params.phone !== undefined) {
    updates.phone = params.phone === '' ? null : params.phone;
  }

  if (Object.keys(updates).length > 0) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // If only email was updated, fetch and return the current profile data
  const { data, error } = await supabase
    .from('profiles')
    .select()
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
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

/**
 * Get all restaurants (admin only)
 */
export async function getAllRestaurants(): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error fetching all restaurants:', error);
    }
    throw error;
  }

  return data || [];
}

export type EmployeeProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};

export type EmployeesAndRestaurants = {
  employees: EmployeeProfile[];
  restaurants: Pick<Restaurant, 'id' | 'name'>[];
  /** Mapping of employee ID to array of restaurant names assigned to that employee */
  employeeRestaurantNames: Record<string, string[]>;
  /** Mapping of employee ID to array of restaurant IDs assigned to that employee */
  employeeRestaurantIds: Record<string, string[]>;
};

export async function getEmployeesAndRestaurants(): Promise<EmployeesAndRestaurants> {
  const [employeesRes, restaurantsRes, relationsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('role', 'employee'),
    supabase.from('restaurants').select('id, name'),
    supabase
      .from('employee_restaurant_relation')
      .select('employee_id, restaurant_id'),
  ]);

  if (employeesRes.error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error fetching employees:', employeesRes.error);
    }
    throw employeesRes.error;
  }

  if (restaurantsRes.error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error fetching restaurants:', restaurantsRes.error);
    }
    throw restaurantsRes.error;
  }

  if (relationsRes.error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error fetching relations:', relationsRes.error);
    }
    throw relationsRes.error;
  }

  // Build a map from restaurant_id to restaurant name for efficient lookup
  const restaurantNameById: Record<string, string> = {};
  for (const r of restaurantsRes.data || []) {
    restaurantNameById[r.id] = r.name;
  }

  // Build mappings from employee_id to array of restaurant names and IDs
  const employeeRestaurantNames: Record<string, string[]> = {};
  const employeeRestaurantIds: Record<string, string[]> = {};
  for (const relation of relationsRes.data || []) {
    const { employee_id, restaurant_id } = relation;
    // Build IDs mapping
    if (!employeeRestaurantIds[employee_id]) {
      employeeRestaurantIds[employee_id] = [];
    }
    employeeRestaurantIds[employee_id].push(restaurant_id);

    // Build names mapping
    const restaurantName = restaurantNameById[restaurant_id];
    if (restaurantName) {
      if (!employeeRestaurantNames[employee_id]) {
        employeeRestaurantNames[employee_id] = [];
      }
      employeeRestaurantNames[employee_id].push(restaurantName);
    }
  }

  return {
    employees: employeesRes.data || [],
    restaurants: restaurantsRes.data || [],
    employeeRestaurantNames,
    employeeRestaurantIds,
  };
}

/**
 * Assign a restaurant to an employee by creating a relation
 */
export async function assignRestaurantToEmployee(
  employeeId: string,
  restaurantId: string
): Promise<void> {
  const { error } = await supabase
    .from('employee_restaurant_relation')
    .insert({ employee_id: employeeId, restaurant_id: restaurantId });

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error assigning restaurant to employee:', error);
    }
    throw error;
  }
}

export type OrderStatus = 'pending' | 'in_transit' | 'delivered';

export type Order = {
  id: string;
  restaurant_id: string;
  user_id: string;
  status: OrderStatus;
  order_date?: string | null;
  delivery_at?: string | null;
  created_at: string;
  updated_at: string;
};

export async function getOrdersForUser(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
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

export type Item = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  image_url: string | null;
  is_favorite: boolean;
};

export async function getItems(): Promise<Item[]> {
  const { data, error } = await supabase
    .from('v_items_with_favorite')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error fetching items:', error);
    }
    throw error;
  }

  return data || [];
}

export async function getFavoriteItems(): Promise<Item[]> {
  const { data, error } = await supabase
    .from('v_items_with_favorite')
    .select('*')
    .eq('is_favorite', true)
    .order('name', { ascending: true });

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error fetching favorite items:', error);
    }
    throw error;
  }

  return data || [];
}

export async function toggleFavorite(
  itemId: string,
  currentlyFavorite: boolean
): Promise<boolean> {
  if (currentlyFavorite) {
    // Remove from favorites
    const { error } = await supabase.rpc('fn_remove_favorite_item', {
      p_item_id: itemId,
    });

    if (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Error removing favorite:', error);
      }
      throw error;
    }
    return false; // No longer a favorite
  } else {
    // Add to favorites
    const { error } = await supabase.rpc('fn_add_favorite_item', {
      p_item_id: itemId,
    });

    if (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Error adding favorite:', error);
      }
      throw error;
    }
    return true; // Now a favorite
  }
}

// ============================================================================
// Admin Item Management Functions
// ============================================================================

export type CreateItemParams = {
  name: string;
  description?: string | null;
  price: number;
  unit: string;
  image_url?: string | null;
};

export type UpdateItemParams = {
  name?: string;
  description?: string | null;
  price?: number;
  unit?: string;
  image_url?: string | null;
};

/**
 * Get all items for admin (from base items table, not view)
 */
export async function getAllItemsForAdmin(): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error fetching all items for admin:', error);
    }
    throw error;
  }

  // Map to Item type (without is_favorite since it's not in base table)
  return (data || []).map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    unit: item.unit,
    image_url: item.image_url,
    is_favorite: false, // Not available in base table
  }));
}

/**
 * Create a new item (admin only)
 */
export async function createItem(params: CreateItemParams): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .insert({
      name: params.name,
      description: params.description ?? null,
      price: params.price,
      unit: params.unit,
      image_url: params.image_url ?? null,
    })
    .select()
    .single();

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error creating item:', error);
    }
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    price: data.price,
    unit: data.unit,
    image_url: data.image_url,
    is_favorite: false, // Not available in base table
  };
}

/**
 * Update an existing item (admin only)
 */
export async function updateItem(
  itemId: string,
  params: UpdateItemParams
): Promise<Item> {
  const updates: {
    name?: string;
    description?: string | null;
    price?: number;
    unit?: string;
    image_url?: string | null;
  } = {};

  if (params.name !== undefined) updates.name = params.name;
  if (params.description !== undefined) {
    updates.description = params.description === '' ? null : params.description;
  }
  if (params.price !== undefined) updates.price = params.price;
  if (params.unit !== undefined) updates.unit = params.unit;
  if (params.image_url !== undefined) {
    updates.image_url = params.image_url === '' ? null : params.image_url;
  }

  const { data, error } = await supabase
    .from('items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error updating item:', error);
    }
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    price: data.price,
    unit: data.unit,
    image_url: data.image_url,
    is_favorite: false, // Not available in base table
  };
}

/**
 * Delete an item (admin only)
 */
export async function deleteItem(itemId: string): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', itemId);

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error deleting item:', error);
    }
    throw error;
  }
}

export type CartItem = {
  cart_id: string;
  cart_created_at: string;
  cart_updated_at: string;
  item_row_id: string;
  item_id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  line_subtotal: number;
};

export async function getCartWithItems(): Promise<CartItem[]> {
  const { data, error } = await supabase.rpc('fn_get_cart_with_items');

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error fetching cart items:', error);
    }
    throw error;
  }

  return data || [];
}

export type AddToCartParams = {
  itemId: string;
  quantityDelta?: number;
};

export async function addToCart(params: AddToCartParams): Promise<{
  id: string;
  cart_id: string;
  item_id: string;
  quantity: number;
} | null> {
  const { data, error } = await supabase.rpc('fn_add_to_cart', {
    p_item_id: params.itemId,
    p_quantity_delta: params.quantityDelta ?? 1,
  });

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error adding to cart:', error);
    }
    throw error;
  }

  return data;
}

export async function clearCart(): Promise<void> {
  const { error } = await supabase.rpc('fn_clear_cart');

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error clearing cart:', error);
    }
    throw error;
  }
}

export type CreateOrderFromCartResult = {
  id: string;
  status: 'pending' | 'in_transit' | 'delivered';
  restaurant_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  total_amount: number;
};

export async function createOrderFromCart(
  restaurantId: string,
  deliveryAt: Date
): Promise<CreateOrderFromCartResult> {
  const { data, error } = await supabase.rpc('fn_create_order_from_cart', {
    p_restaurant_id: restaurantId,
    p_delivery_at: deliveryAt.toISOString(),
  });

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error creating order from cart:', error);
    }
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('Order creation returned no data');
  }

  return data[0];
}

export type OrderDetailItem = {
  order_id: string;
  order_status: string;
  placed_at: string;
  delivery_at: string | null;
  restaurant_id: string;
  restaurant_name: string;
  customer_id: string;
  subtotal: number;
  total: number;
  item_id: string;
  item_name: string;
  item_image_url: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export async function getOrderDetails(
  orderId: string
): Promise<OrderDetailItem[]> {
  const { data, error } = await supabase.rpc('fn_get_order_details', {
    p_order_id: orderId,
  });

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error fetching order details:', error);
    }
    throw error;
  }

  return data || [];
}

/**
 * Update the status of an order
 */
export async function updateOrderStatus(
  orderId: string,
  status: 'pending' | 'in_transit' | 'delivered'
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error updating order status:', error);
    }
    throw error;
  }
}

// ============================================================================
// Admin Dashboard Functions
// ============================================================================

/**
 * Check if the current user is an admin
 * @throws Error if unable to determine admin status due to network or backend issues
 */
export async function isAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('fn_is_admin');

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error checking admin status:', error);
    }
    // Throw error instead of silently returning false
    // This allows callers to distinguish between "not an admin" and "unable to check"
    throw new Error(`Unable to verify admin status: ${error.message}`);
  }

  return data === true;
}

export type AdminMonthKPIs = {
  orders_count: number;
  total_revenue: number;
};

/**
 * Get monthly KPIs (orders count + total revenue)
 */
export async function getAdminMonthKPIs(
  monthStart: Date,
  monthEnd: Date
): Promise<AdminMonthKPIs> {
  const { data, error } = await supabase.rpc('fn_admin_dashboard_month_kpis', {
    p_month_start: monthStart.toISOString(),
    p_month_end: monthEnd.toISOString(),
  });

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error fetching admin month KPIs:', error);
    }
    throw error;
  }

  // RPC returns an array with one row
  const result = Array.isArray(data) ? data[0] : data;
  return {
    orders_count: result?.orders_count ?? 0,
    total_revenue: parseFloat(result?.total_revenue ?? '0'),
  };
}

export type AdminTopItem = {
  item_id: string;
  item_name: string;
  unit: string;
  quantity: number;
  revenue: number;
};

/**
 * Get top selling items for the given period
 */
export async function getAdminTopItems(
  monthStart: Date,
  monthEnd: Date,
  limit: number = 5
): Promise<AdminTopItem[]> {
  const { data, error } = await supabase.rpc('fn_admin_dashboard_top_items', {
    p_month_start: monthStart.toISOString(),
    p_month_end: monthEnd.toISOString(),
    p_limit: limit,
  });

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error fetching admin top items:', error);
    }
    throw error;
  }

  return (data || []).map((item: unknown) => {
    if (!item || typeof item !== 'object') {
      return {
        item_id: '',
        item_name: '',
        unit: '',
        quantity: 0,
        revenue: 0,
      };
    }

    const record = item as Record<string, unknown>;

    return {
      item_id: String(record.item_id ?? ''),
      item_name: String(record.item_name ?? ''),
      unit: String(record.unit ?? ''),
      quantity: parseFloat(String(record.quantity ?? '0')),
      revenue: parseFloat(String(record.revenue ?? '0')),
    };
  });
}

export type AdminOrder = {
  order_id: string;
  status: OrderStatus;
  created_at: string;
  delivery_at: string | null;
  restaurant_id: string;
  restaurant_name: string;
  created_by: string;
  buyer_first_name: string | null;
  buyer_last_name: string | null;
  total_amount: number;
  items_count: number;
};

export type AdminOrdersResult = {
  orders: AdminOrder[];
  nextCursor: { created_at: string; id: string } | null;
};

/**
 * Get paginated list of all orders for admin using cursor-based pagination
 */
export async function getAdminOrders(
  from: Date,
  to: Date,
  limit: number = 50,
  cursor: { created_at: string; id: string } | null = null,
  restaurantId: string | null = null,
  status: OrderStatus | null = null
): Promise<AdminOrdersResult> {
  const { data, error } = await supabase.rpc('fn_admin_list_orders', {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
    p_limit: limit,
    p_cursor_created_at: cursor?.created_at ?? null,
    p_cursor_id: cursor?.id ?? null,
    p_restaurant_id: restaurantId ?? null,
    p_status: status ?? null,
  });

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error fetching admin orders:', error);
    }
    throw error;
  }

  const orders = (data || []).map((order: Record<string, unknown>) => ({
    order_id: order.order_id as string,
    status: order.status as OrderStatus,
    created_at: order.created_at as string,
    delivery_at: order.delivery_at as string | null,
    restaurant_id: order.restaurant_id as string,
    restaurant_name: order.restaurant_name as string,
    created_by: order.created_by as string,
    buyer_first_name: order.buyer_first_name as string | null,
    buyer_last_name: order.buyer_last_name as string | null,
    total_amount: parseFloat(String(order.total_amount ?? '0')),
    items_count: parseInt(String(order.items_count ?? '0'), 10),
  }));

  // Extract cursor from last order for next page
  const nextCursor =
    orders.length > 0 && orders.length === limit
      ? {
          created_at: orders[orders.length - 1].created_at,
          id: orders[orders.length - 1].order_id,
        }
      : null;

  return {
    orders,
    nextCursor,
  };
}

export type AdminChartOrdersByDay = {
  day: string;
  orders_count: number;
};

/**
 * Get orders count by day for charts
 */
export async function getAdminChartOrdersByDay(
  from: Date,
  to: Date
): Promise<AdminChartOrdersByDay[]> {
  const { data, error } = await supabase.rpc('fn_admin_chart_orders_by_day', {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error fetching orders by day chart:', error);
    }
    throw error;
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    day: row.day as string,
    orders_count: parseInt(String(row.orders_count ?? '0'), 10),
  }));
}

export type AdminChartRevenueByDay = {
  day: string;
  revenue: number;
};

/**
 * Get revenue by day for charts
 */
export async function getAdminChartRevenueByDay(
  from: Date,
  to: Date
): Promise<AdminChartRevenueByDay[]> {
  const { data, error } = await supabase.rpc('fn_admin_chart_revenue_by_day', {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error fetching revenue by day chart:', error);
    }
    throw error;
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    day: row.day as string,
    revenue: parseFloat(String(row.revenue ?? '0')),
  }));
}

export type AdminChartRevenueByRestaurant = {
  restaurant_id: string;
  restaurant_name: string;
  orders_count: number;
  revenue: number;
};

// ============================================================================
// Employee Functions
// ============================================================================

/**
 * Check if the current user has the employee role
 */
export async function isEmployee(): Promise<boolean> {
  const userInfo = await getCurrentUserInfo();
  return userInfo?.role === 'employee';
}

export type EmployeeOrder = {
  id: string;
  created_at: string;
  delivery_at: string | null;
  status: string;
  restaurant_id: string;
  restaurant_name: string;
  total: number;
};

export type EmployeeOrdersResult = {
  orders: EmployeeOrder[];
  nextCursor: { created_at: string; id: string } | null;
};

export type EmployeeTruckLoadRestaurant = {
  restaurant_id: string;
  restaurant_name: string;
  quantity: number;
};

export type EmployeeTruckLoadItem = {
  item_id: string;
  item_name: string;
  item_image_url: string | null;
  total_quantity: number;
  restaurants: EmployeeTruckLoadRestaurant[];
};

/**
 * Get paginated list of orders for employees using cursor-based pagination
 */
export async function getEmployeeOrders(
  limit: number = 25,
  cursor: { created_at: string; id: string } | null = null
): Promise<EmployeeOrdersResult> {
  const { data, error } = await supabase.rpc('fn_employee_list_orders', {
    p_limit: limit,
    p_cursor_created_at: cursor?.created_at ?? null,
    p_cursor_id: cursor?.id ?? null,
  });

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error fetching employee orders:', error);
    }
    throw error;
  }

  const orders = (data || []).map((order: Record<string, unknown>) => ({
    id: order.id as string,
    created_at: order.created_at as string,
    delivery_at: (order.delivery_at as string | null) ?? null,
    status: order.status as string,
    restaurant_id: order.restaurant_id as string,
    restaurant_name: (order.restaurant_name as string) ?? 'Unknown',
    total: parseFloat(String(order.total_amount ?? '0')),
  }));

  // Extract cursor from last order for next page
  const nextCursor =
    orders.length > 0 && orders.length === limit
      ? {
          created_at: orders[orders.length - 1].created_at,
          id: orders[orders.length - 1].id,
        }
      : null;

  return {
    orders,
    nextCursor,
  };
}

/**
 * Get today's truck load summary for the employee
 */
export async function getEmployeeTruckLoadSummary(
  deliveryDate?: Date,
  tz: string = 'America/New_York'
): Promise<EmployeeTruckLoadItem[]> {
  const params: { p_delivery_date?: string; p_tz?: string } = {};

  if (deliveryDate) {
    params.p_delivery_date = deliveryDate.toISOString().slice(0, 10);
  }

  params.p_tz = tz;

  const { data, error } = await supabase.rpc(
    'fn_employee_truck_load_summary',
    params
  );

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error fetching employee truck load summary:', error);
    }
    throw error;
  }

  return (data || []).map((row: Record<string, unknown>) => {
    // Parse restaurants JSONB array
    // Supabase may return JSONB as a string or already parsed object
    let restaurantsData:
      | {
          restaurant_id: string;
          restaurant_name: string;
          quantity: number;
        }[]
      | null
      | undefined;

    const rawRestaurants = row.restaurants;

    if (rawRestaurants === null || rawRestaurants === undefined) {
      restaurantsData = null;
    } else if (typeof rawRestaurants === 'string') {
      // If it's a string, try to parse it
      try {
        restaurantsData = JSON.parse(rawRestaurants) as {
          restaurant_id: string;
          restaurant_name: string;
          quantity: number;
        }[];
      } catch (e) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.error('Error parsing restaurants JSON:', e);
        }
        restaurantsData = null;
      }
    } else if (Array.isArray(rawRestaurants)) {
      // Already an array
      restaurantsData = rawRestaurants as {
        restaurant_id: string;
        restaurant_name: string;
        quantity: number;
      }[];
    } else {
      restaurantsData = null;
    }

    const restaurants: EmployeeTruckLoadRestaurant[] = Array.isArray(
      restaurantsData
    )
      ? restaurantsData.map(r => ({
          restaurant_id: String(r.restaurant_id ?? ''),
          restaurant_name: String(r.restaurant_name ?? ''),
          quantity: parseInt(String(r.quantity ?? '0'), 10),
        }))
      : [];

    return {
      item_id: row.item_id as string,
      item_name: row.item_name as string,
      item_image_url: (row.item_image_url as string | null) ?? null,
      total_quantity: parseInt(String(row.total_quantity ?? '0'), 10),
      restaurants,
    };
  });
}

/**
 * Get revenue by restaurant for charts
 */
export async function getAdminChartRevenueByRestaurant(
  from: Date,
  to: Date,
  limit: number = 10
): Promise<AdminChartRevenueByRestaurant[]> {
  const { data, error } = await supabase.rpc(
    'fn_admin_chart_revenue_by_restaurant',
    {
      p_from: from.toISOString(),
      p_to: to.toISOString(),
      p_limit: limit,
    }
  );

  if (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('Error fetching revenue by restaurant chart:', error);
    }
    throw error;
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    restaurant_id: row.restaurant_id as string,
    restaurant_name: row.restaurant_name as string,
    orders_count: parseInt(String(row.orders_count ?? '0'), 10),
    revenue: parseFloat(String(row.revenue ?? '0')),
  }));
}
