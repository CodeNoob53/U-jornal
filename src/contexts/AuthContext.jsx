import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Функція для отримання ролі користувача
  const fetchUserRole = async (userId) => {
    try {
      // Використовуємо запит без .single() для уникнення помилок
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId);
      
      if (error) {
        console.error('Error fetching user role:', error);
        setError(`Помилка отримання ролі: ${error.message}`);
        return null;
      }
      
      // Перевіряємо, чи є дані
      if (data && data.length > 0) {
        return data[0].role;
      } else {
        console.warn('User record not found in users table');
        return null;
      }
    } catch (error) {
      console.error('Supabase error:', error);
      setError(`Неочікувана помилка: ${error.message}`);
      return null;
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user || null;
        setUser(currentUser);
        
        // Отримуємо роль, якщо користувач авторизований
        if (currentUser) {
          const role = await fetchUserRole(currentUser.id);
          setUserRole(role);
        }
      } catch (err) {
        console.error('Session initialization error:', err);
        setError(`Помилка ініціалізації сесії: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          const currentUser = session?.user || null;
          setUser(currentUser);
          
          // Отримуємо роль, якщо користувач авторизований
          if (currentUser) {
            const role = await fetchUserRole(currentUser.id);
            setUserRole(role);
          } else {
            setUserRole(null);
          }
        } catch (err) {
          console.error('Auth state change error:', err);
          setError(`Помилка при зміні стану авторизації: ${err.message}`);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
    user,
    userRole,
    error,
    fetchUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}