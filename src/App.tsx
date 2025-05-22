import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginSignup } from "./features/authentication";
import { GoalsManagementPage } from './features/goalsManagement';
import { WorkoutPage } from './features/workoutExecution';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { Toaster } from '@/components/ui/sonner';
import './index.css';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <p className="text-lg text-muted-foreground">Cargando aplicación...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {user && <Navbar />}
      <div className="container mx-auto p-4.5 sm:p-6 lg:p-8 flex flex-col flex-grow">
        <main className="flex-grow">
          <Routes>
            {!user ? (
              <Route path="/login" element={<LoginSignup />} />
            ) : (
              <>
                <Route path="/" element={<Navigate to="/goals" replace />} />
                <Route path="/goals" element={<GoalsManagementPage />} />
                <Route path="/workout" element={<WorkoutPage />} />
              </>
            )}
            <Route path="*" element={
              user ? 
              <Navigate to="/goals" replace /> : 
              <Navigate to="/login" replace />
            } />
          </Routes>
        </main>
      </div>
      <Toaster position="bottom-center" />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;