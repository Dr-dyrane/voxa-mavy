
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
    const checkAuth = async () => {
      // Initial auth check from Supabase directly
      const { data: { session } } = await supabase.auth.getSession();
      
      // If we have a session but userStore doesn't reflect it, refresh user data
      if (session && !isAuthenticated) {
        await refreshUser();
      }
      
      setAuthChecked(true);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session ? 'User authenticated' : 'No session');
        
        // Use setTimeout to prevent potential deadlock
        setTimeout(() => {
          refreshUser();
          setAuthChecked(true);
        }, 0);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [isAuthenticated, refreshUser]);

  // Provide auth state to all child components
  const value = {
    isAuthenticated,
    isLoading: isLoading || !authChecked
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
