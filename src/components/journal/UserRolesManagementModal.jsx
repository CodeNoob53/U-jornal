import React, { useState, useEffect } from 'react';
import { DataService } from '../../services/DataService';
import { supabase } from '../../lib/supabase';
import { X, Loader2, Check, Shield, GraduationCap, Building, UserCheck } from 'lucide-react';
import { LoadingIndicator } from '../common/LoadingIndicator';
import { ErrorAlert } from '../common/ErrorAlert';

export function UserRolesManagementModal({ isOpen, onClose, userId, userName }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [userRoles, setUserRoles] = useState({
    is_dean: false,
    is_vice_dean: false,
    is_curator: false,
    is_group_leader: false,
    faculty_id: '',
    department_id: '',
    group_id: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');
  
  // Завантаження даних для вибору
  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !userId) return;
      
      try {
        setLoading(true);
        setError('');
        setSuccess('');
        
        // Завантаження факультетів
        const facultiesData = await DataService.getFaculties();
        setFaculties(facultiesData);
        
        // Завантаження розширених ролей користувача
        try {
          const userRolesData = await DataService.getUserExtendedRoles(userId);
          
          if (userRolesData) {
            setUserRoles({
              is_dean: userRolesData.is_dean || false,
              is_vice_dean: userRolesData.is_vice_dean || false,
              is_curator: userRolesData.is_curator || false,
              is_group_leader: userRolesData.is_group_leader || false,
              faculty_id: userRolesData.faculty_id || '',
              department_id: userRolesData.department_id || '',
              group_id: userRolesData.group_id || ''
            });
            
            // Якщо є вибраний факультет, завантажуємо його кафедри
            if (userRolesData.faculty_id) {
              const departmentsData = await DataService.getDepartments(userRolesData.faculty_id);
              setDepartments(departmentsData);
            }
            
            // Якщо є вибрана кафедра, завантажуємо її групи
            if (userRolesData.department_id) {
              const { data: groupsData } = await supabase
                .from('student_groups')
                .select('*')
                .eq('department_id', userRolesData.department_id)
                .order('name');
                
              setGroups(groupsData || []);
            }
          }
        } catch (error) {
          console.log('Записи розширених ролей не знайдено, це нормально для нового користувача');
        }
        
      } catch (err) {
        console.error("Помилка завантаження даних:", err);
        setError(`Помилка завантаження даних: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isOpen, userId]);
  
  // Завантаження кафедр при зміні факультету
  useEffect(() => {
    const loadDepartments = async () => {
      if (!userRoles.faculty_id) {
        setDepartments([]);
        setUserRoles(prev => ({
          ...prev,
          department_id: '',
          group_id: ''
        }));
        return;
      }
      
      try {
        setLoading(true);
        const departmentsData = await DataService.getDepartments(userRoles.faculty_id);
        setDepartments(departmentsData);
        setLoading(false);
      } catch (err) {
        console.error("Помилка завантаження кафедр:", err);
        setError(`Помилка завантаження кафедр: ${err.message}`);
        setLoading(false);
      }
    };
    
    loadDepartments();
  }, [userRoles.faculty_id]);
  
  // Завантаження груп при зміні кафедри
  useEffect(() => {
    const loadGroups = async () => {
      if (!userRoles.department_id) {
        setGroups([]);
        setUserRoles(prev => ({
          ...prev,
          group_id: ''
        }));
        return;
      }
      
      try {
        setLoading(true);
        const { data: groupsData } = await supabase
          .from('student_groups')
          .select('*')
          .eq('department_id', userRoles.department_id)
          .order('name');
          
        setGroups(groupsData || []);
        setLoading(false);
      } catch (err) {
        console.error("Помилка завантаження груп:", err);
        setError(`Помилка завантаження груп: ${err.message}`);
        setLoading(false);
      }
    };
    
    loadGroups();
  }, [userRoles.department_id]);
  
  // Обробка зміни значень
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setUserRoles(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Збереження змін
  const handleSaveRoles = async (e) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');
      
      // Валідація даних перед збереженням
      if (userRoles.is_dean && !userRoles.faculty_id) {
        setError('Для декана необхідно вибрати факультет');
        setIsSaving(false);
        return;
      }
      
      if (userRoles.is_vice_dean && !userRoles.faculty_id) {
        setError('Для заступника декана необхідно вибрати факультет');
        setIsSaving(false);
        return;
      }
      
      if (userRoles.is_curator && !userRoles.group_id) {
        setError('Для куратора необхідно вибрати групу');
        setIsSaving(false);
        return;
      }
      
      if (userRoles.is_group_leader && !userRoles.group_id) {
        setError('Для старости необхідно вибрати групу');
        setIsSaving(false);
        return;
      }
      
      // Підготовка даних для збереження
      const roleData = {
        is_dean: userRoles.is_dean,
        is_vice_dean: userRoles.is_vice_dean,
        is_curator: userRoles.is_curator,
        is_group_leader: userRoles.is_group_leader,
        faculty_id: userRoles.faculty_id || null,
        department_id: userRoles.department_id || null,
        group_id: userRoles.group_id || null
      };
      
      // Збереження розширених ролей
      await DataService.assignUserRole(userId, roleData);
      
      setSuccess('Ролі користувача успішно оновлено');
      
      // Закриваємо модальне вікно через 2 секунди
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err) {
      console.error("Помилка збереження ролей:", err);
      setError(`Помилка збереження ролей: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Управління ролями: {userName}
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
            <LoadingIndicator />
          ) : (
            <form onSubmit={handleSaveRoles}>
              <div className="space-y-6">
                {/* Розділ для адміністративних ролей */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Адміністративні ролі</h3>
                  
                  <div className="space-y-4">
                    {/* Роль декана */}
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="is_dean"
                          name="is_dean"
                          type="checkbox"
                          checked={userRoles.is_dean}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="is_dean" className="font-medium flex items-center">
                          <Shield className="w-4 h-4 mr-2 text-blue-600" />
                          Декан
                        </label>
                        <p className="text-sm text-gray-500">
                          Може переглядати журнали всіх груп свого факультету.
                        </p>
                      </div>
                    </div>
                    
                    {/* Роль заступника декана */}
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="is_vice_dean"
                          name="is_vice_dean"
                          type="checkbox"
                          checked={userRoles.is_vice_dean}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="is_vice_dean" className="font-medium flex items-center">
                          <Shield className="w-4 h-4 mr-2 text-green-600" />
                          Заступник декана
                        </label>
                        <p className="text-sm text-gray-500">
                          Має такий самий доступ, як і декан.
                        </p>
                      </div>
                    </div>
                    
                    {/* Вибір факультету для декана/заступника */}
                    {(userRoles.is_dean || userRoles.is_vice_dean) && (
                      <div className="mt-4 ml-7">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Факультет
                        </label>
                        <select
                          name="faculty_id"
                          value={userRoles.faculty_id}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required={userRoles.is_dean || userRoles.is_vice_dean}
                        >
                          <option value="">Виберіть факультет</option>
                          {faculties.map(faculty => (
                            <option key={faculty.id} value={faculty.id}>
                              {faculty.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Розділ для ролей в групі */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Ролі по роботі з групою</h3>
                  
                  <div className="space-y-4">
                    {/* Роль куратора */}
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="is_curator"
                          name="is_curator"
                          type="checkbox"
                          checked={userRoles.is_curator}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="is_curator" className="font-medium flex items-center">
                          <GraduationCap className="w-4 h-4 mr-2 text-purple-600" />
                          Куратор
                        </label>
                        <p className="text-sm text-gray-500">
                          Має доступ до журналу відвідування своєї групи з усіх дисциплін.
                        </p>
                      </div>
                    </div>
                    
                    {/* Роль старости */}
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="is_group_leader"
                          name="is_group_leader"
                          type="checkbox"
                          checked={userRoles.is_group_leader}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="is_group_leader" className="font-medium flex items-center">
                          <UserCheck className="w-4 h-4 mr-2 text-amber-600" />
                          Староста
                        </label>
                        <p className="text-sm text-gray-500">
                          Може редагувати журнал відвідування своєї групи та друкувати його.
                        </p>
                      </div>
                    </div>
                    
                    {/* Вибір кафедри і групи для куратора/старости */}
                    {(userRoles.is_curator || userRoles.is_group_leader) && (
                      <div className="mt-4 ml-7 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Факультет
                          </label>
                          <select
                            name="faculty_id"
                            value={userRoles.faculty_id}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required={userRoles.is_curator || userRoles.is_group_leader}
                          >
                            <option value="">Виберіть факультет</option>
                            {faculties.map(faculty => (
                              <option key={faculty.id} value={faculty.id}>
                                {faculty.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Кафедра
                          </label>
                          <select
                            name="department_id"
                            value={userRoles.department_id}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required={userRoles.is_curator || userRoles.is_group_leader}
                            disabled={!userRoles.faculty_id}
                          >
                            <option value="">Виберіть кафедру</option>
                            {departments.map(department => (
                              <option key={department.id} value={department.id}>
                                {department.name}
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
                            value={userRoles.group_id}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required={userRoles.is_curator || userRoles.is_group_leader}
                            disabled={!userRoles.department_id}
                          >
                            <option value="">Виберіть групу</option>
                            {groups.map(group => (
                              <option key={group.id} value={group.id}>
                                {group.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Збереження...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Зберегти ролі
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}