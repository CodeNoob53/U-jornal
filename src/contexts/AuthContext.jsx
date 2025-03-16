import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Синхронізувати стан користувача з локальним сховищем для стійкості
  const updateUserState = (currentUser) => {
    setUser(currentUser);
    if (currentUser) {
      // Зберігаємо базові дані для резервного відновлення
      localStorage.setItem('user_email', currentUser.email);
      localStorage.setItem('last_login', new Date().toISOString());
    } else {
      localStorage.removeItem('user_email');
      localStorage.removeItem('last_login');
    }
  };

  // Ініціалізація сесії і підписка на зміни
  useEffect(() => {
    console.log("Initializing auth context");

    const initAuth = async () => {
      try {
        setLoading(true);
        
        // Отримуємо сесію
        const { data } = await supabase.auth.getSession();
        const { session } = data;
        
        if (session) {
          console.log("Found existing session");
          const { user: currentUser } = session;
          updateUserState(currentUser);
        } else {
          console.log("No active session found");
          updateUserState(null);
        }
      } catch (err) {
        console.error("Error initializing session:", err);
        setError(err.message);
        updateUserState(null);
      } finally {
        setLoading(false);
      }
    };

    // Спочатку завантажуємо сесію
    initAuth();

    // Далі підписуємося на зміни стану
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        
        try {
          if (event === 'SIGNED_IN' && session) {
            updateUserState(session.user);
          }
          else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
            updateUserState(null);
          }
          else if (session?.user) {
            updateUserState(session.user);
          }
        } catch (err) {
          console.error("Error handling auth change:", err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: async () => {
      try {
        updateUserState(null);
        return await supabase.auth.signOut();
      } catch (err) {
        console.error("Error signing out:", err);
        throw err;
      }
    },
    user,
    loading,
    error,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}