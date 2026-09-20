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
   * Universal Resilient Login
   * Seamlessly authenticates via Supabase Auth, Supabase DB, Spring Boot Backend, or pre-seeded demo credentials.
   */
  const login = async (email, password) => {
    const cleanEmail = (email || '').trim();
    const cleanPass = password || '';

    // 1. Try Supabase Auth
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPass,
        });

        if (!error && data?.user && data?.session) {
          const loggedInUser = await syncUserFromSupabase(data.user, data.session.access_token);
          return loggedInUser;
        }

        if (error && (error.message.toLowerCase().includes('email not confirmed') || error.message.toLowerCase().includes('not confirmed'))) {
          throw new Error('Please verify your email via the confirmation link sent to your inbox before logging in.');
        }
      } catch (sbAuthErr) {
        if (sbAuthErr.message && sbAuthErr.message.includes('verify your email')) {
          throw sbAuthErr;
        }
      }

      // 2. Check Supabase DB public.users table directly (supports pre-seeded demo accounts & direct database users)
      try {
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', cleanEmail)
          .eq('password', cleanPass)
          .maybeSingle();

        if (dbUser) {
          const demoUser = {
            id: dbUser.id,
            authId: dbUser.auth_id || dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            active: dbUser.active !== undefined ? dbUser.active : true,
          };
          const dummyToken = 'session-token-' + dbUser.id;
          setUser(demoUser);
          setToken(dummyToken);
          localStorage.setItem(TOKEN_KEY, dummyToken);
          localStorage.setItem(USER_KEY, JSON.stringify(demoUser));
          return demoUser;
        }
      } catch (dbErr) {
        console.warn('Supabase users table lookup:', dbErr);
      }
    }

    // 3. Try Spring Boot Backend REST API (/api/auth/login)
    try {
      const response = await axiosClient.post('/auth/login', {
        email: cleanEmail,
        password: cleanPass,
      });

      if (response.data && response.data.token) {
        const backendUser = {
          id: response.data.userId,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role,
          active: true,
        };
        setUser(backendUser);
        setToken(response.data.token);
        localStorage.setItem(TOKEN_KEY, response.data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(backendUser));
        return backendUser;
      }
    } catch (backendErr) {
      if (backendErr?.response?.data?.error?.includes('deactivated')) {
        throw new Error('Your account has been deactivated. Please contact support.');
      }
    }

    // 4. Pre-seeded Demo Accounts Safety Net
    const normalizedEmail = cleanEmail.toLowerCase();
    const DEMO_ACCOUNTS = {
      'admin@hiresphere.ai': { id: '1', name: 'Admin', role: 'ADMIN', pass: 'admin123' },
      'admin@careerhub.com': { id: '1', name: 'Admin', role: 'ADMIN', pass: 'admin123' },
      'recruiter@techcorp.com': { id: '2', name: 'Rahul Sharma', role: 'RECRUITER', pass: 'recruiter123' },
      'alice@example.com': { id: '3', name: 'Alice Fernandes', role: 'CANDIDATE', pass: 'candidate123' },
      'anassidd7256@gmail.com': { id: '4', name: 'Anas', role: 'CANDIDATE', pass: 'An@s1234' },
    };

    const matched = DEMO_ACCOUNTS[normalizedEmail];
    if (matched && matched.pass === cleanPass) {
      const demoUser = {
        id: matched.id,
        name: matched.name,
        email: cleanEmail,
        role: matched.role,
        active: true,
      };
      const sessionToken = 'demo-session-' + matched.id;
      setUser(demoUser);
      setToken(sessionToken);
      localStorage.setItem(TOKEN_KEY, sessionToken);
      localStorage.setItem(USER_KEY, JSON.stringify(demoUser));
      return demoUser;
    }

    throw new Error('Invalid email or password. Please check your credentials.');
  };

  /**
   * Supabase Registration with Email Verification link
   */
  const register = async ({ name, email, password, role = 'CANDIDATE' }) => {
    const cleanEmail = email.trim();
    const cleanRole = role.toUpperCase();

    // 1. Try Supabase Auth
    if (isSupabaseConfigured()) {
      try {
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

        if (!error && data?.user) {
          try {
            await supabase.from('users').upsert({
              id: data.user.id,
              auth_id: data.user.id,
              name,
              email: cleanEmail,
              password,
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

          return {
            emailConfirmationRequired: true,
            email: cleanEmail,
            user: data.user,
          };
        }

        if (error) {
          console.warn('Supabase auth signup warning, attempting backend registration:', error.message);
        }
      } catch (sbErr) {
        console.warn('Supabase signup exception, trying backend:', sbErr);
      }
    }

    // 2. Try Backend registration
    try {
      const response = await axiosClient.post('/auth/register', {
        name,
        email: cleanEmail,
        password,
        role: cleanRole,
      });

      return {
        emailConfirmationRequired: false,
        email: cleanEmail,
        user: response.data,
      };
    } catch (backendErr) {
      const msg = backendErr.response?.data?.error || backendErr.response?.data?.message || backendErr.message;
      throw new Error(msg || 'Registration failed. Please try again.');
    }
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
