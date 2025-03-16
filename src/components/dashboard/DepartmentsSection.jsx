import React, { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { DataService } from '../../services/DataService';
import { LoadingIndicator } from '../common/LoadingIndicator';
import { ErrorAlert } from '../common/ErrorAlert';

export function DepartmentsSection() {
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [facultiesData, departmentsData] = await Promise.all([
          DataService.getFaculties(),
          DataService.getDepartments()
        ]);
        setFaculties(facultiesData);
        setDepartments(departmentsData);
      } catch (err) {
        setError(`Помилка завантаження даних: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  if (loading && departments.length === 0) return <LoadingIndicator />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Управління кафедрами</h1>
      {error && <ErrorAlert message={error} />}
      
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
  );
}