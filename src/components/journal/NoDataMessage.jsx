import React from 'react';
import { Calendar, Plus } from 'lucide-react';

export function NoDataMessage({ canEdit, addNewDay }) {
  return (
    <div className="p-8 text-center text-gray-500">
      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <p>Немає даних відвідування за цей місяць</p>
      {canEdit && (
        <button
          onClick={addNewDay}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Додати перший день
        </button>
      )}
    </div>
  );
}