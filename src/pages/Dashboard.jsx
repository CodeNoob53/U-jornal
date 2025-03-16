import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { DataService } from '../services/DataService';
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  BarChart2,
  LogOut,
  Building,
  Plus,
  Loader2,
  AlertTriangle
} from 'lucide-react';

function Dashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const [userRole, setUserRole] = useState(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Стани для даних
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState({
    usersCount: 0,
    facultiesCount: 0,
    subjectsCount: 0
  });
  
  // Стани для форм
  const [newFacultyName, setNewFacultyName] = useState('');
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    async function getUserRole() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          return;
        }

        setUserRole(data?.role);
      } catch (err) {
        console.error('Failed to fetch user role:', err);
      }
    }

    getUserRole();
  }, [user, navigate]);
  
  // Завантаження даних для поточного розділу
  useEffect(() => {
    async function loadSectionData() {
      setLoading(true);
      setError(null);
      
      try {
        switch (activeSection) {
          case 'overview':
            const stats = await DataService.getDashboardStats();
            setStats(stats);
            break;
            
          case 'users':
            if (userRole === 'admin') {
              const usersData = await DataService.getUsers();
              setUsers(usersData);
            }
            break;
            
          case 'faculties':
            if (userRole === 'admin') {
              const facultiesData = await DataService.getFaculties();
              setFaculties(facultiesData);
            }
            break;
            
          case 'departments':
            if (userRole === 'admin') {
              const facultiesData = await DataService.getFaculties();
              const departmentsData = await DataService.getDepartments();
              setFaculties(facultiesData);
              setDepartments(departmentsData);
            }
            break;
            
          case 'subjects':
            const subjectsData = await DataService.getSubjects();
            setSubjects(subjectsData);
            break;
        }
      } catch (err) {
        console.error(`Error loading data for section ${activeSection}:`, err);
        setError(`Помилка завантаження даних: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    
    if (user && userRole) {
      loadSectionData();
    }
  }, [activeSection, userRole, user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };
  
  // Обробники для форм
  const handleAddFaculty = async (e) => {
    e.preventDefault();
    if (!newFacultyName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const newFaculty = await DataService.createFaculty(newFacultyName);
      setFaculties([...faculties, newFaculty]);
      setNewFacultyName('');
      // Оновимо статистику
      const stats = await DataService.getDashboardStats();
      setStats(stats);
    } catch (err) {
      setError(`Помилка додавання факультету: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!newDepartmentName.trim() || !selectedFacultyId) return;
    
    setIsSubmitting(true);
    try {
      const newDepartment = await DataService.createDepartment(selectedFacultyId, newDepartmentName);
      setDepartments([...departments, newDepartment]);
      setNewDepartmentName('');
      setSelectedFacultyId('');
    } catch (err) {
      setError(`Помилка додавання кафедри: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const menuItems = [
    { id: 'overview', icon: BarChart2, label: 'Огляд' },
    { id: 'users', icon: Users, label: 'Користувачі', adminOnly: true },
    { id: 'faculties', icon: GraduationCap, label: 'Факультети', adminOnly: true },
    { id: 'departments', icon: Building, label: 'Кафедри', adminOnly: true },
    { id: 'subjects', icon: BookOpen, label: 'Предмети' },
    { id: 'attendance', icon: Calendar, label: 'Відвідуваність' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {userRole === 'admin' ? 'Адміністратор' : 
             userRole === 'teacher' ? 'Викладач' :
             userRole === 'student' ? 'Студент' : 
             userRole === 'parent' ? 'Батьки' : 'Користувач'}
          </h2>
          <p className="text-sm text-gray-600">{user?.email}</p>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => {
            if (item.adminOnly && userRole !== 'admin') return null;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 ${
                  activeSection === item.id ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            );
          })}
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-red-700 mt-auto"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Вийти
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          {/* Відображення помилки, якщо вона є */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}
          
          {/* Відображення індикатора завантаження */}
          {loading && (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="ml-2 text-gray-600">Завантаження даних...</span>
            </div>
          )}
          
          {/* Огляд */}
          {activeSection === 'overview' && !loading && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Огляд системи</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-500" />
                    Користувачі
                  </h3>
                  <p className="text-3xl font-bold text-gray-800">{stats.usersCount}</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2 text-green-500" />
                    Факультети
                  </h3>
                  <p className="text-3xl font-bold text-gray-800">{stats.facultiesCount}</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-purple-500" />
                    Предмети
                  </h3>
                  <p className="text-3xl font-bold text-gray-800">{stats.subjectsCount}</p>
                </div>
              </div>
            </div>
          )}

          {/* Користувачі */}
          {activeSection === 'users' && userRole === 'admin' && !loading && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Управління користувачами</h1>
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Додати користувача
                  </button>
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
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.full_name}
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button className="text-indigo-600 hover:text-indigo-900 mr-2">
                                Редагувати
                              </button>
                              <button className="text-red-600 hover:text-red-900">
                                Видалити
                              </button>
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
            </div>
          )}

          {/* Факультети */}
          {activeSection === 'faculties' && userRole === 'admin' && !loading && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Управління факультетами</h1>
              <div className="bg-white rounded-lg shadow mb-6">
                <div className="p-6 border-b">
                  <form onSubmit={handleAddFaculty} className="flex items-center">
                    <input 
                      type="text" 
                      value={newFacultyName}
                      onChange={(e) => setNewFacultyName(e.target.value)}
                      placeholder="Назва факультету"
                      className="flex-1 border border-gray-300 rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700 flex items-center disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      Додати факультет
                    </button>
                  </form>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Назва факультету
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Дата створення
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Дії
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {faculties.length > 0 ? (
                        faculties.map((faculty) => (
                          <tr key={faculty.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {faculty.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {new Date(faculty.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button className="text-indigo-600 hover:text-indigo-900 mr-2">
                                Редагувати
                              </button>
                              <button className="text-red-600 hover:text-red-900">
                                Видалити
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                            Немає факультетів для відображення
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {/* Кафедри */}
          {activeSection === 'departments' && userRole === 'admin' && !loading && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Управління кафедрами</h1>
              <div className="bg-white rounded-lg shadow mb-6">
                <div className="p-6 border-b">
                  <form onSubmit={handleAddDepartment} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Факультет
                      </label>
                      <select 
                        value={selectedFacultyId}
                        onChange={(e) => setSelectedFacultyId(e.target.value)}
                        className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Виберіть факультет</option>
                        {faculties.map((faculty) => (
                          <option key={faculty.id} value={faculty.id}>
                            {faculty.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center">
                      <input 
                        type="text" 
                        value={newDepartmentName}
                        onChange={(e) => setNewDepartmentName(e.target.value)}
                        placeholder="Назва кафедри"
                        className="flex-1 border border-gray-300 rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <button 
                        type="submit" 
                        disabled={isSubmitting || !selectedFacultyId}
                        className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700 flex items-center disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4 mr-2" />
                        )}
                        Додати кафедру
                      </button>
                    </div>
                  </form>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Назва кафедри
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Факультет
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Дії
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {departments.length > 0 ? (
                        departments.map((department) => (
                          <tr key={department.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {department.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {department.faculties?.name || 'Не визначено'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button className="text-indigo-600 hover:text-indigo-900 mr-2">
                                Редагувати
                              </button>
                              <button className="text-red-600 hover:text-red-900">
                                Видалити
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                            Немає кафедр для відображення
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Предмети */}
          {activeSection === 'subjects' && !loading && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Управління предметами</h1>
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  {userRole === 'admin' && (
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center">
                      <Plus className="w-4 h-4 mr-2" />
                      Додати предмет
                    </button>
                  )}
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Назва предмета
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Кафедра
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Кредити
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Дії
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {subjects.length > 0 ? (
                        subjects.map((subject) => (
                          <tr key={subject.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {subject.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {subject.departments?.name || 'Не визначено'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {subject.credits}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button className="text-indigo-600 hover:text-indigo-900 mr-2">
                                Редагувати
                              </button>
                              {userRole === 'admin' && (
                                <button className="text-red-600 hover:text-red-900">
                                  Видалити
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                            Немає предметів для відображення
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Відвідуваність */}
          {activeSection === 'attendance' && !loading && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Відвідуваність</h1>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Група
                    </label>
                    <select 
                      className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Виберіть групу</option>
                      {/* Тут будуть опції груп */}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Предмет
                    </label>
                    <select 
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
                
                <div className="text-center py-8">
                  <p className="text-gray-600">Оберіть групу та предмет для перегляду відвідуваності</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;