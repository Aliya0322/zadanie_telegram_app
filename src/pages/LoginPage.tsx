import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Navbar } from 'konsta/react';
import { AcademicCapIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../features/Auth/hooks/useAuth';
import { useTelegram } from '../hooks/useTelegram';
import { timezones, getDefaultTimezone } from '../utils/timezones';
import { login as authLogin, updateRole, getCurrentUser } from '../api/authApi';
import logo from '../assets/images/logo.png';
import styles from './Login.module.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, user: authUser, isAuthenticated } = useAuth();
  const { user: telegramUser, isTelegram } = useTelegram();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'student' | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Форма для ученика
  const [studentForm, setStudentForm] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    timezone: getDefaultTimezone(),
  });
  
  // Форма для учителя
  const [teacherForm, setTeacherForm] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    birthDate: '',
    timezone: getDefaultTimezone(),
  });

  // Проверка авторизации при загрузке страницы
  useEffect(() => {
    const checkExistingAuth = async () => {
      // Если пользователь уже авторизован, перенаправляем на dashboard
      if (isAuthenticated && authUser) {
        if (authUser.role === 'teacher') {
          navigate('/teacher/dashboard', { replace: true });
        } else {
          navigate('/student/dashboard', { replace: true });
        }
        return;
      }

      // Проверяем, зарегистрирован ли пользователь через API
      // Используем telegram_id как надежный идентификатор
      // apiClient сам найдет initData из всех возможных источников
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const webApp = window.Telegram.WebApp;
        
        // Получаем telegram_id из initDataUnsafe (всегда доступен)
        const telegramId = webApp.initDataUnsafe?.user?.id;
        
        // Логирование для отладки
        if (import.meta.env.DEV) {
          console.log('[LoginPage] Checking existing auth...', {
            telegramId: telegramId || 'not found',
            platform: webApp.platform,
          });
        }
        
        // Если есть telegram_id, всегда пытаемся проверить авторизацию
        // apiClient автоматически найдет initData через getTelegramInitData()
        if (telegramId) {
          try {
            // Проверяем, зарегистрирован ли пользователь
            // apiClient автоматически добавит initData в заголовок X-Telegram-Init-Data
            const currentUser = await getCurrentUser();
            
            // Используем telegramId из initDataUnsafe, если API не вернул его
            const finalTelegramId = currentUser.telegramId || telegramId?.toString();
            
            // Если пользователь найден, автоматически логиним
            const contextUser = {
              id: currentUser.id,
              firstName: currentUser.firstName,
              lastName: currentUser.lastName,
              middleName: currentUser.middleName,
              birthDate: currentUser.birthDate,
              role: currentUser.role,
              telegramId: finalTelegramId, // Используем telegramId из initDataUnsafe если API не вернул
              timezone: currentUser.timezone,
            };
            
            login(contextUser, 'telegram-auth');
            
            if (import.meta.env.DEV) {
              console.log('[LoginPage] ✅ User authenticated, redirecting to dashboard');
            }
            
            // Перенаправляем на dashboard
            if (currentUser.role === 'teacher') {
              navigate('/teacher/dashboard', { replace: true });
            } else {
              navigate('/student/dashboard', { replace: true });
            }
            return;
          } catch (error: any) {
            // Пользователь не зарегистрирован - показываем форму регистрации
            if (import.meta.env.DEV) {
              console.log('[LoginPage] User not registered, showing registration form:', {
                error: error?.message,
                status: error?.response?.status,
              });
            }
          }
        } else {
          if (import.meta.env.DEV) {
            console.warn('[LoginPage] No telegram_id found, waiting...');
          }
          // Ждем немного на случай медленной загрузки SDK
          setTimeout(() => {
            if (webApp.initDataUnsafe?.user?.id) {
              // Повторная проверка после задержки
              checkExistingAuth();
            } else {
              setIsCheckingAuth(false);
            }
          }, 500);
          return;
        }
      }
      
      setIsCheckingAuth(false);
    };

    checkExistingAuth();
  }, [isAuthenticated, authUser, navigate, login]);

  // Устанавливаем часовой пояс по умолчанию при открытии формы
  useEffect(() => {
    if (isFormOpen) {
      const defaultTz = getDefaultTimezone();
      setStudentForm(prev => ({ ...prev, timezone: prev.timezone || defaultTz }));
      setTeacherForm(prev => ({ ...prev, timezone: prev.timezone || defaultTz }));
    }
  }, [isFormOpen]);

  const handleRoleSelect = (role: 'teacher' | 'student') => {
    setSelectedRole(role);
    setIsFormOpen(true);
    // Заполняем имя из Telegram, если доступно
    if (telegramUser?.firstName) {
      if (role === 'student') {
        setStudentForm(prev => ({ ...prev, firstName: telegramUser.firstName || '' }));
      } else {
        setTeacherForm(prev => ({ ...prev, firstName: telegramUser.firstName || '' }));
      }
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedRole(null);
    const defaultTz = getDefaultTimezone();
    setStudentForm({ firstName: '', lastName: '', birthDate: '', timezone: defaultTz });
    setTeacherForm({ firstName: '', lastName: '', middleName: '', birthDate: '', timezone: defaultTz });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) return;

    // Валидация
    if (selectedRole === 'student') {
      if (!studentForm.firstName.trim() || !studentForm.lastName.trim() || !studentForm.birthDate || !studentForm.timezone) {
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.showAlert('Пожалуйста, заполните все поля');
        } else {
          alert('Пожалуйста, заполните все поля');
        }
        return;
      }
    } else {
      if (!teacherForm.firstName.trim() || !teacherForm.lastName.trim() || !teacherForm.middleName.trim() || !teacherForm.birthDate || !teacherForm.timezone) {
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.showAlert('Пожалуйста, заполните все поля');
        } else {
          alert('Пожалуйста, заполните все поля');
        }
        return;
      }
    }

    setIsLoading(true);
    
    try {
      const formData = selectedRole === 'student' ? studentForm : teacherForm;
      
      // Сначала делаем логин/регистрацию через /auth/login
      // initData будет автоматически добавлен в заголовки через interceptor
      let loginResponse;
      try {
        loginResponse = await authLogin();
      } catch (loginError) {
        console.error('Login error:', loginError);
        // Если пользователь уже залогинен, продолжаем
        throw loginError;
      }

      // Затем обновляем роль и данные пользователя
      const updateData = {
        role: selectedRole,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        birthDate: formData.birthDate,
        timezone: formData.timezone,
        ...(selectedRole === 'teacher' && { middleName: teacherForm.middleName.trim() }),
      };

      const updatedUser = await updateRole(updateData);
      
      // Сохраняем пользователя в контекст (преобразуем в формат AuthContext)
      const contextUser = {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        middleName: updatedUser.middleName,
        birthDate: updatedUser.birthDate,
        role: updatedUser.role,
        telegramId: updatedUser.telegramId,
        timezone: updatedUser.timezone,
      };
      login(contextUser, loginResponse.token || '');
      
      // Навигация в зависимости от роли
      if (selectedRole === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Ошибка при входе. Попробуйте снова.';
      
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert(errorMessage);
      } else {
        alert(errorMessage);
      }
    } finally {
      setIsLoading(false);
      handleCloseForm();
    }
  };

  // Показываем загрузку, пока проверяем авторизацию
  if (isCheckingAuth) {
    return (
      <Page className={styles.page}>
        <div className={styles.content} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <p className={styles.loginSubtitle}>Проверка авторизации...</p>
        </div>
      </Page>
    );
  }

  return (
    <Page className={styles.page}>
      <Navbar 
        className={styles.navbar}
      />
      
      <div className={styles.content}>
        <div className={styles.logoContainer}>
          <img src={logo} alt="Logo" className={styles.logo} />
        </div>
        <h1 className={styles.loginTitle}>Добро пожаловать!</h1>
        <p className={styles.loginSubtitle}>
          Выберите роль для входа в систему
        </p>

        {isTelegram && telegramUser && (
          <div className={styles.userInfo}>
            <p className={styles.userInfoText}>
              Привет, <strong>{telegramUser.firstName}</strong>!
            </p>
            <p className={styles.userInfoHint}>
              Войдите как учитель или студент
            </p>
          </div>
        )}

        <div className={styles.buttonsContainer}>
          <button
            className={`${styles.loginButton} ${styles.loginButtonPrimary}`}
            onClick={() => handleRoleSelect('teacher')}
            disabled={isLoading || isFormOpen}
          >
            <AcademicCapIcon className={styles.buttonIcon} />
            <span className={styles.buttonText}>Войти как учитель</span>
          </button>
          
          <button
            className={`${styles.loginButton} ${styles.loginButtonSecondary}`}
            onClick={() => handleRoleSelect('student')}
            disabled={isLoading || isFormOpen}
          >
            <UserIcon className={styles.buttonIcon} />
            <span className={styles.buttonText}>Войти как студент</span>
          </button>
        </div>
      </div>

      {/* Модальное окно с формой анкеты */}
      {isFormOpen && selectedRole && (
        <div className={styles.formModal} onClick={handleCloseForm}>
          <div className={styles.formModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.formModalHeader}>
              <h2 className={styles.formModalTitle}>
                {selectedRole === 'teacher' ? 'Анкета учителя' : 'Анкета ученика'}
              </h2>
              <button onClick={handleCloseForm} className={styles.formModalCloseButton}>
                <XMarkIcon className={styles.formModalCloseIcon} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitForm} className={styles.formContent}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Имя <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={selectedRole === 'student' ? studentForm.firstName : teacherForm.firstName}
                  onChange={(e) => {
                    if (selectedRole === 'student') {
                      setStudentForm(prev => ({ ...prev, firstName: e.target.value }));
                    } else {
                      setTeacherForm(prev => ({ ...prev, firstName: e.target.value }));
                    }
                  }}
                  className={styles.formInput}
                  placeholder="Введите имя"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Фамилия <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={selectedRole === 'student' ? studentForm.lastName : teacherForm.lastName}
                  onChange={(e) => {
                    if (selectedRole === 'student') {
                      setStudentForm(prev => ({ ...prev, lastName: e.target.value }));
                    } else {
                      setTeacherForm(prev => ({ ...prev, lastName: e.target.value }));
                    }
                  }}
                  className={styles.formInput}
                  placeholder="Введите фамилию"
                  required
                  disabled={isLoading}
                />
              </div>

              {selectedRole === 'teacher' && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Отчество <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    value={teacherForm.middleName}
                    onChange={(e) => setTeacherForm(prev => ({ ...prev, middleName: e.target.value }))}
                    className={styles.formInput}
                    placeholder="Введите отчество"
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Дата рождения <span className={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  value={selectedRole === 'student' ? studentForm.birthDate : teacherForm.birthDate}
                  onChange={(e) => {
                    if (selectedRole === 'student') {
                      setStudentForm(prev => ({ ...prev, birthDate: e.target.value }));
                    } else {
                      setTeacherForm(prev => ({ ...prev, birthDate: e.target.value }));
                    }
                  }}
                  className={styles.formInput}
                  required
                  disabled={isLoading}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Часовой пояс <span className={styles.required}>*</span>
                </label>
                <select
                  value={selectedRole === 'student' ? studentForm.timezone : teacherForm.timezone}
                  onChange={(e) => {
                    if (selectedRole === 'student') {
                      setStudentForm(prev => ({ ...prev, timezone: e.target.value }));
                    } else {
                      setTeacherForm(prev => ({ ...prev, timezone: e.target.value }));
                    }
                  }}
                  className={styles.formSelect}
                  required
                  disabled={isLoading}
                >
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className={styles.formCancelButton}
                  disabled={isLoading}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className={styles.formSubmitButton}
                  disabled={isLoading}
                >
                  {isLoading ? 'Вход...' : 'Войти'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Page>
  );
};

export default LoginPage;

