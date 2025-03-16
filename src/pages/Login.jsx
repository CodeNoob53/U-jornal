import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isRegistering) {
        // Реєстрація нового користувача
        const { data: existingUsers } = await supabase
          .from('users')
          .select('count')
          .single();

        // Якщо це перший користувач, зробимо його адміністратором
        const isFirstUser = !existingUsers || existingUsers.count === 0;

        const { error: signUpError } = await signUp({ 
          email, 
          password,
          options: {
            data: {
              role: isFirstUser ? 'admin' : 'teacher' // Перший користувач стає адміном
            }
          }
        });
        
        if (signUpError) throw signUpError;

        // Створюємо запис в таблиці users
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: (await supabase.auth.getUser()).data.user.id,
              email,
              role: isFirstUser ? 'admin' : 'teacher',
              full_name: email.split('@')[0] // Тимчасове ім'я
            }
          ]);

        if (insertError) throw insertError;

        setError('Обліковий запис створено. Тепер ви можете увійти.');
        setIsRegistering(false);
      } else {
        // Вхід існуючого користувача
        const { error: signInError } = await signIn({ email, password });
        if (signInError) throw signInError;
        navigate('/');
      }
    } catch (error) {
      setError(isRegistering 
        ? 'Помилка реєстрації. Можливо, такий email вже існує.'
        : 'Помилка входу. Перевірте email та пароль.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isRegistering ? 'Реєстрація' : 'Вхід в систему'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email адреса"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Пароль</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-500"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering 
                ? 'Вже маєте обліковий запис? Увійти' 
                : 'Немає облікового запису? Зареєструватися'}
            </button>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isRegistering ? 'Зареєструватися' : 'Увійти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;