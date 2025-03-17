import React from 'react';
import { CheckCircle, XCircle, HelpCircle } from 'lucide-react';

export function JournalTable({
  journalDates,
  students,
  userRole,
  user,
  attendanceData,
  isEditing,
  canEdit,
  toggleAttendanceStatus
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="sticky left-0 bg-gray-100 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
              Студент
            </th>
            {journalDates.map(date => (
              <th key={date} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                {new Date(date).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map(student => {
            // Для студентів відображаємо тільки власний запис
            if (userRole === 'student' && student.user_id !== user.id) {
              return null;
            }
            
            return (
              <tr key={student.id} className="border-b hover:bg-gray-50">
                <td className="sticky left-0 bg-white hover:bg-gray-50 px-6 py-4 whitespace-nowrap border-r">
                  {student.user.full_name}
                </td>
                {journalDates.map(date => (
                  <td 
                    key={date} 
                    className={`px-4 py-4 text-center border-r ${isEditing && canEdit ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                    onClick={() => isEditing && canEdit && toggleAttendanceStatus(student.id, date)}
                  >
                    <AttendanceCell 
                      attendance={attendanceData[date]?.[student.id]}
                    />
                  </td>
                ))}
              </tr>
            );
          })}
          
          {students.length === 0 && (
            <tr>
              <td colSpan={journalDates.length + 1} className="px-6 py-4 text-center text-gray-500">
                У вибраній групі немає студентів
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Компонент для відображення статусу відвідуваності
function AttendanceCell({ attendance }) {
  if (!attendance) {
    return <HelpCircle className="w-6 h-6 text-gray-300 mx-auto" />;
  }
  
  return (
    <div className="flex flex-col items-center">
      {attendance.status === 'present' ? (
        <CheckCircle className="w-6 h-6 text-green-600" />
      ) : (
        <XCircle className="w-6 h-6 text-red-600" />
      )}
      {attendance.notes && (
        <span className="text-xs text-gray-500 mt-1">
          {attendance.notes}
        </span>
      )}
    </div>
  );
}