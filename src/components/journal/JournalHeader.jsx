import React from 'react';
import { 
  ArrowLeft, ArrowRight, Edit, Save, X, 
  Plus, Download, Loader2 
} from 'lucide-react';

export function JournalHeader({
  currentMonth,
  currentYear,
  changeMonth,
  isEditing,
  setIsEditing,
  canEdit,
  newDate,
  setNewDate,
  addNewDay,
  saveAttendanceChanges,
  isSaving,
  exportJournal
}) {
  // Отримання назви місяця українською
  const getMonthName = (month) => {
    const monthNames = [
      'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
      'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
    ];
    return monthNames[month];
  };

  return (
    <div className="bg-gray-50 p-4 border-b flex flex-wrap justify-between items-center">
      <div className="flex items-center space-x-4">
        {/* Навігація по місяцях */}
        <button 
          onClick={() => changeMonth(-1)}
          className="p-2 rounded hover:bg-gray-200"
          title="Попередній місяць"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <h3 className="text-lg font-medium">
          {getMonthName(currentMonth)} {currentYear}
        </h3>
        
        <button 
          onClick={() => changeMonth(1)}
          className="p-2 rounded hover:bg-gray-200"
          title="Наступний місяць"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
      
      {/* Кнопки управління */}
      <div className="flex space-x-2 mt-2 sm:mt-0">
        {canEdit && (
          <>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 flex items-center"
              >
                <Edit className="w-4 h-4 mr-1" />
                Редагувати
              </button>
            ) : (
              <>
                <button
                  onClick={saveAttendanceChanges}
                  disabled={isSaving}
                  className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 flex items-center"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Зберігаю...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1" />
                      Зберегти
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 flex items-center"
                >
                  <X className="w-4 h-4 mr-1" />
                  Скасувати
                </button>
              </>
            )}
            
            <div className="flex items-center">
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="border border-gray-300 rounded-l px-3 py-2"
              />
              <button
                onClick={addNewDay}
                disabled={isSaving}
                className="bg-purple-600 text-white px-3 py-2 rounded-r hover:bg-purple-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Новий день
              </button>
            </div>
          </>
        )}
        
        <button
          onClick={exportJournal}
          className="bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700 flex items-center"
        >
          <Download className="w-4 h-4 mr-1" />
          Експорт
        </button>
      </div>
    </div>
  );
}