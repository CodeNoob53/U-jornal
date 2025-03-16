import React, { useState, useEffect } from 'react';
import { DataService } from '../../services/DataService';

export function AttendanceSection() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setLoading(true);
        const subjectsData = await DataService.getSubjects();
        setSubjects(subjectsData);
      } catch (err) {
        console.error('Помилка завантаження предметів:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, []);

  return (
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
  );
}