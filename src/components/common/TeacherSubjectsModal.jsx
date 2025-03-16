import React, { useState, useEffect } from 'react';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DataService } from '../../services/DataService';

export function TeacherSubjectsModal({ isOpen, onClose, teacherId, teacherName }) {
  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Форма для додавання нового предмету
  const [formData, setFormData] = useState({
    subject_id: '',
    group_id: '',
    semester: 1,
    academic_year: new Date().getFullYear().toString()
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Завантаження даних
  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !teacherId) return;
      
      try {
        setLoading(true);
        
        // Завантаження всіх предметів
        const subjectsData = await DataService.getSubjects();
        setSubjects(subjectsData);
        
        // Завантаження всіх груп
        const { data: groupsData, error: groupsError } = await supabase
          .from('student_groups')
          .select('*, departments(name)')
          .order('name');
          
        if (groupsError) throw groupsError;
        setGroups(groupsData || []);
        
        // Завантаження предметів, які викладач вже викладає
        const { data: teacherData, error: teacherError } = await supabase
          .from('teacher_subjects')
          .select('*, subject:subjects(*), group:student_groups(*)')
          .eq('teacher_id', teacherId);
          
        if (teacherError) throw teacherError;
        setTeacherSubjects(teacherData || []);
        
      } catch (err) {
        console.error("Помилка завантаження даних:", err);
        setError(`Помилка завантаження даних: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isOpen, teacherId]);
  
  // Обробка зміни полів форми
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Додавання нового предмету для викладача
  const handleAddSubject = async (e) => {
    e.preventDefault();
    
    // Перевірка, чи всі поля заповнені
    if (!formData.subject_id || !formData.group_id || !formData.semester || !formData.academic_year) {
      setError('Будь ласка, заповніть всі поля');
      return;
    }
    
    // Перевірка, чи такий запис вже існує
    if (teacherSubjects.some(ts => 
      ts.subject_id === formData.subject_id && 
      ts.group_id === formData.group_id && 
      ts.semester === parseInt(formData.semester) && 
      ts.academic_year === formData.academic_year
    )) {
      setError('Такий запис вже існує');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      // Додавання нового запису
      const { data, error } = await supabase
        .from('teacher_subjects')
        .insert([{
          teacher_id: teacherId,
          subject_id: formData.subject_id,
          group_id: formData.group_id,
          semester: parseInt(formData.semester),
          academic_year: formData.academic_year
        }])
        .select('*, subject:subjects(*), group:student_groups(*)');
      
      if (error) throw error;
      
      // Оновлення списку предметів викладача
      setTeacherSubjects([...teacherSubjects, ...data]);
      
      // Очищення форми
      setFormData({
        subject_id: '',
        group_id: '',
        semester: 1,
        academic_year: new Date().getFullYear().toString()
      });
      
    } catch (err) {
      console.error("Помилка додавання предмету:", err);
      setError(`Помилка додавання предмету: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Видалення предмету викладача
  const handleRemoveSubject = async (id) => {
    try {
      const { error } = await supabase
        .from('teacher_subjects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Оновлення списку предметів викладача
      setTeacherSubjects(teacherSubjects.filter(ts => ts.id !== id));
      
    } catch (err) {
      console.error("Помилка видалення предмету:", err);
      setError(`Помилка видалення предмету: ${err.message}`);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Предмети викладача: {teacherName}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 flex-grow overflow-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded">
              {error}
            </div>
          )}
          
          <h3 className="text-lg font-medium mb-4">Додати новий предмет</h3>
          <form onSubmit={handleAddSubject} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Предмет
              </label>
              <select
                name="subject_id"
                value={formData.subject_id}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Виберіть предмет</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Група
              </label>
              <select
                name="group_id"
                value={formData.group_id}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Виберіть групу</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name} - {group.departments?.name || 'Без кафедри'}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Семестр
              </label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="1">1 (Осінній)</option>
                <option value="2">2 (Весняний)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Навчальний рік
              </label>
              <input
                type="text"
                name="academic_year"
                value={formData.academic_year}
                onChange={handleChange}
                placeholder="напр. 2024-2025"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Додавання...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Додати предмет
                  </>
                )}
              </button>
            </div>
          </form>
          
          <h3 className="text-lg font-medium my-4">Поточні предмети викладача</h3>
          
          {loading ? (
            <div className="py-4 text-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Завантаження...
            </div>
          ) : teacherSubjects.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Предмет
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Група
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Сем/Рік
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дії
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teacherSubjects.map((ts) => (
                    <tr key={ts.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {ts.subject?.name || 'Невідомий предмет'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {ts.group?.name || 'Невідома група'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {ts.semester} / {ts.academic_year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleRemoveSubject(ts.id)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center"
                          title="Видалити"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-4 text-center text-gray-500 border rounded-lg">
              Викладач не має призначених предметів
            </div>
          )}
        </div>
        
        <div className="p-4 border-t text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}