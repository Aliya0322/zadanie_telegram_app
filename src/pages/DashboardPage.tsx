import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Navbar, Block } from 'konsta/react';
import { ClockIcon, CalendarIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../features/Auth/hooks/useAuth';
import { useTelegram } from '../hooks/useTelegram';
import { createGroup } from '../api/groupsApi';
import type { CreateGroupDto } from '../api/groupsApi';
import { getDashboard } from '../api/userApi';
import type { DashboardData } from '../api/userApi';
// Импорт модульных стилей
import styles from '../features/Groups/Dashboard.module.css';

// Моковые данные расписания по дням (для календаря)
const mockScheduleByDate: Record<string, Array<{ time: string; title: string; group: string }>> = {
  '2024-12-01': [
    { time: '18:00', title: 'Математика ОГЭ', group: 'Группа А' },
    { time: '19:30', title: 'Алгебра', group: 'Иван П.' },
  ],
  '2024-12-03': [
    { time: '18:00', title: 'Математика ОГЭ', group: 'Группа А' },
  ],
  '2024-12-05': [
    { time: '19:30', title: 'Алгебра', group: 'Иван П.' },
  ],
  '2024-12-08': [
    { time: '18:00', title: 'Математика ОГЭ', group: 'Группа А' },
    { time: '19:30', title: 'Алгебра', group: 'Иван П.' },
  ],
  '2024-12-10': [
    { time: '18:00', title: 'Математика ОГЭ', group: 'Группа А' },
  ],
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { user: telegramUser } = useTelegram();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupMeetingLink, setGroupMeetingLink] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Получение имени пользователя для приветствия
  // Для учителя: только имя и отчество (без фамилии)
  const getGreetingName = () => {
    if (user?.role === 'teacher') {
      const parts = [user.firstName];
      if (user.middleName) {
        parts.push(user.middleName);
      }
      return parts.join(' ');
    }
    
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    if (telegramUser?.firstName && telegramUser?.lastName) {
      return `${telegramUser.firstName} ${telegramUser.lastName}`;
    }
    
    return user?.firstName || telegramUser?.firstName || 'Пользователь';
  };
  
  const greetingName = getGreetingName();

  const handleGroupClick = (groupId: string) => {
    console.log('[handleGroupClick] Navigating to group:', {
      groupId,
      groupIdType: typeof groupId,
      groupIdValue: groupId,
      url: `/groups/${groupId}`,
    });
    navigate(`/groups/${groupId}`);
  };

  const handleCreateGroup = () => {
    setIsCreateGroupOpen(true);
  };

  const handleCloseCreateGroup = () => {
    setIsCreateGroupOpen(false);
    setGroupName('');
    setGroupMeetingLink('');
  };

  // Обновление списка групп после создания новой
  const handleGroupCreated = async () => {
    try {
      const data = await getDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Error refreshing groups:', error);
    }
  };

  const handleSubmitCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      // Используем безопасную обертку для showAlert
      if (window.Telegram?.WebApp) {
        try {
          window.Telegram.WebApp.showAlert('Пожалуйста, введите название группы');
        } catch (error) {
          alert('Пожалуйста, введите название группы');
        }
      } else {
        alert('Пожалуйста, введите название группы');
      }
      return;
    }

    setIsCreating(true);
    try {
      const newGroupData: CreateGroupDto = {
        name: groupName.trim(),
        meetingLink: groupMeetingLink.trim() || undefined,
      };
      
      const newGroup = await createGroup(newGroupData);
      
      // Показываем уведомление об успехе
      if (window.Telegram?.WebApp) {
        try {
          window.Telegram.WebApp.showAlert('Группа успешно создана!');
        } catch (error) {
          alert('Группа успешно создана!');
        }
      } else {
        alert('Группа успешно создана!');
      }
      
      // Закрываем модальное окно и обновляем страницу
      handleCloseCreateGroup();
      
      // Обновляем данные дашборда
      await handleGroupCreated();
      
      // Переходим на страницу новой группы
      navigate(`/groups/${newGroup.id}`);
    } catch (error: any) {
      console.error('Error creating group:', error);
      console.error('Error response:', error?.response);
      console.error('Error message:', error?.message);
      
      // Формируем более информативное сообщение об ошибке
      let errorMessage = 'Ошибка при создании группы.';
      
      if (error?.response?.data?.detail) {
        // Если бэкенд вернул детальное описание ошибки
        errorMessage = error.response.data.detail;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        if (error.message === 'Network Error' && !error?.response) {
          // CORS ошибка или проблема с подключением
          const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
          errorMessage = `Не удалось подключиться к серверу (${apiUrl}).\n\nВозможные причины:\n1. Проблема с CORS - проверьте настройки бэкенда\n2. Сервер недоступен\n3. Проблема с SSL сертификатом\n\nПроверьте консоль браузера для деталей.`;
        } else if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
          errorMessage = 'Не удалось подключиться к серверу. Проверьте настройки подключения.';
        } else {
          errorMessage = `Ошибка: ${error.message}`;
        }
      } else if (error?.response?.status === 401) {
        errorMessage = 'Ошибка авторизации. Пожалуйста, войдите заново.';
      } else if (error?.response?.status === 403) {
        errorMessage = 'Недостаточно прав для создания группы.';
      } else if (error?.response?.status === 422) {
        errorMessage = 'Некорректные данные. Проверьте введенные данные.';
      }
      
      // Используем безопасную обертку для showAlert
      if (window.Telegram?.WebApp) {
        try {
          window.Telegram.WebApp.showAlert(errorMessage);
        } catch (error) {
          console.warn('showAlert failed, using fallback:', error);
          alert(errorMessage);
        }
      } else {
        alert(errorMessage);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleSettings = () => {
    // TODO: Открыть настройки
    console.log('Settings clicked');
    // Можно добавить модальное окно с настройками или переход на страницу настроек
  };


  const handleCalendarClick = () => {
    setIsCalendarOpen(true);
  };

  const handleCloseCalendar = () => {
    setIsCalendarOpen(false);
    setSelectedDate(null);
    // Сбрасываем календарь на текущий месяц при закрытии
    const today = new Date();
    setCalendarMonth(today.getMonth());
    setCalendarYear(today.getFullYear());
  };

  const handlePreviousMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  const handleDateClick = (date: string) => {
    if (mockScheduleByDate[date]) {
      setSelectedDate(date);
    }
  };

  // Получить дни с занятиями
  const getDaysWithClasses = (): string[] => {
    return Object.keys(mockScheduleByDate);
  };

  // Генерация календаря
  const generateCalendar = () => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    // getDay() возвращает 0 для воскресенья, 1 для понедельника и т.д.
    // Преобразуем так, чтобы понедельник был 0, воскресенье - 6
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    const days: Array<{ day: number; date: string; hasClass: boolean }> = [];
    
    // Пустые ячейки для дней до начала месяца
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: 0, date: '', hasClass: false });
    }
    
    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(calendarYear, calendarMonth, day);
      const dateString = date.toISOString().split('T')[0];
      const hasClass = getDaysWithClasses().includes(dateString);
      days.push({ day, date: dateString, hasClass });
    }
    
    return days;
  };

  const formatDateForDisplay = (dateString: string): string => {
    const date = new Date(dateString);
    const daysOfWeek = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    
    return `${date.getDate()} ${months[date.getMonth()]}, ${daysOfWeek[date.getDay()]}`;
  };

  // Получить название месяца и года для календаря
  const getCalendarMonthYear = (): string => {
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    return `${months[calendarMonth]} ${calendarYear}`;
  };

  // Загрузка данных дашборда
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const data = await getDashboard();
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // В случае ошибки устанавливаем пустые данные
        setDashboardData({
          userRole: user?.role || 'teacher',
          groups: [],
          schedule: [],
          activeHomework: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const calendarDays = generateCalendar();
  const calendarMonthYear = getCalendarMonthYear();
  
  // Используем только данные из API (без fallback на моковые данные)
  const groups = dashboardData?.groups || [];
  
  // Фильтруем расписание на сегодня
  const today = new Date();
  const todayDateString = today.toISOString().split('T')[0];
  const todaySchedule = dashboardData?.schedule?.filter(item => {
    // Если есть конкретная дата - сравниваем
    if (item.date) {
      return item.date === todayDateString;
    }
    // Если указан день недели - проверяем
    if (item.dayOfWeek !== undefined) {
      const todayDayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1; // Преобразуем воскресенье из 0 в 6
      return item.dayOfWeek === todayDayOfWeek;
    }
    return false;
  }) || [];

  return (
    <Page className={styles.page}>
      <Navbar 
        title=""
        left={
          <span className={styles.cabinetTitle}>Мой Кабинет</span>
        }
        right={
          <button onClick={handleSettings} className={styles.settingsButton}>
            <Cog6ToothIcon className={styles.settingsIcon} />
          </button>
        }
        className={styles.navbar}
      />

      <div className={styles.content}>
        {/* Приветствие */}
        <div className={styles.greetingSection}>
          <span className={styles.greetingText}>Здравствуйте, {greetingName}!</span>
        </div>

        {/* Сегодняшние занятия */}
        {!isLoading && (
          <Block className={styles.scheduleBlock}>
            {todaySchedule.length > 0 ? (
              <>
                <div className={styles.scheduleHeader}>
                  <span className={styles.scheduleTitle}>
                    СЕГОДНЯ: {todaySchedule.length} {todaySchedule.length === 1 ? 'занятие' : todaySchedule.length < 5 ? 'занятия' : 'занятий'}
                  </span>
                  <button 
                    onClick={handleCalendarClick}
                    className={styles.calendarButton}
                  >
                    <CalendarIcon className={styles.calendarButtonIcon} />
                    Календарь
                  </button>
                </div>
                
                <div className={styles.scheduleList}>
                  {todaySchedule.map((item) => (
                    <div key={item.id} className={styles.scheduleItem}>
                      <ClockIcon className={styles.clockIcon} />
                      <div className={styles.scheduleItemContent}>
                        <span className={styles.scheduleTime}>{item.startTime}</span>
                        <span className={styles.scheduleSeparator}> - </span>
                        <span className={styles.scheduleSubject}>{item.groupName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.emptyText}>
                Нет актуального расписания
              </div>
            )}
          </Block>
        )}

        {/* Мои группы */}
        <div className={styles.groupsSection}>
          <h2 className={styles.groupsTitle}>МОИ ГРУППЫ</h2>
          
          {isLoading ? (
            <div className={styles.groupsList}>
              <div className={styles.groupCard}>
                <div className={styles.groupCardContent}>
                  <div className={styles.groupName}>Загрузка...</div>
                </div>
              </div>
            </div>
          ) : groups.length > 0 ? (
            <div className={styles.groupsList}>
              {groups.map((group) => {
                console.log('[DashboardPage] Rendering group:', {
                  id: group.id,
                  idType: typeof group.id,
                  name: group.name,
                  students: group.students,
                });
                const studentCount = group.students?.length || 0;
                const hasHomework = dashboardData?.activeHomework?.some(hw => hw.groupId === group.id) || false;
                return (
                  <div 
                    key={group.id}
                    className={styles.groupCard}
                    onClick={() => handleGroupClick(group.id)}
                  >
                    <div className={styles.groupCardContent}>
                      <div className={styles.groupInfo}>
                        <div className={styles.groupName}>{group.name}</div>
                        <div className={styles.groupMeta}>
                          <span className={styles.groupStudents}>
                            {studentCount} {studentCount === 1 ? 'ученик' : studentCount < 5 ? 'ученика' : 'учеников'}
                          </span>
                          {hasHomework && (
                            <>
                              <span className={styles.groupSeparator}> | </span>
                              <span className={styles.groupHomework}>
                                ДЗ: Активно
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className={styles.groupArrow}>›</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.groupsList}>
              <div className={styles.groupCard}>
                <div className={styles.groupCardContentEmpty}>
                  <div className={styles.emptyText}>Нет актуальных групп</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Кнопка создания группы */}
        <button 
          className={styles.createGroupButton}
          onClick={handleCreateGroup}
        >
          [ + СОЗДАТЬ НОВУЮ ГРУППУ ]
        </button>
      </div>

      {/* Модальное окно календаря */}
      {isCalendarOpen && (
        <div className={styles.calendarModal} onClick={handleCloseCalendar}>
          <div className={styles.calendarModalContent} onClick={(e) => e.stopPropagation()}>
            <button onClick={handleCloseCalendar} className={styles.calendarCloseButton}>
              <XMarkIcon className={styles.calendarCloseIcon} />
            </button>
            <div className={styles.calendarHeader}>
              <div className={styles.calendarMonthYearContainer}>
                <button 
                  onClick={handlePreviousMonth}
                  className={styles.calendarNavButton}
                  aria-label="Предыдущий месяц"
                >
                  <ChevronLeftIcon className={styles.calendarNavIcon} />
                </button>
                <div className={styles.calendarMonthYear}>{calendarMonthYear}</div>
                <button 
                  onClick={handleNextMonth}
                  className={styles.calendarNavButton}
                  aria-label="Следующий месяц"
                >
                  <ChevronRightIcon className={styles.calendarNavIcon} />
                </button>
              </div>
            </div>
            
            <div className={styles.calendarGrid}>
              <div className={styles.calendarWeekDays}>
                <div>Пн</div>
                <div>Вт</div>
                <div>Ср</div>
                <div>Чт</div>
                <div>Пт</div>
                <div>Сб</div>
                <div>Вс</div>
              </div>
              <div className={styles.calendarDays}>
                {calendarDays.map((item, index) => (
                  <div
                    key={index}
                    className={`${styles.calendarDay} ${item.day === 0 ? styles.calendarDayEmpty : ''} ${item.hasClass ? styles.calendarDayWithClass : ''} ${selectedDate === item.date ? styles.calendarDaySelected : ''}`}
                    onClick={() => item.date && handleDateClick(item.date)}
                  >
                    {item.day > 0 && (
                      <>
                        <span>{item.day}</span>
                        {item.hasClass && <span className={styles.calendarDayDot}></span>}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Расписание выбранного дня */}
            {selectedDate && mockScheduleByDate[selectedDate] && (
              <div className={styles.selectedDateSchedule}>
                <div className={styles.selectedDateTitle}>
                  {formatDateForDisplay(selectedDate)}
                </div>
                <div className={styles.selectedDateList}>
                  {mockScheduleByDate[selectedDate].map((item, index) => (
                    <div key={index} className={styles.selectedDateItem}>
                      <ClockIcon className={styles.clockIcon} />
                      <div className={styles.scheduleItemContent}>
                        <span className={styles.scheduleTime}>{item.time}</span>
                        <span className={styles.scheduleSeparator}> - </span>
                        <span className={styles.scheduleSubject}>{item.title}</span>
                        <span className={styles.scheduleGroup}>({item.group})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Модальное окно создания группы */}
      {isCreateGroupOpen && (
        <div className={styles.calendarModal} onClick={handleCloseCreateGroup}>
          <div className={styles.calendarModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.calendarHeader}>
              <h2 className={styles.calendarTitle}>Создать новую группу</h2>
              <button onClick={handleCloseCreateGroup} className={styles.calendarCloseButton}>
                <XMarkIcon className={styles.calendarCloseIcon} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitCreateGroup} className={styles.createGroupForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Название группы <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Например: Математика, ОГЭ (Группа А)"
                  className={styles.formInput}
                  required
                  disabled={isCreating}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Ссылка на Zoom или другой сайт (необязательно)
                </label>
                <input
                  type="url"
                  value={groupMeetingLink}
                  onChange={(e) => setGroupMeetingLink(e.target.value)}
                  placeholder="https://zoom.us/j/..."
                  className={styles.formInput}
                  disabled={isCreating}
                />
              </div>
              
              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={handleCloseCreateGroup}
                  className={styles.formCancelButton}
                  disabled={isCreating}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className={styles.formSubmitButton}
                  disabled={isCreating || !groupName.trim()}
                >
                  {isCreating ? 'Создание...' : 'Создать группу'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Page>
  );
};

export default DashboardPage;

