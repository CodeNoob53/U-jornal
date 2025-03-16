import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { DataService } from '../../services/DataService';
import { 
  Book, Users, Calendar, Save, Plus, Edit, Check, X, 
  AlertTriangle, Loader2, Filter, Download, FileText
} from 'lucide-react';
import { LoadingIndicator } from '../common/LoadingIndicator';
import { ErrorAlert } from '../common/ErrorAlert';

export function JournalSection() {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [gradesData, setGradesData] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Поточна дата у форматі YYYY-MM-DD
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dates, setDates] = useState([]);

  // Завантаження доступних предметів та груп для викладача або студента
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        if (userRole === 'teacher') {
          // Для викладача завантажуємо предмети, які він викладає
          const { data: teacherSubjects, error: subjectsError } = await supabase
            .from('teacher_subjects')
            .select('*, subject:subjects(*), group:student_groups(*)')
            .eq('teacher_id', user.id);
            
          if (subjectsError) throw subjectsError;
          
          // Групуємо предмети
          const uniqueSubjects = [];
          const uniqueGroups = [];
          
          teacherSubjects.forEach(item => {
            // Додаємо унікальні предмети
            if (!uniqueSubjects.some(s => s.id === item.subject.id)) {
              uniqueSubjects.push(item.subject);
            }
            
            // Додаємо унікальні групи
            if (!uniqueGroups.some(g => g.id === item.group.id)) {
              uniqueGroups.push(item.group);
            }
          });
          
          setSubjects(uniqueSubjects);
          setGroups(uniqueGroups);
          
        } else if (userRole === 'student') {
          // Для студента знаходимо його групу і предмети цієї групи
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('*, group:student_groups(*)')
            .eq('user_id', user.id)
            .single();
            
          if (studentError) throw studentError;
          
          if (studentData) {
            // Встановлюємо групу студента
            setGroups([studentData.group]);
            setSelectedGroup(studentData.group.id);
            
            // Знаходимо предмети для цієї групи
            const { data: groupSubjects, error: groupError } = await supabase
              .from('teacher_subjects')
              .select('*, subject:subjects(*)')
              .eq('group_id', studentData.group.id);
              
            if (groupError) throw groupError;
            
            // Додаємо унікальні предмети
            const uniqueSubjects = [];
            groupSubjects.forEach(item => {
              if (!uniqueSubjects.some(s => s.id === item.subject.id)) {
                uniqueSubjects.push(item.subject);
              }
            });
            
            setSubjects(uniqueSubjects);
          }
        }
      } catch (err) {
        console.error('Помилка завантаження даних:', err);
        setError(`Помилка завантаження даних: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [user, userRole]);

  // Завантаження студентів при виборі групи
  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedGroup) return;
      
      try {
        setLoading(true);
        
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('*, user:users(full_name, email)')
          .eq('group_id', selectedGroup)
          .order('user->full_name');
          
        if (studentsError) throw studentsError;
        
        setStudents(studentsData || []);
      } catch (err) {
        console.error('Помилка завантаження студентів:', err);
        setError(`Помилка завантаження студентів: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadStudents();
  }, [selectedGroup]);

  // Завантаження даних журналу при виборі групи, предмета і дати
  useEffect(() => {
    const loadJournalData = async () => {
      if (!selectedGroup || !selectedSubject) return;
      
      try {
        setLoading(true);
        
        // Завантаження відвідуваності
        const { data: attendanceRecords, error: attendanceError } = await supabase
          .from('attendance')
          .select('*')
          .eq('subject_id', selectedSubject)
          .in('student_id', students.map(s => s.id));
          
        if (attendanceError) throw attendanceError;
        
        // Завантаження оцінок
        const { data: gradesRecords, error: gradesError } = await supabase
          .from('grades')
          .select('*')
          .eq('subject_id', selectedSubject)
          .in('student_id', students.map(s => s.id));
          
        if (gradesError) throw gradesError;
        
        // Переформатування даних для зручного доступу по студенту
        const attendanceByStudent = {};
        const gradesByStudent = {};
        
        // Збираємо всі унікальні дати
        const allDates = new Set();
        
        // Обробка відвідуваності
        attendanceRecords.forEach(record => {
          if (!attendanceByStudent[record.student_id]) {
            attendanceByStudent[record.student_id] = {};
          }
          attendanceByStudent[record.student_id][record.date] = record.status;
          allDates.add(record.date);
        });
        
        // Обробка оцінок
        gradesRecords.forEach(record => {
          if (!gradesByStudent[record.student_id]) {
            gradesByStudent[record.student_id] = {};
          }
          const recordDate = new Date(record.created_at).toISOString().split('T')[0];
          gradesByStudent[record.student_id][recordDate] = record.points;
          allDates.add(recordDate);
        });
        
        // Сортуємо дати
        const sortedDates = Array.from(allDates).sort();
        
        setAttendanceData(attendanceByStudent);
        setGradesData(gradesByStudent);
        setDates(sortedDates);
      } catch (err) {
        console.error('Помилка завантаження даних журналу:', err);
        setError(`Помилка завантаження даних журналу: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    if (students.length > 0) {
      loadJournalData();
    }
  }, [selectedGroup, selectedSubject, students]);

  // Зміна статусу відвідуваності
  const toggleAttendance = (studentId) => {
    if (!isEditing) return;
    
    const currentStatus = attendanceData[studentId]?.[selectedDate] || 'absent';
    const newStatus = currentStatus === 'present' ? 'absent' : 'present';
    
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [selectedDate]: newStatus
      }
    }));
  };

  // Встановлення оцінки
  const setGrade = (studentId, points) => {
    if (!isEditing) return;
    
    setGradesData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [selectedDate]: points
      }
    }));
  };

  // Збереження змін
  const saveChanges = async () => {
    if (!selectedSubject || !selectedGroup) return;
    
    try {
      setIsSaving(true);
      
      // Підготовка даних для збереження
      const attendanceToSave = [];
      const gradesToSave = [];
      
      // Для кожного студента
      students.forEach(student => {
        // Якщо є дані відвідуваності для поточної дати
        if (attendanceData[student.id]?.[selectedDate]) {
          attendanceToSave.push({
            student_id: student.id,
            subject_id: selectedSubject,
            date: selectedDate,
            status: attendanceData[student.id][selectedDate]
          });
        }
        
        // Якщо є оцінки для поточної дати
        if (gradesData[student.id]?.[selectedDate]) {
          gradesToSave.push({
            student_id: student.id,
            subject_id: selectedSubject,
            teacher_id: user.id,
            points: gradesData[student.id][selectedDate]
          });
        }
      });
      
      // Збереження відвідуваності
      if (attendanceToSave.length > 0) {
        // Спочатку видаляємо старі записи
        const { error: deleteError } = await supabase
          .from('attendance')
          .delete()
          .eq('subject_id', selectedSubject)
          .eq('date', selectedDate)
          .in('student_id', students.map(s => s.id));
          
        if (deleteError) throw deleteError;
        
        // Потім додаємо нові
        const { error: insertError } = await supabase
          .from('attendance')
          .insert(attendanceToSave);
          
        if (insertError) throw insertError;
      }
      
      // Збереження оцінок
      if (gradesToSave.length > 0) {
        // Додаємо нові оцінки
        const { error: gradesError } = await supabase
          .from('grades')
          .insert(gradesToSave);
          
        if (gradesError) throw gradesError;
      }
      
      setIsEditing(false);
    } catch (err) {
      console.error('Помилка збереження даних:', err);
      setError(`Помилка збереження даних: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Додавання нового дня в журнал
  const addNewDay = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setIsEditing(true);
    
    // Додаємо нову дату до списку дат, якщо її ще немає
    if (!dates.includes(selectedDate)) {
      setDates([...dates, selectedDate].sort());
    }
  };

  // Рендеринг журналу
  const renderJournal = () => {
    if (!selectedGroup || !selectedSubject) {
      return (
        <div className="text-center py-8 text-gray-500">
          Оберіть групу та предмет для перегляду журналу
        </div>
      );
    }
    
    if (students.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          У вибраній групі немає студентів
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <div className="space-x-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {userRole === 'teacher' && (
              <>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 flex items-center inline-flex"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Редагувати
                  </button>
                ) : (
                  <>
                    <button
                      onClick={saveChanges}
                      disabled={isSaving}
                      className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 flex items-center inline-flex"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Збереження...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-1" />
                          Зберегти
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                      className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 flex items-center inline-flex"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Скасувати
                    </button>
                  </>
                )}
                
                <button
                  onClick={addNewDay}
                  className="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 flex items-center inline-flex"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Новий день
                </button>
              </>
            )}
          </div>
          
          <div>
            <button className="text-gray-600 px-3 py-2 rounded hover:bg-gray-100 flex items-center">
              <Download className="w-4 h-4 mr-1" />
              Експорт
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                  Студент
                </th>
                {userRole === 'teacher' && selectedDate && (
                  <>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                      Відвідуваність
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Оцінка
                    </th>
                  </>
                )}
                {userRole === 'student' && dates.map(date => (
                  <th key={date} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                    {new Date(date).toLocaleDateString()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap border-r">
                    {student.user.full_name}
                  </td>
                  
                  {userRole === 'teacher' && selectedDate && (
                    <>
                      <td 
                        className={`px-4 py-4 text-center border-r cursor-pointer ${isEditing ? 'hover:bg-blue-50' : ''}`}
                        onClick={() => toggleAttendance(student.id)}
                      >
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full 
                          ${attendanceData[student.id]?.[selectedDate] === 'present' 
                            ? 'bg-green-100 text-green-800' 
                            : attendanceData[student.id]?.[selectedDate] === 'absent' 
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                          {attendanceData[student.id]?.[selectedDate] === 'present' ? 'П' : 
                           attendanceData[student.id]?.[selectedDate] === 'absent' ? 'H' : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {isEditing ? (
                          <input 
                            type="number" 
                            min="0" 
                            max="100" 
                            step="0.5"
                            value={gradesData[student.id]?.[selectedDate] || ''}
                            onChange={(e) => setGrade(student.id, parseFloat(e.target.value))}
                            className="w-16 border border-gray-300 rounded px-2 py-1 text-center"
                          />
                        ) : (
                          <span>{gradesData[student.id]?.[selectedDate] || '-'}</span>
                        )}
                      </td>
                    </>
                  )}
                  
                  {userRole === 'student' && dates.map(date => (
                    <td key={date} className="px-4 py-4 text-center border-r">
                      <div className="flex flex-col items-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full mb-1
                          ${attendanceData[student.id]?.[date] === 'present' 
                            ? 'bg-green-100 text-green-800' 
                            : attendanceData[student.id]?.[date] === 'absent' 
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                          {attendanceData[student.id]?.[date] === 'present' ? 'П' : 
                           attendanceData[student.id]?.[date] === 'absent' ? 'H' : '-'}
                        </span>
                        {gradesData[student.id]?.[date] && (
                          <span className="text-sm font-semibold">{gradesData[student.id]?.[date]}</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading && (!subjects.length || !groups.length)) {
    return <LoadingIndicator />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Електронний журнал</h1>
      {error && <ErrorAlert message={error} />}
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Група
            </label>
            <select 
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              disabled={userRole === 'student'}
              className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Виберіть групу</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Предмет
            </label>
            <select 
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Виберіть предмет</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {renderJournal()}
    </div>
  );
}