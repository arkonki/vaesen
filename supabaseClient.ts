
import { createClient } from '@supabase/supabase-js';
import { Character, Headquarters } from './types';

// Access Supabase credentials from process.env, which is how this environment provides secrets for services like Netlify.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Throw an error if the environment variables are not set.
// This ensures the application fails fast during development or deployment
// if secrets are not configured properly in the environment (e.g., Netlify build settings).
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase credentials are not set. Please provide SUPABASE_URL and SUPABASE_ANON_KEY as environment variables in your Netlify configuration.");
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