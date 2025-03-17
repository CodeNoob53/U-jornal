import React, { useState, useEffect } from 'react';
import { DataService } from '../services/DataService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// Компонент для налагодження проблем з даними - тільки для адміністраторів
function DebugPanel() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [userRole, setUserRole] = useState(null);
  
  // Отримуємо роль користувача при монтуванні компонента
  useEffect(() => {
    const getUserRole = async () => {
      if (!user) return;
      
      try {
        console.log("Перевірка ролі користувача для панелі налагодження...");
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Помилка отримання ролі користувача:', error);
          return;
        }
        
        console.log("Роль користувача:", data?.role);
        setUserRole(data?.role);
      } catch (err) {
        console.error('Критична помилка перевірки ролі:', err);
      }
    };
    
    getUserRole();
  }, [user]);
  
  // Додаємо логування для відстеження значень
  useEffect(() => {
    console.log("DebugPanel render - state:", { user, userRole });
  }, [user, userRole]);
  
  // Якщо немає користувача або роль не адміністратор, не відображаємо панель
  if (!user) return null;
  
  // Якщо роль ще не визначена, показуємо індикатор завантаження
  if (userRole === null) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-gray-400 text-white rounded-full w-12 h-12 flex items-center justify-center opacity-50">
          D
        </div>
      </div>
    );
  }
  
  // Перевіряємо, чи є користувач адміністратором
  if (userRole !== 'admin') return null;
  
  const runConnectionTest = async () => {
    setLoading(true);
    addLog('Перевірка з\'єднання з Supabase...');
    
    try {
      const result = await DataService.testConnection();
      setTestResults(result);
      addLog(`Результат з'єднання: ${result.connected ? 'Успішно' : 'Помилка'}`);
      
      if (!result.connected) {
        addLog(`Помилка: ${JSON.stringify(result.error)}`);
      }
    } catch (err) {
      addLog(`Критична помилка: ${err.message}`);
      setTestResults({ connected: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };
  
  const runUserQuery = async () => {
    setLoading(true);
    addLog('Запит користувачів...');
    
    try {
      const { data, error } = await supabase.from('users').select('*').limit(5);
      
      if (error) {
        addLog(`Помилка запиту користувачів: ${error.message}`);
      } else {
        addLog(`Отримано ${data.length} користувачів`);
        addLog(`Приклад даних: ${JSON.stringify(data[0])}`);
      }
    } catch (err) {
      addLog(`Критична помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const runFacultyQuery = async () => {
    setLoading(true);
    addLog('Запит факультетів...');
    
    try {
      const { data, error } = await supabase.from('faculties').select('*');
      
      if (error) {
        addLog(`Помилка запиту факультетів: ${error.message}`);
      } else {
        addLog(`Отримано ${data.length} факультетів`);
        if (data.length > 0) {
          addLog(`Приклад даних: ${JSON.stringify(data[0])}`);
        } else {
          addLog('Немає даних про факультети');
        }
      }
    } catch (err) {
      addLog(`Критична помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const checkRLS = async () => {
    setLoading(true);
    addLog('Перевірка RLS політик...');
    
    try {
      // Це спрощена перевірка, яка просто перевіряє, чи можемо ми отримати дані
      // з різних таблиць. Якщо RLS блокує доступ, ми отримаємо помилку.
      const tables = ['users', 'faculties', 'departments', 'subjects'];
      
      for (const table of tables) {
        addLog(`Перевірка доступу до таблиці ${table}...`);
        const { data, error } = await supabase.from(table).select('count', { count: 'estimated' }).limit(1);
        
        if (error) {
          addLog(`Помилка доступу до таблиці ${table}: ${error.message}`);
        } else {
          addLog(`Доступ до таблиці ${table} успішний`);
        }
      }
    } catch (err) {
      addLog(`Критична помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const addLog = (message) => {
    setLogs(prev => [
      `[${new Date().toISOString().split('T')[1].slice(0, 8)}] ${message}`,
      ...prev
    ].slice(0, 100)); // Обмежуємо до 100 останніх повідомлень
  };
  
  const clearLogs = () => {
    setLogs([]);
  };
  
  const getSession = async () => {
    setLoading(true);
    addLog('Отримання інформації про сесію...');
    
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        addLog(`Помилка отримання сесії: ${error.message}`);
      } else if (data?.session) {
        addLog(`Сесія активна, користувач: ${data.session.user.email}`);
        addLog(`ID користувача: ${data.session.user.id}`);
        addLog(`Термін дії токена: ${new Date(data.session.expires_at * 1000).toLocaleString()}`);
      } else {
        addLog('Активна сесія відсутня');
      }
    } catch (err) {
      addLog(`Критична помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Кнопка відображення/приховування панелі */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="bg-gray-800 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
        title="Панель налагодження (Адмін)"
      >
        {isOpen ? '×' : 'D'}
      </button>
      
      {/* Панель налагодження */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-800 text-white p-3 flex justify-between items-center">
            <h3 className="text-sm font-semibold">Панель налагодження (Адмін)</h3>
            <div>
              <button 
                onClick={clearLogs}
                className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
              >
                Очистити
              </button>
            </div>
          </div>
          
          <div className="p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={runConnectionTest}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
              >
                Перевірка з'єднання
              </button>
              
              <button 
                onClick={getSession}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
              >
                Інформація про сесію
              </button>
              
              <button 
                onClick={runUserQuery}
                disabled={loading}
                className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
              >
                Запит користувачів
              </button>
              
              <button 
                onClick={runFacultyQuery}
                disabled={loading}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
              >
                Запит факультетів
              </button>
              
              <button 
                onClick={checkRLS}
                disabled={loading}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50 col-span-2"
              >
                Перевірка RLS політик
              </button>
            </div>
            
            {testResults && (
              <div className={`p-2 rounded text-sm ${testResults.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {testResults.connected 
                  ? 'З\'єднання з Supabase успішне' 
                  : `Помилка з'єднання: ${JSON.stringify(testResults.error)}`}
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-200">
            <div className="bg-gray-50 p-2 text-xs font-medium text-gray-700">
              Журнал ({logs.length})
            </div>
            <div className="h-48 overflow-y-auto p-2 bg-gray-900">
              {logs.map((log, index) => (
                <div key={index} className="text-xs font-mono mb-1 text-gray-300">
                  {log}
                </div>
              ))}
              
              {logs.length === 0 && (
                <div className="text-xs font-mono text-gray-500 text-center py-4">
                  Журнал порожній
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DebugPanel;