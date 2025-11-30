import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Navbar, Block } from 'konsta/react';
import { ArrowLeftIcon, EllipsisVerticalIcon, ClockIcon, CalendarIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../features/Auth/hooks/useAuth';
import { useTelegram } from '../hooks/useTelegram';
import { createGroup, getGroups } from '../api/groupsApi';
import type { CreateGroupDto } from '../api/groupsApi';
import { getDashboard } from '../api/userApi';
import type { DashboardData, ScheduleItem } from '../api/userApi';
// Импорт модульных стилей
import styles from '../features/Groups/Dashboard.module.css';

// Моковые данные расписания с датами
const mockSchedule = [
  { time: '18:00', title: 'Математика ОГЭ', group: 'Группа А' },
  { time: '19:30', title: 'Алгебра', group: 'Иван П.' },
];

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

const mockGroups = [
  { id: '1', name: 'Математика, ОГЭ (Группа А)', count: 5, homework: 'Активно' },
  { id: '2', name: 'Английский, ЕГЭ (Вторник)', count: 3, homework: 'Нет' },
  { id: '3', name: 'Индивидуально (Петя В.)', count: 1, homework: null },
];

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
  
  // Получение имени пользователя из TG SDK или из контекста авторизации
  // Для учителя: имя, отчество, фамилия
  // Для студента: имя, фамилия
  const getUserName = () => {
    if (user?.role === 'teacher' && user.firstName && user.lastName) {
      const parts = [user.firstName];
      if (user.middleName) {
        parts.push(user.middleName);
      }
      parts.push(user.lastName);
      return parts.join(' ');
    }
    
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    if (telegramUser?.firstName && telegramUser?.lastName) {
      return `${telegramUser.firstName} ${telegramUser.lastName}`;
    }
    
    return user?.firstName || telegramUser?.firstName || 'Мария Ивановна';
  };
  
  const userName = getUserName();

  const handleGroupClick = (groupId: string) => {
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

  const handleSubmitCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert('Пожалуйста, введите название группы');
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
        window.Telegram.WebApp.showAlert('Группа успешно создана!');
      } else {
        alert('Группа успешно создана!');
      }
      
      // Закрываем модальное окно и обновляем страницу
      handleCloseCreateGroup();
      
      // Обновляем данные дашборда
      await handleGroupCreated();
      
      // Переходим на страницу новой группы
      navigate(`/groups/${newGroup.id}`);
    } catch (error) {
      console.error('Error creating group:', error);
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert('Ошибка при создании группы. Попробуйте снова.');
      } else {
        alert('Ошибка при создании группы');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleMenu = () => {
    console.log('Открыть меню');
    // TODO: Open menu
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
        // В случае ошибки используем моковые данные
        setDashboardData({
          userRole: user?.role || 'teacher',
          groups: mockGroups.map(g => ({
            id: g.id,
            name: g.name,
            teacherId: user?.id || '',
            students: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
          schedule: [],
          activeHomework: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Обновление списка групп после создания новой
  const handleGroupCreated = async () => {
    try {
      const data = await getDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Error refreshing groups:', error);
    }
  };

  const calendarDays = generateCalendar();
  const calendarMonthYear = getCalendarMonthYear();
  
  // Используем данные из API или моковые данные
  const groups = dashboardData?.groups || mockGroups.map(g => ({
    id: g.id,
    name: g.name,
    teacherId: user?.id || '',
    students: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  
  const todaySchedule = dashboardData?.schedule || mockSchedule.map(item => ({
    id: item.time,
    groupId: '1',
    groupName: item.group,
    startTime: item.time,
  }));

  return (
    <Page className={styles.page}>
      <Navbar 
        title="Мой Кабинет"
        left={
          <button onClick={handleBack} className={styles.navButton}>
            <ArrowLeftIcon className={styles.navIcon} />
          </button>
        }
        right={
          <button onClick={handleMenu} className={styles.navButton}>
            <EllipsisVerticalIcon className={styles.navIcon} />
          </button>
        }
        className={styles.navbar}
      />

      <div className={styles.content}>
        {/* Приветствие */}
        <div className={styles.greetingSectionWithButton}>
          <span className={styles.greetingText}>Здравствуйте, {userName}!</span>
          <button 
            onClick={handleCalendarClick}
            className={styles.calendarButton}
          >
            <CalendarIcon className={styles.calendarButtonIcon} />
            Календарь
          </button>
        </div>

        {/* Сегодняшние занятия */}
        {!isLoading && todaySchedule.length > 0 && (
          <Block className={styles.scheduleBlock}>
            <div className={styles.scheduleHeader}>
              <span className={styles.scheduleTitle}>
                СЕГОДНЯ: {todaySchedule.length} {todaySchedule.length === 1 ? 'занятие' : todaySchedule.length < 5 ? 'занятия' : 'занятий'}
              </span>
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
        </Block>
        )}

        {/* Мои группы */}
        <div className={styles.groupsSection}>
          <h2 className={styles.groupsTitle}>МОИ ГРУППЫ</h2>
          
          <div className={styles.groupsList}>
          {isLoading ? (
            <div className={styles.groupCard}>
              <div className={styles.groupCardContent}>
                <div className={styles.groupName}>Загрузка...</div>
              </div>
            </div>
          ) : (
            groups.map((group) => {
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
            })
          )}
          </div>
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

