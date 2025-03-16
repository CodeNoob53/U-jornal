import React, { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { DataService } from '../../services/DataService';
import { LoadingIndicator } from '../common/LoadingIndicator';
import { ErrorAlert } from '../common/ErrorAlert';

export function FacultiesSection() {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newFacultyName, setNewFacultyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        setLoading(true);
        const facultiesData = await DataService.getFaculties();
        setFaculties(facultiesData);
      } catch (err) {
        setError(`Помилка завантаження факультетів: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchFaculties();
  }, []);

  const handleAddFaculty = async (e) => {
    e.preventDefault();
    if (!newFacultyName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const newFaculty = await DataService.createFaculty(newFacultyName);
      setFaculties([...faculties, newFaculty]);
      setNewFacultyName('');
    } catch (err) {
      setError(`Помилка додавання факультету: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && faculties.length === 0) return <LoadingIndicator />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Управління факультетами</h1>
      {error && <ErrorAlert message={error} />}
      
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
  );
}