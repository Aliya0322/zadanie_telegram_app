import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Navbar } from 'konsta/react';
import { AcademicCapIcon, UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../features/Auth/hooks/useAuth';
import { useTelegram } from '../hooks/useTelegram';
import { timezones, getDefaultTimezone } from '../utils/timezones';
import { login as authLogin, getCurrentUser, type UpdateRoleRequest, type UserFrontend } from '../api/authApi';
import { hasTelegramInitData } from '../api/apiClient';
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
            // currentUser уже является UserFrontend, можно использовать напрямую
            const contextUser: UserFrontend = {
              id: currentUser.id,
              firstName: currentUser.firstName,
              lastName: currentUser.lastName,
              middleName: currentUser.middleName,
              birthDate: currentUser.birthDate,
              role: currentUser.role,
              telegramId: finalTelegramId || currentUser.telegramId, // Используем telegramId из initDataUnsafe если API не вернул
              timezone: currentUser.timezone,
              isActive: currentUser.isActive,
              createdAt: currentUser.createdAt,
            };
            
            console.log('[LoginPage] Calling login() to set user in context...');
            login(contextUser, 'telegram-auth');
            
            // Даем время на обновление состояния перед редиректом
            setTimeout(() => {
              console.log('[LoginPage] ✅ User authenticated, redirecting to dashboard');
              
              // Перенаправляем на dashboard
              if (currentUser.role === 'teacher') {
                navigate('/teacher/dashboard', { replace: true });
              } else {
                navigate('/student/dashboard', { replace: true });
              }
            }, 100);
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

    // Проверяем наличие initData перед отправкой формы
    // Это важно для случаев, когда пользователь переходит по ссылке приглашения
    if (!hasTelegramInitData()) {
      const errorMsg = 'Не удалось получить данные авторизации Telegram.\n\n' +
        'Пожалуйста, убедитесь, что:\n' +
        '1. Вы открыли приложение через Telegram\n' +
        '2. Вы перешли по ссылке приглашения в Telegram\n' +
        '3. Приложение открыто в контексте Telegram WebApp\n\n' +
        'Если проблема сохраняется, попробуйте закрыть и открыть приложение заново через Telegram.';
      
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert(errorMsg);
      } else {
        alert(errorMsg);
      }
      return;
    }

    setIsLoading(true);
    
    // Подготавливаем данные для регистрации (объявляем вне try, чтобы использовать в catch)
    const formData = selectedRole === 'student' ? studentForm : teacherForm;
    const updateData: UpdateRoleRequest = {
      role: selectedRole,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      birthDate: formData.birthDate,
      timezone: formData.timezone,
      ...(selectedRole === 'teacher' && { middleName: teacherForm.middleName.trim() }),
    };
    
    try {
      // Делаем логин/регистрацию через /auth/login с данными регистрации
      // initData будет автоматически добавлен в заголовки через interceptor
      // Теперь login объединен с updateRole, можно передать данные регистрации сразу
      console.log('[LoginPage] Sending login/registration request with data:', updateData);
      
      const loginResponse = await authLogin(updateData);
      
      console.log('[LoginPage] Login/registration successful, user:', {
        userId: loginResponse.user.id,
        role: loginResponse.user.role,
        isNewUser: loginResponse.isNewUser,
        message: loginResponse.message,
      });
      
      // loginResponse.user уже является UserFrontend (camelCase)
      // Можно использовать напрямую
      const contextUser: UserFrontend = {
        id: loginResponse.user.id,
        firstName: loginResponse.user.firstName,
        lastName: loginResponse.user.lastName,
        middleName: loginResponse.user.middleName,
        birthDate: loginResponse.user.birthDate,
        role: loginResponse.user.role,
        telegramId: loginResponse.user.telegramId,
        timezone: loginResponse.user.timezone,
        isActive: loginResponse.user.isActive,
        createdAt: loginResponse.user.createdAt,
      };
      // Бэкенд не использует токены, авторизация через Telegram initData
      login(contextUser, '');
      
      // Навигация в зависимости от роли
      if (selectedRole === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (error: any) {
      console.error('[LoginPage] Registration error:', error);
      
      // Детальная обработка ошибок
      let errorMessage = 'Ошибка при регистрации. Попробуйте снова.';
      
      if (error?.response?.status === 422) {
        // Ошибка валидации данных
        const detail = error.response?.data?.detail;
        
        // Проверяем, связана ли ошибка с отсутствием X-Telegram-Init-Data заголовка
        let isInitDataError = false;
        
        if (Array.isArray(detail)) {
          // FastAPI возвращает массив ошибок валидации
          const errors = detail.map((err: any) => {
            const field = err.loc?.join('.') || 'unknown';
            const message = err.msg || 'Invalid value';
            
            // Проверяем, связана ли ошибка с initData
            if (field.includes('X-Telegram-Init-Data') || field.includes('init') || field.includes('header')) {
              isInitDataError = true;
            }
            
            return `${field}: ${message}`;
          }).join('\n');
          
          if (isInitDataError) {
            errorMessage = 'Ошибка авторизации Telegram. Пожалуйста, убедитесь, что:\n\n' +
              '1. Вы открыли приложение через Telegram\n' +
              '2. Вы нажали на ссылку приглашения в Telegram\n' +
              '3. Приложение открыто в контексте Telegram WebApp\n\n' +
              'Если проблема сохраняется, попробуйте закрыть и открыть приложение заново через Telegram.';
          } else {
            errorMessage = `Ошибка валидации данных:\n${errors}`;
          }
        } else if (typeof detail === 'string') {
          errorMessage = detail;
          // Проверяем, содержит ли сообщение об ошибке упоминание initData
          if (detail.toLowerCase().includes('init') || detail.toLowerCase().includes('telegram') || detail.toLowerCase().includes('header')) {
            errorMessage = 'Ошибка авторизации Telegram. Пожалуйста, убедитесь, что вы открыли приложение через Telegram.';
          }
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
          if (errorMessage.toLowerCase().includes('init') || errorMessage.toLowerCase().includes('telegram') || errorMessage.toLowerCase().includes('header')) {
            errorMessage = 'Ошибка авторизации Telegram. Пожалуйста, убедитесь, что вы открыли приложение через Telegram.';
          }
        } else {
          errorMessage = 'Ошибка валидации данных. Проверьте введенные данные.';
        }
        
        console.error('[LoginPage] Validation error details:', {
          status: 422,
          data: error.response?.data,
          sentData: updateData,
          isInitDataError,
        });
      } else if (error?.response?.status === 401) {
        errorMessage = 'Ошибка авторизации. Проверьте, что вы открыли приложение через Telegram.';
      } else if (error?.response?.status === 403) {
        errorMessage = 'Недостаточно прав для выполнения операции.';
      } else if (error?.message?.includes('Network Error') || !error?.response) {
        errorMessage = 'Не удалось подключиться к серверу. Проверьте подключение к интернету.';
      } else if (error?.message) {
        errorMessage = `Ошибка: ${error.message}`;
      }
      
      console.error('[LoginPage] Final error message:', errorMessage);
      
      if (window.Telegram?.WebApp) {
        try {
          window.Telegram.WebApp.showAlert(errorMessage);
        } catch (alertError) {
          alert(errorMessage);
        }
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
          <div className={styles.logoContainer}>
            <img src={logo} alt="Logo" className={`${styles.logo} ${styles.logoLoading}`} />
          </div>
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

