import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from '../components/dashboard/Sidebar';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { LoadingIndicator } from '../components/common/LoadingIndicator';
import { OverviewSection } from '../components/dashboard/OverviewSection';
import { UsersSection } from '../components/dashboard/UsersSection';
import { FacultiesSection } from '../components/dashboard/FacultiesSection';
import { DepartmentsSection } from '../components/dashboard/DepartmentsSection';
import { SubjectsSection } from '../components/dashboard/SubjectsSection';
import { AttendanceJournalSection } from '../components/dashboard/AttendanceJournalSection'; // Змінено
import { JournalSection } from '../components/dashboard/JournalSection';
import { AttendanceReportSection } from '../components/dashboard/AttendanceReportSection'; // Новий імпорт
import { BarChart2, GraduationCap, Building, BookOpen, FileText, Calendar, Users, BarChart } from 'lucide-react'; // Додано BarChart

function Dashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const [userRole, setUserRole] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Стани для даних
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    usersCount: 0,
    facultiesCount: 0,
    subjectsCount: 0
  });
  
  // Перевірка автентифікації
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Отримання ролі користувача
    const getUserRole = async () => {
      try {
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
      } catch (err) {
        console.error('Failed to fetch user role:', err);
      }
    };

    getUserRole();
  }, [user, navigate]);

  // Оновлений список меню з доданим "Журнал" та "Звіти відвідуваності"
  const menuItems = [
    { id: 'overview', icon: BarChart2, label: 'Огляд' },
    { id: 'users', icon: Users, label: 'Користувачі', adminOnly: true },
    { id: 'faculties', icon: GraduationCap, label: 'Факультети', adminOnly: true },
    { id: 'departments', icon: Building, label: 'Кафедри', adminOnly: true },
    { id: 'subjects', icon: BookOpen, label: 'Предмети' },
    { id: 'journal', icon: FileText, label: 'Журнал' },
    { id: 'attendance', icon: Calendar, label: 'Журнал відвідування' }, // Змінено назву
    { id: 'attendance-reports', icon: BarChart, label: 'Звіти відвідувань' }, // Новий пункт меню
  ];

  // Налаштування компонента в залежності від активної секції
  const renderSection = () => {
    if (loading) {
      return <LoadingIndicator />;
    }

    switch (activeSection) {
      case 'overview':
        return <OverviewSection stats={stats} />;
      case 'users':
        return userRole === 'admin' ? <UsersSection /> : null;
      case 'faculties':
        return userRole === 'admin' ? <FacultiesSection /> : null;
      case 'departments':
        return userRole === 'admin' ? <DepartmentsSection /> : null;
      case 'subjects':
        return <SubjectsSection userRole={userRole} />;
      case 'journal':
        return <JournalSection />;
      case 'attendance':
        return <AttendanceJournalSection />; // Змінено на новий компонент
      case 'attendance-reports':
        return <AttendanceReportSection />; // Додано новий case
      default:
        return <OverviewSection stats={stats} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar з меню навігації */}
      <Sidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
        userRole={userRole} 
        user={user}
        menuItems={menuItems} // Передаємо menuItems до Sidebar
      />

      {/* Основний вміст */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          {/* Відображення помилки, якщо вона є */}
          {error && <ErrorAlert message={error} />}
          
          {/* Відображення потрібної секції */}
          {renderSection()}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;