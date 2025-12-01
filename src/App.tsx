import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/Auth/context/AuthContext';
import { GroupProvider } from './features/Groups/context/GroupContext';
import logo from './assets/images/logo.png';
import './App.css';

// Lazy loading для всех страниц
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const StudentDashboardPage = lazy(() => import('./pages/StudentDashboardPage'));
const GroupDetailsPage = lazy(() => import('./pages/GroupDetailsPage'));
const NewHomeworkPage = lazy(() => import('./pages/NewHomeworkPage'));

// Компонент загрузки с анимированным логотипом
const LoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <img src={logo} alt="Logo" className="loading-logo" />
    </div>
  </div>
);

// Компонент для защищенных маршрутов
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Режим разработки: проверяем query параметр ?dev=true для обхода защиты
  const isDevMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get('dev') === 'true';

  // Логирование для отладки
  if (import.meta.env.DEV) {
    console.log('[ProtectedRoute] Check:', {
      isLoading,
      isAuthenticated,
      hasUser: !!user,
      userId: user?.id,
      isDevMode,
    });
  }

  // В режиме разработки с ?dev=true пропускаем защиту
  if (isDevMode) {
    console.log('[ProtectedRoute] 🔧 Dev mode enabled, bypassing authentication');
    console.log('[ProtectedRoute] 💡 To access protected routes in dev, add ?dev=true to URL');
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <img src={logo} alt="Logo" className="loading-logo" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] ❌ Not authenticated, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  console.log('[ProtectedRoute] ✅ Authenticated, rendering children');
  return <>{children}</>;
};

// Компонент для перенаправления на основе роли
const RoleBasedDashboard: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <img src={logo} alt="Logo" className="loading-logo" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Перенаправляем на основе роли
  if (user.role === 'student') {
    return <Navigate to="/student/dashboard" replace />;
  }

  // По умолчанию для учителя
  return <Navigate to="/teacher/dashboard" replace />;
};

// Примечание: KonstaApp обертка находится в main.tsx
// Здесь только провайдеры и роутинг
function App() {
  return (
    <AuthProvider>
      <GroupProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
          <Routes>
          {/* Публичный маршрут - страница входа */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Защищенные маршруты */}
          
          {/* Редирект на основе роли */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RoleBasedDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Dashboard для учителя - главная страница со списком групп */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          
          {/* Dashboard для ученика - расписание и активные задания */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute>
                <StudentDashboardPage />
              </ProtectedRoute>
            }
          />
          
          {/* GroupDetails - детали группы (ученики, расписание, задания) */}
          <Route
            path="/groups/:id"
            element={
              <ProtectedRoute>
                <GroupDetailsPage />
              </ProtectedRoute>
            }
          />
          
          {/* NewHomework - форма создания нового задания */}
          <Route
            path="/groups/:id/homework/new"
            element={
              <ProtectedRoute>
                <NewHomeworkPage />
              </ProtectedRoute>
            }
          />
          
          {/* Редирект с корня на dashboard (с проверкой роли) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RoleBasedDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Fallback для несуществующих маршрутов */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </GroupProvider>
    </AuthProvider>
  );
}

export default App;
