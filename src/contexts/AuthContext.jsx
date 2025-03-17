import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DataService } from '../services/DataService';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [extendedRoles, setExtendedRoles] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Синхронізувати стан користувача з локальним сховищем для стійкості
  const updateUserState = (currentUser) => {
    setUser(currentUser);
    if (currentUser) {
      // Зберігаємо базові дані для резервного відновлення
      localStorage.setItem('user_email', currentUser.email);
      localStorage.setItem('last_login', new Date().toISOString());
      
      // Отримуємо роль користувача з бази даних
      fetchUserRole(currentUser.id);
    } else {
      localStorage.removeItem('user_email');
      localStorage.removeItem('last_login');
      setUserRole(null);
      setExtendedRoles(null);
    }
  };
  
  // Отримання ролі користувача з таблиці users та розширених ролей
  const fetchUserRole = async (userId) => {
    try {
      // Отримуємо базову роль користувача
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Помилка отримання ролі користувача:', error);
        return;
      }
      
      console.log('Отримана роль користувача:', data?.role);
      setUserRole(data?.role);
      
      // Отримуємо розширені ролі користувача
      try {
        const extendedRolesData = await DataService.getUserExtendedRoles(userId);
        
        // Додаємо перевірку наявності даних
        if (!extendedRolesData) {
          console.warn('Користувач не має розширених ролей');
          setExtendedRoles(null);
          return;
        }
        
        console.log('Отримані розширені ролі:', extendedRolesData);
        setExtendedRoles(extendedRolesData);
      } catch (err) {
        console.error('Помилка отримання розширених ролей:', err);
        setExtendedRoles(null);
      }
    } catch (err) {
      console.error('Критична помилка отримання ролі:', err);
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

  // Визначає функції для перевірки розширених ролей
  const isCurator = () => extendedRoles?.is_curator || false;
  const isDean = () => extendedRoles?.is_dean || false;
  const isViceDean = () => extendedRoles?.is_vice_dean || false;
  const isGroupLeader = () => extendedRoles?.is_group_leader || false;
  const hasFacultyAccess = () => isDean() || isViceDean();

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
    userRole,
    extendedRoles,
    isCurator,
    isDean,
    isViceDean,
    isGroupLeader,
    hasFacultyAccess,
    getCuratorGroupId: () => extendedRoles?.group_id || null,
    getFacultyId: () => extendedRoles?.faculty_id || null,
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