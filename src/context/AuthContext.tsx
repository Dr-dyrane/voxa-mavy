
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

  // Check auth state on mount and listen for changes
  useEffect(() => {
    console.log("AuthContext: Setting up auth state check and listener");

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session ? 'User authenticated' : 'No session');
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || 
            (event === 'INITIAL_SESSION' && session)) {
          // Use setTimeout to prevent potential deadlock with Supabase client
          setTimeout(() => {
            console.log('Refreshing user after auth event:', event);
            refreshUser().then(() => setAuthChecked(true));
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setAuthChecked(true);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session ? 'Session exists' : 'No session');
      
      if (session) {
        console.log('Found existing session, refreshing user data');
        refreshUser().then(() => setAuthChecked(true));
      } else {
        console.log('No existing session found');
        setAuthChecked(true);
      }
    });

    return () => {
      console.log("Cleaning up auth subscription");
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
