import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AppUser } from '@/types/auth';
import supabase from '@/assets/supabase/client';
import type { User as SupabaseApiUser } from '@supabase/supabase-js';

const toAppUser = (supabaseUser: SupabaseApiUser | null | undefined): AppUser | null => {
  if (!supabaseUser) {
    return null;
  }

  const appUserCandidate = {
    ...supabaseUser,
    updated_at: supabaseUser.updated_at ?? supabaseUser.created_at,


  };

  return appUserCandidate as AppUser;
};

interface AuthContextType {
  user: AppUser | null;

  loading: boolean;


}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let listenerSubscription: { unsubscribe: () => void } | undefined;

    const initializeAuth = async () => {
      console.log('[AuthContext] initializeAuth: Starting authentication initialization.');

      try {

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('[AuthContext] initializeAuth: getSession response - Session:', session ? { user_id: session.user.id, expires_at: session.expires_at, HASSESSION: true } : { HASSESSION: false }, 'Error:', sessionError);

        if (sessionError) {
          console.error('Error fetching session:', sessionError.message);
        }

        const initialUser = toAppUser(session?.user ?? null);
        console.log('[AuthContext] initializeAuth: Setting initial user -', initialUser ? { id: initialUser.id, email: initialUser.email } : null);
        setUser(initialUser);


        console.log('[AuthContext] initializeAuth: Setting up onAuthStateChange listener.');
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (_event, currentSession) => {
            console.log('[AuthContext] onAuthStateChange: Event -', _event, 'Session -', currentSession ? { user_id: currentSession.user.id, event: currentSession.user.aud, HASCURRENTSESSION: true } : { HASCURRENTSESSION: false });
            const changedUser = toAppUser(currentSession?.user ?? null);
            console.log('[AuthContext] onAuthStateChange: Setting user from event -', changedUser ? { id: changedUser.id, email: changedUser.email } : null);
            setUser(changedUser);
            console.log('[AuthContext] onAuthStateChange: Setting loading to false.');
            setLoading(false);
          }
        );
        listenerSubscription = authListener?.subscription;

      } catch (error) {
        console.error("[AuthContext] initializeAuth: Caught error during initialization -", error);
        setUser(null);
      } finally {

        console.log('[AuthContext] initializeAuth: Setting loading to false in finally block.');
        setLoading(false);
      }
    };

    initializeAuth();


    return () => {
      console.log('[AuthContext] Cleanup: Unsubscribing from onAuthStateChange listener.');
      listenerSubscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,

  };


  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};