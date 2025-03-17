import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, UserCircle, Building
} from 'lucide-react';

import { StudentAttendanceReport } from '../attendance/StudentAttendanceReport';
import { GroupAttendanceReport } from '../attendance/GroupAttendanceReport';
import { FacultyAttendanceReport } from '../attendance/FacultyAttendanceReport';

export function AttendanceReportSection() {
  const { user, userRole, extendedRoles, isDean, isViceDean, isCurator, isGroupLeader } = useAuth();
  const [activeTab, setActiveTab] = useState('student');
  
  // Визначаємо, які вкладки показувати в залежності від ролі
  const canViewStudentReport = true; // Всі користувачі можуть бачити звіт студента
  const canViewGroupReport = userRole === 'admin' || isCurator && isCurator() || isGroupLeader && isGroupLeader() || isDean && isDean() || isViceDean && isViceDean();
  const canViewFacultyReport = userRole === 'admin' || isDean && isDean() || isViceDean && isViceDean();
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Звіти відвідуваності</h1>
      
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b">
          {canViewStudentReport && (
            <button
              onClick={() => setActiveTab('student')}
              className={`flex items-center px-4 py-3 ${
                activeTab === 'student' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'
              }`}
            >
              <UserCircle className="w-4 h-4 mr-2" />
              <span>Студент</span>
            </button>
          )}
          
          {canViewGroupReport && (
            <button
              onClick={() => setActiveTab('group')}
              className={`flex items-center px-4 py-3 ${
                activeTab === 'group' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              <span>Група</span>
            </button>
          )}
          
          {canViewFacultyReport && (
            <button
              onClick={() => setActiveTab('faculty')}
              className={`flex items-center px-4 py-3 ${
                activeTab === 'faculty' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'
              }`}
            >
              <Building className="w-4 h-4 mr-2" />
              <span>Факультет</span>
            </button>
          )}
        </div>
      </div>
      
      <div>
        {activeTab === 'student' && canViewStudentReport && (
          <StudentAttendanceReport />
        )}
        
        {activeTab === 'group' && canViewGroupReport && (
          <GroupAttendanceReport />
        )}
        
        {activeTab === 'faculty' && canViewFacultyReport && (
          <FacultyAttendanceReport />
        )}
      </div>
    </div>
  );
}