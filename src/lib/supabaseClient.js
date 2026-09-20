import { createClient } from '@supabase/supabase-js';

// Centralized Supabase credentials from environment (.env) with robust fallback
const FALLBACK_URL = 'https://esbvwqjdabcmbqubfffi.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzYnZ3cWpkYWJjbWJxdWJmZmZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4OTYxODksImV4cCI6MjEwNTQ3MjE4OX0.9VCCQ3QIYYfgLjyeI_LcV-Te_D-89_lPpCfEq8YTtHY';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL).trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY).trim();

// Singleton Supabase Client
export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
    })
  : null;

/**
 * Returns true if the user has provided valid Supabase credentials in .env
 */
export const isSupabaseConfigured = () => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && supabase);
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. SUPABASE AUTHENTICATION (OTP & PASSWORD)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send a 6-digit One-Time Password (OTP) / Magic Link to the user's email
 */
export const sendEmailOtp = async (email) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured yet. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.');
  }

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) throw error;
  return data;
};

/**
 * Verify the 6-digit OTP code sent to the email
 */
export const verifyEmailOtp = async (email, token) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured yet. Please configure frontend/.env.');
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  if (error) throw error;
  return data;
};

/**
 * Sign in using traditional Email & Password via Supabase Auth
 */
export const signInWithPassword = async (email, password) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured yet. Please configure frontend/.env.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

/**
 * Sign up a new user via Supabase Auth
 */
export const signUpWithEmail = async (email, password, metadata = {}) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured yet. Please configure frontend/.env.');
  }

  const redirectUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/login`
    : 'http://localhost:5175/login';

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: metadata,
    },
  });

  if (error) throw error;
  return data;
};

/**
 * Sign out from Supabase
 */
export const signOutSupabase = async () => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. SUPABASE REALTIME SUBSCRIPTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Subscribe to real-time changes on any Supabase table (e.g. 'applications', 'jobs')
 *
 * @param {string} tableName - e.g. 'applications'
 * @param {Object} handlers - { onInsert, onUpdate, onDelete }
 * @returns {Function} unsubscribe cleanup function
 */
export const subscribeToRealtimeTable = (tableName, { onInsert, onUpdate, onDelete } = {}) => {
  if (!isSupabaseConfigured()) {
    return () => {}; // No-op cleanup
  }

  const channelName = `realtime-${tableName}-${Date.now()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: tableName },
      (payload) => onInsert && onInsert(payload.new)
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: tableName },
      (payload) => onUpdate && onUpdate(payload.new)
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: tableName },
      (payload) => onDelete && onDelete(payload.old)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export default supabase;
