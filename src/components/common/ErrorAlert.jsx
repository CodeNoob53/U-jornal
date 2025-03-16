// src/components/common/ErrorAlert.jsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function ErrorAlert({ message }) {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
      <div className="flex items-center">
        <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
        <p className="text-red-700">{message}</p>
      </div>
    </div>
    );
}