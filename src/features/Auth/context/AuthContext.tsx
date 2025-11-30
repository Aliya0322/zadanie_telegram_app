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
    const checkAuth = async (attemptNumber = 1, maxAttempts = 4) => {
      // Критичное логирование - видно в production
      console.log(`[Auth] Attempt ${attemptNumber}/${maxAttempts} - Checking authentication...`);
      
      // Проверяем авторизацию через API с Telegram initData
      // Используем telegram_id из initDataUnsafe как надежный идентификатор
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const webApp = window.Telegram.WebApp;
        
        // Получаем telegram_id из initDataUnsafe (всегда доступен в Telegram WebApp)
        const telegramId = webApp.initDataUnsafe?.user?.id;
        
        // Критичное логирование - видно в production
        console.log('[Auth] Telegram WebApp detected:', {
          hasTelegramWebApp: true,
          telegramId: telegramId || 'NOT FOUND',
          platform: webApp.platform || 'unknown',
          version: webApp.version || 'unknown',
        });
        
        // Детальное логирование для development
        if (import.meta.env.DEV) {
          console.log(`[AuthContext] Checking authentication (attempt ${attemptNumber})...`, {
            hasTelegramWebApp: true,
            telegramId: telegramId || 'not found',
            platform: webApp.platform,
            version: webApp.version,
            userAgent: navigator.userAgent,
          });
        }
        
        // Если есть telegram_id, всегда пытаемся авторизоваться через API
        // apiClient сам найдет initData через getTelegramInitData() из всех возможных источников
        if (telegramId) {
          try {
            console.log('[Auth] Calling getCurrentUser() API...');
            
            // Пытаемся получить информацию о пользователе через API
            // apiClient автоматически добавит initData в заголовок X-Telegram-Init-Data
            // если он доступен в любом из источников (webApp.initData, URL параметры и т.д.)
            const currentUser = await getCurrentUser();
            
            console.log('[Auth] ✅ API call successful, user found:', {
              userId: currentUser.id,
              telegramId: currentUser.telegramId,
              role: currentUser.role,
            });
            
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
            
            if (import.meta.env.DEV) {
              console.log('[AuthContext] ✅ User authenticated successfully:', {
                userId: contextUser.id,
                telegramId: contextUser.telegramId,
                role: contextUser.role,
                attempt: attemptNumber,
              });
            }
            
            setIsLoading(false);
            return;
          } catch (error: any) {
            // Критичное логирование ошибки - видно в production
            console.error('[Auth] ❌ API call failed:', {
              attempt: attemptNumber,
              error: error?.message || 'Unknown error',
              status: error?.response?.status || 'N/A',
              statusText: error?.response?.statusText || 'N/A',
              data: error?.response?.data || 'N/A',
            });
            
            // Детальное логирование для development
            if (import.meta.env.DEV) {
              console.log(`[AuthContext] ❌ Auth attempt ${attemptNumber} failed:`, {
                error: error?.message,
                status: error?.response?.status,
                statusText: error?.response?.statusText,
                fullError: error,
              });
            }
            
            // Если не последняя попытка, пробуем еще раз
            // Увеличиваем задержку с каждой попыткой: 500ms, 1000ms, 1500ms
            if (attemptNumber < maxAttempts) {
              const delay = attemptNumber * 500;
              console.log(`[Auth] Retrying authentication in ${delay}ms (attempt ${attemptNumber + 1}/${maxAttempts})...`);
              
              setTimeout(() => {
                checkAuth(attemptNumber + 1, maxAttempts);
              }, delay);
              return;
            } else {
              console.error('[Auth] ❌ All authentication attempts failed');
            }
          }
        } else {
          // Если нет telegram_id, ждем немного и пробуем еще раз (SDK может загружаться)
          if (attemptNumber < maxAttempts) {
            const delay = attemptNumber * 500;
            console.log(`[Auth] No telegram_id yet, waiting ${delay}ms (attempt ${attemptNumber + 1}/${maxAttempts})...`);
            
            setTimeout(() => {
              checkAuth(attemptNumber + 1, maxAttempts);
            }, delay);
            return;
          } else {
            console.error('[Auth] ❌ No telegram_id found after all attempts');
          }
        }
      } else {
        // Если Telegram WebApp не доступен сразу, ждем и пробуем еще раз
        if (attemptNumber < maxAttempts) {
          const delay = attemptNumber * 500;
          console.log(`[Auth] Telegram WebApp not available yet, waiting ${delay}ms (attempt ${attemptNumber + 1}/${maxAttempts})...`);
          
          setTimeout(() => {
            checkAuth(attemptNumber + 1, maxAttempts);
          }, delay);
          return;
        } else {
          console.error('[Auth] ❌ Telegram WebApp not available after all attempts');
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

