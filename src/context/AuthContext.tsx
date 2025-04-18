
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/store/user/userStore';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading, refreshUser } = useUserStore();
  const [authChecked, setAuthChecked] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  // Check auth state on mount and listen for changes
  useEffect(() => {
    console.log("AuthContext: Setting up auth state check and listener");
    setIsMounted(true); // Reset mount state when effect runs

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'User authenticated' : 'No session');
        
        if (!isMounted) return; // Don't update state if unmounted
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Use setTimeout to prevent potential deadlock with Supabase client
          setTimeout(async () => {
            if (!isMounted) return;
            try {
              console.log('Refreshing user after auth event:', event);
              await refreshUser();
              if (isMounted) setAuthChecked(true);
            } catch (error) {
              console.error('Error refreshing user:', error);
              if (isMounted) setAuthChecked(true);
            }
          }, 0);
        } else if (event === 'INITIAL_SESSION' && session) {
          setTimeout(async () => {
            if (!isMounted) return;
            try {
              console.log('Initial session found, refreshing user data');
              await refreshUser();
              if (isMounted) setAuthChecked(true);
            } catch (error) {
              console.error('Error refreshing user on initial session:', error);
              if (isMounted) setAuthChecked(true);
            }
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          if (isMounted) setAuthChecked(true);
        } else {
          // For any other events, make sure we're not stuck in loading
          if (isMounted) setAuthChecked(true);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      console.log("Initial session check:", session ? 'Session exists' : 'No session');
      
      if (session) {
        try {
          console.log('Found existing session, refreshing user data');
          await refreshUser();
        } catch (error) {
          console.error('Error refreshing user on initial check:', error);
        } finally {
          if (isMounted) setAuthChecked(true);
        }
      } else {
        console.log('No existing session found');
        if (isMounted) setAuthChecked(true);
      }
    }).catch(error => {
      console.error('Error checking session:', error);
      if (isMounted) setAuthChecked(true);
    });

    return () => {
      console.log("Cleaning up auth subscription");
      setIsMounted(false); // Mark as unmounted
      subscription.unsubscribe();
    };
  }, [refreshUser]); // Only depend on refreshUser to avoid re-running this effect

  // Provide auth state to all child components
  const value = {
    isAuthenticated,
    isLoading: isLoading || !authChecked
  };

  console.log("AuthContext state:", { isAuthenticated, isLoading: isLoading || !authChecked, authChecked });
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
