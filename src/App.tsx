import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-blue-600 text-white p-4">
            <div className="container mx-auto flex items-center">
              <GraduationCap className="w-8 h-8 mr-2" />
              <h1 className="text-2xl font-bold">Університетський Журнал</h1>
            </div>
          </nav>
          
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<Dashboard />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;