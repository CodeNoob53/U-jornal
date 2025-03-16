import React from 'react';
import { Users, GraduationCap, BookOpen } from 'lucide-react';

export function OverviewSection({ stats }) {
  return (
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
  );
}