// Environment Configuration
// Retrieves required Supabase credentials from environment variables.

export const ENV = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
};

if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in environment.'
  );
}

// Instructions:
// 1. Create a .env file in your project root
// 2. Add your Supabase credentials:
//    EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
//    EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
// 3. Get these values from your Supabase project dashboard
