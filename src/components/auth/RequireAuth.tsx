import React, { useEffect, useState } from 'react';
import { useUserStore } from '../../stores/userStore';
import { LoginForm } from './LoginForm';

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const currentUser = useUserStore(state => state.currentUser);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur est authentifié
    if (currentUser) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [currentUser]);

  if (!isAuthenticated) {
    return <LoginForm onSuccess={() => setIsAuthenticated(true)} />;
  }

  return <>{children}</>;
}