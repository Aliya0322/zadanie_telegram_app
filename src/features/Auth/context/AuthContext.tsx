import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { getCurrentUser } from '../../../api/authApi';

export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  firstName: string;
  lastName?: string;
  middleName?: string;
  birthDate?: string;
  role: UserRole;
  email?: string;
  telegramId?: string;
  timezone?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Проверяем авторизацию только через API с Telegram initData
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const webApp = window.Telegram.WebApp;
        const initData = (webApp as any).initData || 
                         (webApp as any).initDataRaw ||
                         new URLSearchParams(window.location.search).get('tgWebAppData');
        
        if (initData) {
          try {
            // Пытаемся получить информацию о пользователе через API
            const currentUser = await getCurrentUser();
            // Если пользователь найден, автоматически логиним
            const contextUser = {
              id: currentUser.id,
              firstName: currentUser.firstName,
              lastName: currentUser.lastName,
              middleName: currentUser.middleName,
              birthDate: currentUser.birthDate,
              role: currentUser.role,
              telegramId: currentUser.telegramId,
              timezone: currentUser.timezone,
            };
            setUser(contextUser);
          } catch (error) {
            // Пользователь не зарегистрирован или ошибка - оставляем null
            console.log('User not authenticated or not registered yet');
          }
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = (userData: User, _token: string) => {
    setUser(userData);
    // Не сохраняем в localStorage - используем только Telegram initData для авторизации
  };

  const logout = () => {
    setUser(null);
    // Очищаем localStorage на всякий случай (если там что-то было)
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      // Не сохраняем в localStorage - используем только Telegram initData
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

