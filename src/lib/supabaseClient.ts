import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables or fallback to localStorage config if configured in UI
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

const STORAGE_KEY = 'innobiz_supabase_config_v1';

export function getStoredSupabaseConfig(): SupabaseConfig | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse Supabase config from storage', e);
  }

  if (envUrl && envAnonKey && !envUrl.includes('your-project') && !envAnonKey.includes('your-anon-key')) {
    return {
      url: envUrl,
      anonKey: envAnonKey,
    };
  }

  return null;
}

export function saveStoredSupabaseConfig(config: SupabaseConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  cachedClient = null; // Invalidate cached instance
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const config = getStoredSupabaseConfig();
  if (config && config.url && config.anonKey) {
    try {
      cachedClient = createClient(config.url, config.anonKey);
      return cachedClient;
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }

  return null;
}

export function isSupabaseConnected(): boolean {
  return getSupabaseClient() !== null;
}
