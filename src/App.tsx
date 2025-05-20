import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginSignup } from "./features/authentication";
import { GoalsManagementPage } from './features/goalsManagement';
import { WorkoutPage } from './features/workoutExecution';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import { Toaster } from '@/components/ui/sonner';
import './index.css'

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
      <div className="container mx-auto p-4.5 sm:p-6 lg:p-8 flex flex-col flex-grow">

        <main className="flex-grow">
          {!user ? (
            <div className="max-w-md mx-auto">
              <LoginSignup />
            </div>
          ) : (
            <>
              <Navbar />
              <div className="pt-4">
                <Routes>
                  <Route path="/" element={<WorkoutPage />} />
                  <Route path="/goals" element={<GoalsManagementPage />} />


                </Routes>
              </div>


            <Toaster />
          </>
          )}
        </main>

        <footer className="text-center mt-5.5 py-4.5 border-t border-border">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Training App. Todos los derechos reservados.
          </p>
        </footer>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;