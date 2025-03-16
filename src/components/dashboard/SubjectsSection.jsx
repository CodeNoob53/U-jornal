import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { DataService } from '../../services/DataService';
import { LoadingIndicator } from '../common/LoadingIndicator';
import { ErrorAlert } from '../common/ErrorAlert';

export function SubjectsSection({ userRole }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const subjectsData = await DataService.getSubjects();
        setSubjects(subjectsData);
      } catch (err) {
        setError(`Помилка завантаження предметів: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  if (loading) return <LoadingIndicator />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Управління предметами</h1>
      {error && <ErrorAlert message={error} />}
      
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
  );
}