import { createClient } from '@supabase/supabase-js';
import type { Character, Headquarters } from './types';

// Access Supabase credentials from import.meta.env for Vite compatibility.
// Netlify and other modern hosting providers inject environment variables that can be accessed this way during the build process.
// The variables must be prefixed with VITE_ to be exposed to the client.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder.anon.key';

// A warning is logged to the console if placeholder values are used.
if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn(
    "Supabase credentials are not set in environment variables. Using placeholder values. " +
    "The application will not be able to connect to a database. " +
    "For deployment, please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment."
  );
}

export interface Database {
  public: {
    Tables: {
      campaigns: {
        Row: {
          id: string;
          user_id: string;
          character_data: Character;
          headquarters_data: Headquarters;
          journal_data: string;
        };
        Insert: {
          user_id: string;
          character_data: Character;
          headquarters_data: Headquarters;
          journal_data: string;
        };
        Update: {
          character_data?: Character;
          headquarters_data?: Headquarters;
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