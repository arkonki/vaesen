
import { createClient } from '@supabase/supabase-js';

// Access Supabase credentials from process.env, which is how this environment provides secrets for services like Netlify.
// We provide placeholder fallbacks to allow the app to run in a local development environment where .env files are not read.
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'placeholder.anon.key';

// A warning is logged to the console if placeholder values are used.
if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn(
    "Supabase credentials are not set in environment variables. Using placeholder values. " +
    "The application will not be able to connect to a database. " +
    "For deployment, please provide SUPABASE_URL and SUPABASE_ANON_KEY in your environment."
  );
}

export interface Database {
  public: {
    Tables: {
      campaigns: {
        Row: {
          id: string;
          user_id: string;
          character_data: any;
          headquarters_data: any;
          journal_data: string;
        };
        Insert: {
          user_id: string;
          character_data: any;
          headquarters_data: any;
          journal_data: string;
        };
        Update: {
          character_data?: any;
          headquarters_data?: any;
          journal_data?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);