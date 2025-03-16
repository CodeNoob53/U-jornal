import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { GraduationCap, RotateCcw } from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import DebugPanel from './components/DebugPanel';

// Компонент помилки, який просто показує кнопку для відновлення
function RecoveryScreen() {
  const [isReloading, setIsReloading] = useState(false);
  
  const handleForceLogout = async () => {
    try {
      setIsReloading(true);
      
      // Очищаємо всі локальні сховища
      localStorage.clear();
      sessionStorage.clear();
      
      // Очищаємо всі куки
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Примусовий вихід
      await supabase.auth.signOut({ scope: 'global' });
      
      // Перенаправляємо на логін
      window.location.href = '/login';
    } catch (e) {
      console.error("Помилка при очищенні даних:", e);
      // Якщо помилка, просто перезавантажуємо сторінку
      window.location.reload();
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Щось пішло не так</h2>
        <p className="text-gray-700 mb-6">
          Сталася помилка при завантаженні додатку. Це може бути пов'язано з проблемами сесії або даних авторизації.
        </p>
        <button
          onClick={handleForceLogout}
          disabled={isReloading}
          className={`flex items-center justify-center mx-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${isReloading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isReloading ? (
            <>
              <RotateCcw className="w-5 h-5 mr-2 animate-spin" />
              Відновлення...
            </>
          ) : (
            'Відновити сесію та перезавантажити'
          )}
        </button>
      </div>
    </div>
  );
}

// Надпростий компонент завантаження
function SimpleLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-center text-gray-700">Завантаження...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading, userRole } = useAuth();
  const [appError, setAppError] = useState(false);
  
  // Функція для відображення користувацької помилки у випадку проблем рендерингу
  useEffect(() => {
    const handleError = () => {
      console.error("Глобальна помилка в додатку");
      setAppError(true);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  // Спрощений вивід для перевірки стану автентифікації
  useEffect(() => {
    console.log("App render - auth state:", { user, loading, userRole });
  }, [user, loading, userRole]);
  
  if (appError) {
    return <RecoveryScreen />;
  }
  
  if (loading) {
    return <SimpleLoader />;
  }
  
  // Надпростий шлях рендерингу без перенаправлень
  return (
    <Router>
      <nav className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex items-center">
          <GraduationCap className="w-8 h-8 mr-2" />
          <h1 className="text-2xl font-bold">Університетський Журнал</h1>
          {user && (
            <Link to="/login" className="ml-auto text-white hover:text-blue-200">
              Вихід
            </Link>
          )}
        </div>
      </nav>
      
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/error" element={<RecoveryScreen />} />
        <Route path="/*" element={user ? <Dashboard /> : <Navigate to="/login" />} />
      </Routes>
      
      {/* Панель налагодження - буде показана тільки якщо користувач залогінений і має роль адміна */}
      <DebugPanel />
    </Router>
  );
}

function App() {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return <RecoveryScreen />;
  }
  
  return (
    <React.Fragment>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </React.Fragment>
  );
}

export default App;