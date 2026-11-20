import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  || import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

function initializeSupabase() {
  if (!supabaseUrl || !supabaseKey) return null;

  let url;
  try {
    url = new URL(supabaseUrl);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  return createClient(url.href, supabaseKey);
}

export const supabase = initializeSupabase();
