import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { signOutUser } from '@/features/authentication/services/authService';
import { Dumbbell, Target } from 'lucide-react';


const Navbar: React.FC = () => {
  const { user } = useAuth();


  const handleLogout = async () => {
    console.log('[Navbar] Attempting logout...');
    const { error } = await signOutUser();
    if (error) {
      console.error('[Navbar] Logout error:', error);


    } else {
      console.log('[Navbar] Logout successful.');


    }
  };

  return (
    <nav className="bg-background border-b ">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-semibold text-foreground hover:text-primary transition-colors">
              multitraining
            </Link>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
            <NavLink
              to="/workout"
              end
              className={({ isActive }) =>
                `p-2 sm:p-3 rounded-md transition-colors ${
                  isActive
                    ? 'bg-accent text-muted-background navlink-subtle-active'
                    : 'text-muted-background hover:text-muted-background hover:bg-accent'
                }`
              }
              title="Workout"
            >
              <div className="flex items-center space-x-2">
                <Dumbbell className="h-5 w-5" />
                <span className="hidden md:inline text-sm font-medium">Workout</span>
              </div>
            </NavLink>
            <NavLink
              to="/goals"
              className={({ isActive }) =>
                `p-2 sm:p-3 rounded-md transition-colors ${
                  isActive
                    ? 'bg-accent text-muted-background navlink-subtle-active'
                    : 'text-muted-background hover:text-muted-background hover:bg-accent'
                }`
              }
              title="Metas"
            >
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span className="hidden md:inline text-sm font-medium">Metas</span>
              </div>
            </NavLink>
          </div>
          <div className="flex items-center">
            {user && (
              <span className="text-sm text-muted-foreground mr-3 hidden sm:inline">
                {user.email}
              </span>
            )}
            <Button onClick={handleLogout} variant="outline" size="sm">
              Cerrar Sesión
            </Button>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;