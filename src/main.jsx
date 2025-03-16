import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Додаємо глобальні обробники помилок
window.addEventListener('error', (event) => {
  console.error('Глобальна помилка JS:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Необроблена Promise помилка:', event.reason);
});

// Розкоментуйте для тестування з'єднання з Supabase
// import { checkSupabaseConnection } from './lib/supabase';
// checkSupabaseConnection().then(result => {
//   console.log('Supabase connection check:', result);
// });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);