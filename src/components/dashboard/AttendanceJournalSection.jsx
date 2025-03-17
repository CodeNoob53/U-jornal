import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { DataService } from '../../services/DataService';
import { Calendar, Users } from 'lucide-react';
import { LoadingIndicator } from '../common/LoadingIndicator';
import { ErrorAlert } from '../common/ErrorAlert';

import { JournalFilters } from "../journal/JournalFilters";
import { JournalHeader } from "../journal/JournalHeader";
import { JournalTable } from "../journal/JournalTable";
import { NoDataMessage } from "../journal/NoDataMessage";

export function AttendanceJournalSection() {
  const { user, userRole, extendedRoles, isCurator, isDean, isViceDean, isGroupLeader } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Стан для вибору даних
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  // Вибрані значення
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  // Дані журналу
  const [students, setStudents] = useState([]);
  const [journalDates, setJournalDates] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Режим редагування
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Визначаємо можливості користувача на основі його ролі
  const canEdit = useMemo(() => {
    return userRole === 'admin' || userRole === 'teacher' || isGroupLeader();
  }, [userRole, isGroupLeader]);
  
  const canViewAll = useMemo(() => {
    return userRole === 'admin' || isCurator() || isDean() || isViceDean() || isGroupLeader();
  }, [userRole, isCurator, isDean, isViceDean, isGroupLeader]);

  // Завантаження початкових даних
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        
        // Завантажуємо факультети для адміністратора, декана та заступників
        if (userRole === 'admin' || isDean() || isViceDean()) {
          const facultiesData = await DataService.getFaculties();
          setFaculties(facultiesData);
          
          // Для декана і заступників автоматично вибираємо їх факультет
          if (isDean() || isViceDean()) {
            const facultyId = extendedRoles?.faculty_id;
            if (facultyId) {
              setSelectedFaculty(facultyId);
              
              // Завантажуємо кафедри для вибраного факультету
              const departmentsData = await DataService.getDepartments(facultyId);
              setDepartments(departmentsData);
            }
          }
        }
        
        // Для куратора автоматично вибираємо його групу
        if (isCurator()) {
          const groupId = extendedRoles?.group_id;
          if (groupId) {
            setSelectedGroup(groupId);
            
            // Завантажуємо список предметів для групи
            const { data: groupSubjects } = await supabase
              .from('teacher_subjects')
              .select('*, subject:subjects(*)')
              .eq('group_id', groupId);
              
            if (groupSubjects) {
              const uniqueSubjects = [];
              groupSubjects.forEach(item => {
                if (!uniqueSubjects.some(s => s.id === item.subject.id)) {
                  uniqueSubjects.push(item.subject);
                }
              });
              setSubjects(uniqueSubjects);
            }
          }
        }
        
        // Для старости автоматично вибираємо його групу
        if (isGroupLeader()) {
          const groupId = extendedRoles?.group_id;
          if (groupId) {
            setSelectedGroup(groupId);
            
            // Завантажуємо список предметів для групи
            const { data: groupSubjects } = await supabase
              .from('teacher_subjects')
              .select('*, subject:subjects(*)')
              .eq('group_id', groupId);
              
            if (groupSubjects) {
              const uniqueSubjects = [];
              groupSubjects.forEach(item => {
                if (!uniqueSubjects.some(s => s.id === item.subject.id)) {
                  uniqueSubjects.push(item.subject);
                }
              });
              setSubjects(uniqueSubjects);
            }
          }
        }
        
        // Для студента автоматично вибираємо його групу
        if (userRole === 'student') {
          const { data: studentData } = await supabase
            .from('students')
            .select('*, group:student_groups(*)')
            .eq('user_id', user.id)
            .single();
            
          if (studentData) {
            setSelectedGroup(studentData.group.id);
            
            // Завантажуємо список предметів для групи
            const { data: groupSubjects } = await supabase
              .from('teacher_subjects')
              .select('*, subject:subjects(*)')
              .eq('group_id', studentData.group.id);
              
            if (groupSubjects) {
              const uniqueSubjects = [];
              groupSubjects.forEach(item => {
                if (!uniqueSubjects.some(s => s.id === item.subject.id)) {
                  uniqueSubjects.push(item.subject);
                }
              });
              setSubjects(uniqueSubjects);
            }
          }
        }

      } catch (err) {
        console.error('Помилка завантаження початкових даних:', err);
        setError(`Помилка завантаження даних: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [user, userRole, extendedRoles, isCurator, isDean, isViceDean, isGroupLeader]);

  // Зміна місяця
  const changeMonth = (increment) => {
    let newMonth = currentMonth + increment;
    let newYear = currentYear;
    
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  // Додавання нового дня в журнал
  const addNewDay = async () => {
    if (!selectedGroup || !selectedSubject || !newDate) return;
    
    try {
      setIsSaving(true);
      
      // Створюємо новий день в журналі
      await DataService.createAttendanceJournalDay(
        selectedGroup,
        selectedSubject,
        newDate,
        students.map(s => s.id)
      );
      
      // Оновлюємо дані журналу
      await loadJournalData();
      
      // Переходимо до режиму редагування
      setIsEditing(true);
    } catch (err) {
      console.error('Помилка створення нового дня:', err);
      setError(`Помилка створення нового дня: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Збереження змін у відвідуваності
  const saveAttendanceChanges = async () => {
    if (!selectedGroup || !selectedSubject) return;
    
    try {
      setIsSaving(true);
      // Логіка збереження тут...
      setIsEditing(false);
    } catch (err) {
      console.error('Помилка збереження змін:', err);
      setError(`Помилка збереження змін: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Зміна статусу відвідуваності
  const toggleAttendanceStatus = async (studentId, date) => {
    if (!isEditing || !selectedGroup || !selectedSubject) return;
    
    try {
      // Знаходимо запис в даних відвідуваності
      const record = attendanceData[date]?.[studentId];
      
      if (record) {
        // Змінюємо статус
        const newStatus = record.status === 'present' ? 'absent' : 'present';
        
        // Оновлюємо запис в базі даних
        await DataService.updateAttendanceStatus(record.id, newStatus);
        
        // Оновлюємо локальні дані
        setAttendanceData(prev => ({
          ...prev,
          [date]: {
            ...prev[date],
            [studentId]: {
              ...prev[date][studentId],
              status: newStatus
            }
          }
        }));
      }
    } catch (err) {
      console.error('Помилка зміни статусу відвідуваності:', err);
      setError(`Помилка зміни статусу: ${err.message}`);
    }
  };
  
  // Завантаження даних журналу
  const loadJournalData = async () => {
    if (!selectedGroup || !selectedSubject) return;
    
    try {
      setLoading(true);
      
      // Визначаємо дати початку і кінця місяця
      const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
      
      // Завантажуємо дані журналу
      const journalEntries = await DataService.getAttendanceJournal(
        selectedGroup, 
        selectedSubject, 
        startOfMonth, 
        endOfMonth
      );
      
      // Отримуємо унікальні дати
      const dates = journalEntries.map(entry => entry.date).sort();
      setJournalDates(dates);
      
      // Завантажуємо дані відвідуваності для кожного запису журналу
      const attendanceMap = {};
      
      for (const entry of journalEntries) {
        const records = await DataService.getAttendanceRecords(entry.id);
        
        // Якщо користувач - студент, фільтруємо тільки його записи
        if (userRole === 'student') {
          const studentId = students.find(s => s.user_id === user.id)?.id;
          if (studentId) {
            const filteredRecords = records.filter(r => r.student_id === studentId);
            attendanceMap[entry.date] = filteredRecords.reduce((acc, record) => {
              acc[record.student_id] = {
                status: record.status,
                notes: record.notes,
                id: record.id
              };
              return acc;
            }, {});
          }
        } else {
          // Для інших ролей - всі записи
          attendanceMap[entry.date] = records.reduce((acc, record) => {
            acc[record.student_id] = {
              status: record.status,
              notes: record.notes,
              id: record.id
            };
            return acc;
          }, {});
        }
      }
      
      setAttendanceData(attendanceMap);
    } catch (err) {
      console.error('Помилка завантаження даних журналу:', err);
      setError(`Помилка завантаження журналу: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Експорт журналу
  const exportJournal = () => {
    alert('Функція експорту журналу ще не реалізована');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Журнал відвідуваності</h1>
      {error && <ErrorAlert message={error} />}
      
      {/* Компонент фільтрів */}
      <JournalFilters 
        userRole={userRole}
        isDean={isDean}
        isViceDean={isViceDean}
        isCurator={isCurator}
        isGroupLeader={isGroupLeader}
        faculties={faculties}
        departments={departments}
        groups={groups}
        subjects={subjects}
        selectedFaculty={selectedFaculty}
        selectedDepartment={selectedDepartment}
        selectedGroup={selectedGroup}
        selectedSubject={selectedSubject}
        setSelectedFaculty={setSelectedFaculty}
        setSelectedDepartment={setSelectedDepartment}
        setSelectedGroup={setSelectedGroup}
        setSelectedSubject={setSelectedSubject}
      />
      
      {/* Панель журналу */}
      {selectedGroup && selectedSubject ? (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Заголовок і кнопки управління */}
          <JournalHeader
            currentMonth={currentMonth}
            currentYear={currentYear}
            changeMonth={changeMonth}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            canEdit={canEdit}
            newDate={newDate}
            setNewDate={setNewDate}
            addNewDay={addNewDay}
            saveAttendanceChanges={saveAttendanceChanges}
            isSaving={isSaving}
            exportJournal={exportJournal}
          />
          
          {/* Таблиця журналу */}
          {loading ? (
            <LoadingIndicator />
          ) : (
            <>
              {journalDates.length > 0 ? (
                <JournalTable
                  journalDates={journalDates}
                  students={students}
                  userRole={userRole}
                  user={user}
                  attendanceData={attendanceData}
                  isEditing={isEditing}
                  canEdit={canEdit}
                  toggleAttendanceStatus={toggleAttendanceStatus}
                />
              ) : (
                <NoDataMessage
                  canEdit={canEdit}
                  addNewDay={addNewDay}
                />
              )}
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p>Оберіть групу та предмет для перегляду журналу відвідування</p>
        </div>
      )}
    </div>
  );
}