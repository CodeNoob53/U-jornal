import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Створюємо клієнт з налаштуваннями для покращення відновлення сесії
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  },
});

// Додаємо функцію для діагностики сесії
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('Supabase connection error:', error);
      return { ok: false, error };
    }
    return { ok: true };
  } catch (e) {
    console.error('Unexpected Supabase error:', e);
    return { ok: false, error: e };
  }
};

// Функція для відновлення сесії в разі помилки
export const forceRefreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Session refresh error:', error);
      // Спроба вийти і очистити все
      await supabase.auth.signOut({ scope: 'global' });
      return { ok: false, error };
    }
    console.log('Session refreshed successfully');
    return { ok: true, session: data.session };
  } catch (e) {
    console.error('Force refresh error:', e);
    return { ok: false, error: e };
  }
};