import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DataService } from '../../services/DataService';

export function StudentGroupModal({ isOpen, onClose, studentId, studentName }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [currentGroup, setCurrentGroup] = useState(null);
  
  // Завантаження груп
  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !studentId) return;
      
      try {
        setLoading(true);
        setError('');
        setSuccess('');
        
        // Отримання всіх груп
        const { data: groupsData, error: groupsError } = await supabase
          .from('student_groups')
          .select('*, departments(name)')
          .order('name');
          
        if (groupsError) throw groupsError;
        setGroups(groupsData || []);
        
        // Отримання поточної групи студента
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*, group:student_groups(*)')
          .eq('user_id', studentId)
          .single();
          
        if (studentError && studentError.code !== 'PGRST116') { // PGRST116 - запис не знайдено
          throw studentError;
        }
        
        if (studentData) {
          setCurrentGroup(studentData.group);
          setSelectedGroup(studentData.group_id);
        }
        
      } catch (err) {
        console.error("Помилка завантаження даних:", err);
        setError(`Помилка завантаження даних: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isOpen, studentId]);
  
  // Обробка зміни вибору групи
  const handleGroupChange = (e) => {
    setSelectedGroup(e.target.value);
  };
  
  // Обробка призначення групи
  const handleAssignGroup = async (e) => {
    e.preventDefault();
    
    if (!selectedGroup) {
      setError('Будь ласка, виберіть групу');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');
      
      // Перевірка, чи вже існує запис для цього студента
      const { data: existingStudent, error: checkError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', studentId);
        
      if (checkError) throw checkError;
      
      if (existingStudent && existingStudent.length > 0) {
        // Оновлення існуючого запису
        const { error: updateError } = await supabase
          .from('students')
          .update({ group_id: selectedGroup })
          .eq('user_id', studentId);
          
        if (updateError) throw updateError;
      } else {
        // Створення нового запису
        const { error: insertError } = await supabase
          .from('students')
          .insert([{
            user_id: studentId,
            group_id: selectedGroup,
            student_id_number: `ST${Math.floor(Math.random() * 10000)}`, // Генеруємо випадковий номер
            date_of_birth: new Date().toISOString().split('T')[0], // Поточна дата
            parent_name: 'Не вказано',
            parent_phone: 'Не вказано',
            parent_email: 'Не вказано'
          }]);
          
        if (insertError) throw insertError;
      }
      
      // Оновлення даних в інтерфейсі
      const selectedGroupData = groups.find(g => g.id === selectedGroup);
      setCurrentGroup(selectedGroupData);
      setSuccess('Групу успішно призначено');
      
    } catch (err) {
      console.error("Помилка призначення групи:", err);
      setError(`Помилка призначення групи: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Призначення групи: {studentName}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded">
              {success}
            </div>
          )}
          
          {loading ? (
            <div className="py-4 text-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Завантаження...
            </div>
          ) : (
            <>
              {currentGroup && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
                  <h3 className="text-sm font-medium text-blue-700 mb-1">Поточна група:</h3>
                  <p className="text-blue-800 font-semibold">
                    {currentGroup.name}
                    {currentGroup.departments?.name && (
                      <span className="font-normal text-sm ml-2">
                        ({currentGroup.departments.name})
                      </span>
                    )}
                  </p>
                </div>
              )}
              
              <form onSubmit={handleAssignGroup}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Група
                  </label>
                  <select
                    value={selectedGroup}
                    onChange={handleGroupChange}
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
                
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded mr-2 hover:bg-gray-200"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedGroup}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Збереження...
                      </>
                    ) : (
                      'Призначити групу'
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}