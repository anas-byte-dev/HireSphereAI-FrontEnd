import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

const TOKEN_KEY = 'hiresphere_token';
const USER_KEY = 'hiresphere_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || '');
  const [loading, setLoading] = useState(true);

  // Initialize Auth state from Supabase session or localStorage
  useEffect(() => {
    let subscription = null;

    const initAuth = async () => {
      try {
        if (isSupabaseConfigured()) {
          // 1. Check active Supabase session
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await syncUserFromSupabase(session.user, session.access_token);
          } else {
            // Check if user info is cached in localStorage
            const cachedUser = localStorage.getItem(USER_KEY);
            const savedToken = localStorage.getItem(TOKEN_KEY);
            if (cachedUser && savedToken) {
              setUser(JSON.parse(cachedUser));
              setToken(savedToken);
            }
          }

          // 2. Listen to Supabase auth state changes (e.g. after clicking email link)
          const { data: listener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            console.log('Supabase Auth Event:', event);
            if (event === 'SIGNED_IN' && newSession?.user) {
              await syncUserFromSupabase(newSession.user, newSession.access_token);
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setToken('');
              localStorage.removeItem(TOKEN_KEY);
              localStorage.removeItem(USER_KEY);
            }
          });
          subscription = listener.subscription;
        } else {
          // Fallback if Supabase not configured
          const cachedUser = localStorage.getItem(USER_KEY);
          const savedToken = localStorage.getItem(TOKEN_KEY);
          if (cachedUser && savedToken) {
            setUser(JSON.parse(cachedUser));
            setToken(savedToken);
          }
        }
      } catch (err) {
        console.warn('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // Helper to fetch/create profile in public.users and sync state
  const syncUserFromSupabase = async (authUser, accessToken) => {
    try {
      // Look up user in public.users by auth_id, id, or email
      let { data: profile } = await supabase
        .from('users')
        .select('*')
        .or(`auth_id.eq.${authUser.id},id.eq.${authUser.id},email.eq.${authUser.email}`)
        .maybeSingle();

      const userRole = profile?.role || authUser.user_metadata?.role || 'CANDIDATE';
      const userName = profile?.name || authUser.user_metadata?.name || authUser.email.split('@')[0];

      // If user row doesn't exist yet, insert it into public.users
      if (!profile) {
        const { data: newProfile } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            auth_id: authUser.id,
            name: userName,
            email: authUser.email,
            role: userRole,
            active: true,
          })
          .select()
          .maybeSingle();
        profile = newProfile;

        // Also ensure profile exists in candidate_profiles / recruiter_profiles
        if (userRole === 'CANDIDATE') {
          await supabase.from('candidate_profiles').upsert({
            user_id: authUser.id,
            headline: 'Software Professional',
            skills: ['Java', 'Spring Boot', 'React'],
          });
        } else if (userRole === 'RECRUITER') {
          await supabase.from('recruiter_profiles').upsert({
            user_id: authUser.id,
            company_name: 'TechCorp Solutions',
          });
        }
      }

      const syncedUser = {
        id: profile?.id || authUser.id,
        authId: authUser.id,
        name: profile?.name || userName,
        email: authUser.email,
        role: profile?.role || userRole,
        active: profile?.active !== undefined ? profile.active : true,
      };

      setUser(syncedUser);
      setToken(accessToken);
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(syncedUser));
      return syncedUser;
    } catch (err) {
      console.error('Error syncing user from Supabase:', err);
      const fallbackUser = {
        id: authUser.id,
        authId: authUser.id,
        name: authUser.user_metadata?.name || authUser.email.split('@')[0],
        email: authUser.email,
        role: authUser.user_metadata?.role || 'CANDIDATE',
        active: true,
      };
      setUser(fallbackUser);
      setToken(accessToken);
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(fallbackUser));
      return fallbackUser;
    }
  };

  /**
   * Supabase Password Login
   */
  const login = async (email, password) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // If email confirmation is pending
        if (error.message.toLowerCase().includes('email not confirmed') || error.message.toLowerCase().includes('not confirmed')) {
          throw new Error('Please verify your email via the confirmation link sent to your inbox before logging in.');
        }

        // If credentials invalid on Supabase Auth, check if it is a pre-seeded demo account in public.users
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', email.trim())
          .eq('password', password)
          .maybeSingle();

        if (dbUser) {
          // Pre-seeded demo account match!
          const demoUser = {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            active: dbUser.active !== undefined ? dbUser.active : true,
          };
          const dummyToken = 'demo-token-' + dbUser.id;
          setUser(demoUser);
          setToken(dummyToken);
          localStorage.setItem(TOKEN_KEY, dummyToken);
          localStorage.setItem(USER_KEY, JSON.stringify(demoUser));
          return demoUser;
        }

        throw error;
      }

      if (data?.user && data?.session) {
        const loggedInUser = await syncUserFromSupabase(data.user, data.session.access_token);
        return loggedInUser;
      }

      throw new Error('Authentication failed. Please check your credentials.');
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  /**
   * Supabase Registration with Email Verification link
   */
  const register = async ({ name, email, password, role = 'CANDIDATE' }) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }

    const cleanEmail = email.trim();
    const cleanRole = role.toUpperCase();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name,
          role: cleanRole,
        },
      },
    });

    if (error) {
      throw error;
    }

    // Upsert directly into public.users so the profile is ready immediately in Postgres
    if (data?.user) {
      try {
        await supabase.from('users').upsert({
          id: data.user.id,
          auth_id: data.user.id,
          name,
          email: cleanEmail,
          role: cleanRole,
          active: true,
        });

        if (cleanRole === 'CANDIDATE') {
          await supabase.from('candidate_profiles').upsert({
            user_id: data.user.id,
            headline: 'Software Professional',
            skills: ['Java', 'React', 'Spring Boot'],
          });
        } else if (cleanRole === 'RECRUITER') {
          await supabase.from('recruiter_profiles').upsert({
            user_id: data.user.id,
            company_name: 'TechCorp Solutions',
          });
        }
      } catch (insertErr) {
        console.warn('Profile initialization note:', insertErr);
      }
    }

    // Return indicator that verification email was sent
    return {
      emailConfirmationRequired: true,
      email: cleanEmail,
      user: data?.user,
    };
  };

  /**
   * Supabase Sign Out
   */
  const logout = async () => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setToken('');
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  };

  const refreshUser = async () => {
    if (user?.id && isSupabaseConfigured()) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .or(`id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle();

      if (profile) {
        const updated = { ...user, ...profile };
        setUser(updated);
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
        return updated;
      }
    }
    return user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user ? user.role : null,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
