import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { DataService } from '../../services/DataService';
import { supabase } from '../../lib/supabase';
import { 
  BarChart, Calendar, Download, Filter, 
  ArrowUpRight, ArrowDownRight, Percent, Clock
} from 'lucide-react';
import { LoadingIndicator } from '../common/LoadingIndicator';
import { ErrorAlert } from '../common/ErrorAlert';

export function StudentAttendanceReport({ studentId = null, showTitle = true }) {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  // Використовуємо ID зі студентського аккаунта, якщо не передано студента
  const effectiveStudentId = studentId || (userRole === 'student' ? user?.id : null);
  
  // Завантаження предметів
  useEffect(() => {
    const loadSubjects = async () => {
      if (!effectiveStudentId) return;
      
      try {
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*, group:student_groups(*)')
          .eq('user_id', effectiveStudentId)
          .single();
          
        if (studentError) throw studentError;
        
        // Знаходимо всі предмети для групи
        const { data: groupSubjects, error: subjectsError } = await supabase
          .from('teacher_subjects')
          .select('*, subject:subjects(*)')
          .eq('group_id', studentData.group.id);
          
        if (subjectsError) throw subjectsError;
        
        // Виділяємо унікальні предмети
        const uniqueSubjects = [];
        groupSubjects.forEach(item => {
          if (!uniqueSubjects.some(s => s.id === item.subject.id)) {
            uniqueSubjects.push(item.subject);
          }
        });
        
        setSubjects(uniqueSubjects);
      } catch (err) {
        console.error('Помилка завантаження предметів:', err);
        setError(`Помилка завантаження предметів: ${err.message}`);
      }
    };
    
    loadSubjects();
  }, [effectiveStudentId]);
  
  // Завантаження статистики відвідуваності
  useEffect(() => {
    const loadAttendanceStats = async () => {
      if (!effectiveStudentId) return;
      
      try {
        setLoading(true);
        
        // Отримуємо ID студента з таблиці students
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', effectiveStudentId)
          .single();
          
        if (studentError) throw studentError;
        
        // Завантажуємо статистику відвідуваності
        const statsData = await DataService.getStudentAttendanceStats(
          studentData.id,
          selectedSubject || null,
          dateRange.startDate,
          dateRange.endDate
        );
        
        setStats(statsData);
      } catch (err) {
        console.error('Помилка завантаження статистики:', err);
        setError(`Помилка завантаження статистики відвідуваності: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadAttendanceStats();
  }, [effectiveStudentId, selectedSubject, dateRange]);
  
  // Обробка зміни фільтрів
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'subject') {
      setSelectedSubject(value);
    } else if (name === 'startDate' || name === 'endDate') {
      setDateRange(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Завантаження звіту
  const handleDownloadReport = () => {
    if (!stats) return;
    
    try {
      // Створюємо CSV-строку
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Додаємо заголовок
      csvContent += "Звіт відвідуваності\n";
      csvContent += `Період: ${dateRange.startDate} - ${dateRange.endDate}\n\n`;
      
      // Додаємо загальну статистику
      csvContent += "Загальна статистика:\n";
      csvContent += `Всього занять,${stats.totalClasses}\n`;
      csvContent += `Присутність,${stats.presentCount}\n`;
      csvContent += `Відсутність,${stats.absentCount}\n`;
      csvContent += `Відсоток відвідуваності,${stats.attendancePercentage}%\n\n`;
      
      // Додаємо статистику по предметах
      csvContent += "Статистика по предметах:\n";
      csvContent += "Предмет,Всього занять,Присутність,Відсутність,Відсоток\n";
      
      stats.subjectStats.forEach(subjectStat => {
        csvContent += `${subjectStat.name},${subjectStat.total},${subjectStat.present},${subjectStat.absent},${subjectStat.percentage}%\n`;
      });
      
      // Створюємо посилання для завантаження і клікаємо по ньому
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `attendance_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Помилка завантаження звіту:', err);
      setError(`Помилка завантаження звіту: ${err.message}`);
    }
  };
  
  return (
    <div>
      {showTitle && (
        <h2 className="text-xl font-bold mb-4">Звіт відвідуваності</h2>
      )}
      
      {error && <ErrorAlert message={error} />}
      
      {/* Фільтри звіту */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Предмет
            </label>
            <select 
              name="subject"
              value={selectedSubject}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Всі предмети</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Початкова дата
            </label>
            <input 
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Кінцева дата
            </label>
            <input 
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      
      {/* Відображення статистики */}
      {loading ? (
        <LoadingIndicator />
      ) : stats ? (
        <div className="space-y-6">
          {/* Загальна статистика */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">Загальна відвідуваність</p>
                  <p className="text-2xl font-bold">{stats.attendancePercentage}%</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Percent className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="mt-2">
                <div className="bg-gray-200 h-2 rounded-full">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${stats.attendancePercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">Всього занять</p>
                  <p className="text-2xl font-bold">{stats.totalClasses}</p>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Calendar className="w-8 h-8 text-purple-500" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                За обраний період
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">Присутність</p>
                  <p className="text-2xl font-bold">{stats.presentCount}</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <ArrowUpRight className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <p className="text-xs text-green-500 mt-2">
                {Math.round(stats.presentCount / stats.totalClasses * 100)}% від загальної кількості
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">Пропуски</p>
                  <p className="text-2xl font-bold">{stats.absentCount}</p>
                </div>
                <div className="p-2 bg-red-50 rounded-lg">
                  <ArrowDownRight className="w-8 h-8 text-red-500" />
                </div>
              </div>
              <p className="text-xs text-red-500 mt-2">
                {Math.round(stats.absentCount / stats.totalClasses * 100)}% від загальної кількості
              </p>
            </div>
          </div>
          
          {/* Статистика по предметах */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-medium">Статистика за предметами</h3>
              <button
                onClick={handleDownloadReport}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center text-sm"
              >
                <Download className="w-4 h-4 mr-1" />
                Звіт
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Предмет
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Всього занять
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Присутність
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Пропуски
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Відсоток
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.subjectStats.map((subjectStat) => (
                    <tr key={subjectStat.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {subjectStat.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {subjectStat.total}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {subjectStat.present}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          {subjectStat.absent}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        <div className="flex items-center justify-center">
                          <div className="bg-gray-200 h-2 w-24 rounded-full mr-2">
                            <div 
                              className={`h-2 rounded-full ${
                                parseFloat(subjectStat.percentage) >= 80 ? 'bg-green-500' :
                                parseFloat(subjectStat.percentage) >= 60 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${subjectStat.percentage}%` }}
                            ></div>
                          </div>
                          <span>{subjectStat.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {stats.subjectStats.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                        Немає даних про відвідування предметів за вказаний період
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Рекомендації */}
          {parseFloat(stats.attendancePercentage) < 75 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Увага!</strong> Ваша загальна відвідуваність нижче 75%. Це може вплинути на вашу підсумкову оцінку.
                    Рекомендуємо приділити більше уваги відвідуванню занять.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          <BarChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p>Немає даних про відвідування за вказаний період</p>
        </div>
      )}
    </div>
  );
}