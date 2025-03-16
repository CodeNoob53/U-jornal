import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  BarChart2,
  LogOut,
} from 'lucide-react';

function Dashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const [userRole, setUserRole] = useState(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    async function getUserRole() {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return;
      }

      setUserRole(data?.role);
    }

    getUserRole();
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const menuItems = [
    { id: 'overview', icon: BarChart2, label: 'Огляд' },
    { id: 'users', icon: Users, label: 'Користувачі', adminOnly: true },
    { id: 'faculties', icon: GraduationCap, label: 'Факультети', adminOnly: true },
    { id: 'subjects', icon: BookOpen, label: 'Предмети' },
    { id: 'attendance', icon: Calendar, label: 'Відвідуваність' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {userRole === 'admin' ? 'Адміністратор' : 
             userRole === 'teacher' ? 'Викладач' :
             userRole === 'student' ? 'Студент' : 
             userRole === 'parent' ? 'Батьки' : 'Користувач'}
          </h2>
          <p className="text-sm text-gray-600">{user?.email}</p>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => {
            if (item.adminOnly && userRole !== 'admin') return null;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 ${
                  activeSection === item.id ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            );
          })}
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-700 mt-auto"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Вийти
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          {activeSection === 'overview' && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Огляд системи</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-2">Статистика</h3>
                  <p className="text-gray-600">Завантаження даних...</p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'users' && userRole === 'admin' && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Управління користувачами</h1>
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Додати користувача
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'faculties' && userRole === 'admin' && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Управління факультетами</h1>
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Додати факультет
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'subjects' && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Управління предметами</h1>
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  {userRole === 'admin' && (
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                      Додати предмет
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'attendance' && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Відвідуваність</h1>
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <p className="text-gray-600">Оберіть групу для перегляду відвідуваності</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;