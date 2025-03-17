// Перенесемо створені компоненти в правильну структуру
// Спочатку створимо структуру директорій
// src/components/attendance/
// - StudentAttendanceReport.jsx
// - GroupAttendanceReport.jsx
// - FacultyAttendanceReport.jsx
// - index.js

// Файл src/components/attendance/index.js
export { StudentAttendanceReport } from './StudentAttendanceReport';
export { GroupAttendanceReport } from './GroupAttendanceReport';
export { FacultyAttendanceReport } from './FacultyAttendanceReport';

// Тепер інтегруємо звіти в основний компонент журналу
// Файл src/components/journal/AttendanceJournalSection.jsx

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, UserCircle, Building, BarChart
} from 'lucide-react';

import { StudentAttendanceReport } from '../attendance/StudentAttendanceReport';
import { GroupAttendanceReport } from '../attendance/GroupAttendanceReport';
import { FacultyAttendanceReport } from '../attendance/FacultyAttendanceReport';

export function AttendanceReportSection() {
  const { user, userRole, isDean, isViceDean, isCurator, isGroupLeader } = useAuth();
  const [activeTab, setActiveTab] = useState('student');
  
  // Визначаємо, які вкладки показувати в залежності від ролі
  const canViewStudentReport = true; // Всі користувачі можуть бачити звіт студента
  const canViewGroupReport = userRole === 'admin' || isDean() || isViceDean() || isCurator() || isGroupLeader();
  const canViewFacultyReport = userRole === 'admin' || isDean() || isViceDean();
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Звіти відвідуваності</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 mb-6">
          {canViewStudentReport && (
            <TabsTrigger value="student" className="flex items-center">
              <UserCircle className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Студент</span>
            </TabsTrigger>
          )}
          
          {canViewGroupReport && (
            <TabsTrigger value="group" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Група</span>
            </TabsTrigger>
          )}
          
          {canViewFacultyReport && (
            <TabsTrigger value="faculty" className="flex items-center">
              <Building className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Факультет</span>
            </TabsTrigger>
          )}
        </TabsList>
        
        {canViewStudentReport && (
          <TabsContent value="student">
            <StudentAttendanceReport />
          </TabsContent>
        )}
        
        {canViewGroupReport && (
          <TabsContent value="group">
            <GroupAttendanceReport />
          </TabsContent>
        )}
        
        {canViewFacultyReport && (
          <TabsContent value="faculty">
            <FacultyAttendanceReport />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// Інтеграція в Dashboard.jsx
// У функції renderSection додаємо кейс для звітів відвідуваності
// і додаємо новий пункт меню в Sidebar.jsx

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
      return <AttendanceJournalSection />;
    case 'attendance-reports':
      return <AttendanceReportSection />;
    default:
      return <OverviewSection stats={stats} />;
  }
};

// Додаємо новий пункт меню у Sidebar.jsx
const menuItems = [
  { id: 'overview', icon: BarChart2, label: 'Огляд' },
  { id: 'users', icon: Users, label: 'Користувачі', adminOnly: true },
  { id: 'faculties', icon: GraduationCap, label: 'Факультети', adminOnly: true },
  { id: 'departments', icon: Building, label: 'Кафедри', adminOnly: true },
  { id: 'subjects', icon: BookOpen, label: 'Предмети' },
  { id: 'attendance', icon: Calendar, label: 'Журнал відвідування' },
  { id: 'attendance-reports', icon: BarChart, label: 'Звіти відвідувань' },
];