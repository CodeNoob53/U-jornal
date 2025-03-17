import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DataService } from '../../services/DataService';

export function UserEditModal({ isOpen, onClose, onUserUpdated, user }) {
  const [formData, setFormData] = useState({
    email: '',
    last_name: '',
    first_name: '',
    middle_name: '',
    role: '',
    phone: '',
    birth_date: ''
  });
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Заповнення форми даними користувача
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        last_name: user.surname || '', // Використовуємо surname замість last_name
        first_name: user.first_name || '',
        middle_name: user.middle_name || '',
        role: user.role || '',
        phone: user.phone || '',
        birth_date: user.birth_date || ''
      });
    }
  }, [user]);
  
  // Обробка зміни полів форми
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Обробка відправки форми
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      // Підготовка даних для оновлення
      const userData = {
        surname: formData.last_name, // Використовуємо surname замість last_name
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        phone: formData.phone || null,
        birth_date: formData.birth_date || null
      };
      
      // Якщо змінилася роль, оновлюємо її окремо
      if (formData.role !== user.role) {
        await DataService.updateUserRole(user.id, formData.role);
      }
      
      // Оновлення даних користувача
      const { error: updateError } = await supabase
        .from('users')
        .update(userData)
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      // Колбек успішного оновлення
      if (onUserUpdated) {
        await onUserUpdated();
      }
    } catch (err) {
      console.error('Помилка при оновленні користувача:', err);
      setError(`Помилка при оновленні користувача: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Редагування користувача</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled={true} // Email не можна змінити
                className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">Email не можна змінити</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Прізвище
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ім'я
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                По батькові
              </label>
              <input
                type="text"
                name="middle_name"
                value={formData.middle_name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дата народження
              </label>
              <input
                type="date"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Роль
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="student">Студент</option>
                <option value="teacher">Викладач</option>
                <option value="admin">Адміністратор</option>
                <option value="parent">Батьки</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Телефон
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Необов'язкове поле</p>
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
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Збереження...
                </>
              ) : (
                'Зберегти зміни'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}