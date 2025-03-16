// src/components/common/LoadingIndicator.jsx
import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingIndicator() {
  return (
    <div className="flex justify-center items-center p-8">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      <span className="ml-2 text-gray-600">Завантаження даних...</span>
    </div>
  );
}