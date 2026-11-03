import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Alphabet without confusing characters: 0, O, 1, I are excluded.
// Leaves 32 distinct characters (2-9, A-H, J-K-L-M-N-P-Q-R-S-T-U-V-W-X-Y-Z).
const INVITE_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateInviteCode(length = 6): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * INVITE_CODE_ALPHABET.length);
    result += INVITE_CODE_ALPHABET[randomIndex];
  }
  return result;
}

// Check if an invite code is expired (older than 7 days)
export function isInviteCodeExpired(createdAtDateString: string): boolean {
  try {
    const created = new Date(createdAtDateString).getTime();
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return now - created > sevenDaysMs;
  } catch {
    return false;
  }
}

// Retrieve configured or saved Supabase credentials
export function getSupabaseCredentials(): { url: string; anonKey: string; isConfigured: boolean } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('me_you_supabase_url') || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('me_you_supabase_key') || '' : '';

  const url = localUrl || envUrl;
  const anonKey = localKey || envKey;

  const isConfigured = Boolean(
    url &&
    anonKey &&
    !url.includes('your-project') &&
    url.startsWith('https://')
  );

  return { url, anonKey, isConfigured };
}

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseCredentials();

  if (!isConfigured) {
    return null;
  }

  if (cachedClient && lastUrl === url && lastKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    lastUrl = url;
    lastKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

// Save credentials dynamically in localStorage for testing
export function saveCustomSupabaseCredentials(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('me_you_supabase_url', url.trim());
    localStorage.setItem('me_you_supabase_key', key.trim());
    cachedClient = null; // reset client
  }
}

export function clearCustomSupabaseCredentials() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('me_you_supabase_url');
    localStorage.removeItem('me_you_supabase_key');
    cachedClient = null;
  }
}

// Rate Limiter for Safety & Anti-spam (client-side enforcement)
const postCooldownMs = 15000; // 15 seconds
const commentCooldownMs = 4000; // 4 seconds
let lastPostTime = 0;
let lastCommentTime = 0;

export function canCreatePost(): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const diff = now - lastPostTime;
  if (diff < postCooldownMs) {
    return { allowed: false, waitSeconds: Math.ceil((postCooldownMs - diff) / 1000) };
  }
  return { allowed: true };
}

export function recordPostCreated() {
  lastPostTime = Date.now();
}

export function canCreateComment(): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const diff = now - lastCommentTime;
  if (diff < commentCooldownMs) {
    return { allowed: false, waitSeconds: Math.ceil((commentCooldownMs - diff) / 1000) };
  }
  return { allowed: true };
}

export function recordCommentCreated() {
  lastCommentTime = Date.now();
}
