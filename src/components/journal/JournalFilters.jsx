import React from 'react';

export function JournalFilters({
  userRole,
  isDean,
  isViceDean,
  isCurator,
  isGroupLeader,
  faculties,
  departments,
  groups,
  subjects,
  selectedFaculty,
  selectedDepartment,
  selectedGroup,
  selectedSubject,
  setSelectedFaculty,
  setSelectedDepartment,
  setSelectedGroup,
  setSelectedSubject
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Фільтр факультетів (доступний для адміна, декана і заступників) */}
        {(userRole === 'admin' || isDean() || isViceDean()) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Факультет
            </label>
            <select 
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              disabled={isDean() || isViceDean()}
              className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Виберіть факультет</option>
              {faculties.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Фільтр кафедр (доступний для адміна, декана і заступників) */}
        {(userRole === 'admin' || isDean() || isViceDean()) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Кафедра
            </label>
            <select 
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Всі кафедри</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Фільтр груп (недоступний для студента, куратора і старости, бо вони бачать тільки свою групу) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Група
          </label>
          <select 
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            disabled={userRole === 'student' || isCurator() || isGroupLeader()}
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Виберіть групу</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Фільтр предметів */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Предмет
          </label>
          <select 
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
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
    </div>
  );
}