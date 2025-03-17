import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, AlertTriangle, BookOpen, GraduationCap, Users } from 'lucide-react'; // <-- added BookOpen, GraduationCap, Users
import { DataService } from '../../services/DataService';
import { LoadingIndicator } from '../common/LoadingIndicator';
import { ErrorAlert } from '../common/ErrorAlert';
import { UserModal } from '../common/UserModal';
import { UserEditModal } from '../common/UserEditModal';
import { StudentGroupModal } from '../common/StudentGroupModal'; // <-- added import
import { supabase } from '../../lib/supabase';

export function UsersSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);           // <-- new state
  const [isStudentGroupModalOpen, setIsStudentGroupModalOpen] = useState(false); // <-- new state
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Завантаження користувачів при першому рендері
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const userData = await DataService.getUsers();
      setUsers(userData);
    } catch (err) {
      setError(`Помилка завантаження користувачів: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Обробник для відкриття модального вікна
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  // Обробник для закриття модального вікна
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Обробник для оновлення списку користувачів після додавання нового
  const handleUserAdded = async () => {
    await fetchUsers();
  };

  // Обробник для видалення користувача
  const handleDeleteUser = async (userId, userEmail) => {
    // Показати підтвердження видалення
    if (!deleteConfirm || deleteConfirm.id !== userId) {
      setDeleteConfirm({ id: userId, email: userEmail });
      return;
    }

    try {
      setIsDeleting(true);
      
      // Видалення з таблиці users
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
        
      if (userError) throw userError;
      
      // Видалення з auth.users - це має робити адміністратор Supabase або через серверну функцію
      // Тут ми просто оновлюємо локальний стан
      setUsers(users.filter(user => user.id !== userId));
      setDeleteConfirm(null);
      
    } catch (err) {
      setError(`Помилка видалення користувача: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Скасувати підтвердження видалення
  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  // Функція для відкриття модального вікна групи студента
  const handleManageStudentGroup = (student) => {
    setSelectedStudent(student);
    setIsStudentGroupModalOpen(true);
  };

  // Функція для закриття модального вікна групи студента
  const handleCloseStudentGroupModal = () => {
    setIsStudentGroupModalOpen(false);
  };

  // Додаємо обробник редагування користувача
  const handleEditUser = (user) => {
    setSelectedUserForEdit(user);
    setIsEditModalOpen(true);
  };

  // Додаємо обробник закриття модального вікна
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUserForEdit(null);
  };

  // Додаємо обробник збереження змін
  const handleUserUpdated = async () => {
    await fetchUsers();
    setIsEditModalOpen(false);
    setSelectedUserForEdit(null);
  };

  if (loading && users.length === 0) return <LoadingIndicator />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Управління користувачами</h1>
      {error && <ErrorAlert message={error} />}
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex justify-between items-center">
          <button 
            onClick={handleOpenModal}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Додати користувача
          </button>
          
          <div className="text-gray-500 text-sm flex items-center">
            <AlertTriangle className="w-4 h-4 mr-1 text-amber-500" />
            <span>Видалення користувача не видаляє його з системи аутентифікації.</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ім'я
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Роль
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дії
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className={deleteConfirm && deleteConfirm.id === user.id ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {`${user.last_name || ''} ${user.first_name || ''} ${user.middle_name || ''}`.trim()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'student' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'admin' ? 'Адміністратор' :
                         user.role === 'teacher' ? 'Викладач' :
                         user.role === 'student' ? 'Студент' :
                         user.role === 'parent' ? 'Батьки' : 
                         user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {deleteConfirm && deleteConfirm.id === user.id ? (
                        <div className="flex items-center">
                          <span className="text-red-600 mr-2">Підтвердіть видалення?</span>
                          <button 
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-900 mr-2 disabled:opacity-50"
                          >
                            Так
                          </button>
                          <button 
                            onClick={cancelDelete}
                            disabled={isDeleting}
                            className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                          >
                            Ні
                          </button>
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleEditUser(user)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4 flex items-center"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Редагувати
                          </button>
                          {user.role === 'student' && ( // <-- new button for student
                            <button 
                              onClick={() => handleManageStudentGroup(user)}
                              className="text-green-600 hover:text-green-900 mr-4 flex items-center"
                            >
                              <GraduationCap className="w-4 h-4 mr-1" />
                              Група
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            className="text-red-600 hover:text-red-900 flex items-center"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Видалити
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    Немає користувачів для відображення
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальне вікно для додавання користувача */}
      <UserModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onUserAdded={handleUserAdded} 
      />

      {/* Модальне вікно для призначення групи студенту */}
      {selectedStudent && (
        <StudentGroupModal 
          isOpen={isStudentGroupModalOpen} 
          onClose={handleCloseStudentGroupModal} 
          studentId={selectedStudent.id}
          studentName={selectedStudent.full_name}
        />
      )}

      {/* Модальне вікно для редагування користувача */}
      {selectedUserForEdit && (
        <UserEditModal 
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onUserUpdated={handleUserUpdated}
          user={selectedUserForEdit}
        />
      )}
    </div>
  );
}