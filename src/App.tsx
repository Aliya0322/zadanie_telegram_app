import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/Auth/context/AuthContext';
import { GroupProvider } from './features/Groups/context/GroupContext';

// Lazy loading для всех страниц
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const StudentDashboardPage = lazy(() => import('./pages/StudentDashboardPage'));
const GroupDetailsPage = lazy(() => import('./pages/GroupDetailsPage'));
const NewHomeworkPage = lazy(() => import('./pages/NewHomeworkPage'));

// Компонент загрузки
const LoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-500">Загрузка...</p>
    </div>
  </div>
);

// Компонент для защищенных маршрутов
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Компонент для перенаправления на основе роли
const RoleBasedDashboard: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Загрузка...</p>
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
