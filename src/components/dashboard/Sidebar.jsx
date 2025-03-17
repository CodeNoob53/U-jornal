import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  BarChart2,
  LogOut,
  Building,
  FileText,
  BarChart
} from 'lucide-react';

export function Sidebar({ activeSection, setActiveSection, userRole, user, menuItems }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  // Використовуємо menuItems з пропсів, або дефолтний список, якщо menuItems не передано
  const defaultMenuItems = [
    { id: 'overview', icon: BarChart2, label: 'Огляд' },
    { id: 'users', icon: Users, label: 'Користувачі', adminOnly: true },
    { id: 'faculties', icon: GraduationCap, label: 'Факультети', adminOnly: true },
    { id: 'departments', icon: Building, label: 'Кафедри', adminOnly: true },
    { id: 'subjects', icon: BookOpen, label: 'Предмети' },
    { id: 'journal', icon: FileText, label: 'Журнал' },
    { id: 'attendance', icon: Calendar, label: 'Журнал відвідування' },
    { id: 'attendance-reports', icon: BarChart, label: 'Звіти відвідувань' },
  ];

  const itemsToRender = menuItems || defaultMenuItems;

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800">
          {userRole === 'admin' ? 'Адміністратор' : 
           userRole === 'teacher' ? 'Викладач' :
           userRole === 'student' ? 'Студент' : 
           userRole === 'parent' ? 'Батьки' : 
           userRole === 'curator' ? 'Куратор' :
           userRole === 'dean' ? 'Декан' :
           userRole === 'vice_dean' ? 'Заступник декана' :
           userRole === 'group_leader' ? 'Староста' : 'Користувач'}
        </h2>
        <p className="text-sm text-gray-600">{user?.email}</p>
      </div>
      
      <nav className="mt-6">
        {itemsToRender.map((item) => {
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
  );
}