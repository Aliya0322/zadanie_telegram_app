import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Navbar, Block } from 'konsta/react';
import { 
  CalendarIcon, 
  ClockIcon, 
  DocumentTextIcon,
  ArrowLeftIcon,
  Cog6ToothIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../features/Auth/hooks/useAuth';
import { useTelegram } from '../hooks/useTelegram';
import type { Homework } from '../api/homeworkApi';
import { getHomeworkByGroup } from '../api/homeworkApi';
import { getGroups } from '../api/groupsApi';
import { getScheduleByGroup, type Schedule } from '../api/scheduleApi';
import { updateProfile, deleteProfile } from '../api/authApi';
import { timezones, getDefaultTimezone } from '../utils/timezones';
import { formatDate, isPast } from '../utils/timeFormat';
import styles from '../features/Groups/Dashboard.module.css';

interface ScheduleItem {
  dayOfWeek: string;
  time: string;
  endTime: string;
  title: string;
  group: string;
  groupId: number;
}

interface NextClass {
  date: Date;
  dayOfWeek: string;
  time: string;
  endTime: string;
  title: string;
  group: string;
}

const StudentDashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { user: telegramUser } = useTelegram();
  const [activeHomework, setActiveHomework] = useState<Homework[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [nextClass, setNextClass] = useState<NextClass | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    birthDate: user?.birthDate || '',
    timezone: user?.timezone || getDefaultTimezone(),
  });

  // Получение имени пользователя из БД
  const userName = user?.firstName || telegramUser?.firstName || 'Ученик';

  const handleBack = () => {
    navigate(-1);
  };

  const handleSettings = () => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        birthDate: user.birthDate || '',
        timezone: user.timezone || getDefaultTimezone(),
      });
      setIsSettingsOpen(true);
    }
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const updatedUser = await updateProfile({
        role: user.role,
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        birthDate: profileForm.birthDate || undefined,
        timezone: profileForm.timezone,
      });

      updateUser(updatedUser);
      setIsSettingsOpen(false);

      if (window.Telegram?.WebApp) {
        try {
          window.Telegram.WebApp.showAlert('Профиль успешно обновлен!');
        } catch (error) {
          alert('Профиль успешно обновлен!');
        }
      } else {
        alert('Профиль успешно обновлен!');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      let errorMessage = 'Ошибка при обновлении профиля. Попробуйте снова.';
      
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

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
      setIsSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!user) return;

    const confirmMessage = 'Вы уверены, что хотите удалить свой профиль? Это действие нельзя отменить.';
    const confirmed = typeof window !== 'undefined' && window.Telegram?.WebApp 
      ? await new Promise<boolean>((resolve) => {
          try {
            window.Telegram!.WebApp.showConfirm(confirmMessage, (confirmed) => {
              resolve(confirmed);
            });
          } catch {
            resolve(window.confirm(confirmMessage));
          }
        })
      : window.confirm(confirmMessage);

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteProfile();
      logout();
      navigate('/login');
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      let errorMessage = 'Ошибка при удалении профиля. Попробуйте снова.';
      
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

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
      setIsDeleting(false);
    }
  };

  // Преобразование дня недели из API формата в русский
  const formatDayOfWeek = (day: string): string => {
    const mapping: Record<string, string> = {
      'monday': 'Понедельник',
      'tuesday': 'Вторник',
      'wednesday': 'Среда',
      'thursday': 'Четверг',
      'friday': 'Пятница',
      'saturday': 'Суббота',
      'sunday': 'Воскресенье',
    };
    return mapping[day.toLowerCase()] || day;
  };

  // Форматирование времени в формат HH:mm
  const formatTime = (timeString: string): string => {
    const parts = timeString.split(':');
    const hours = parts[0]?.padStart(2, '0') || '00';
    const minutes = parts[1]?.padStart(2, '0') || '00';
    return `${hours}:${minutes}`;
  };

  // Вычислить время окончания на основе времени начала и длительности
  const calculateEndTime = (startTime: string, durationMinutes: number | null): string => {
    const defaultDuration = 90; // По умолчанию 90 минут
    const duration = durationMinutes || defaultDuration;
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    startDate.setMinutes(startDate.getMinutes() + duration);
    
    const endHours = startDate.getHours().toString().padStart(2, '0');
    const endMinutes = startDate.getMinutes().toString().padStart(2, '0');
    return `${endHours}:${endMinutes}`;
  };

  // Получить номер дня недели (0 = воскресенье, 1 = понедельник, ...)
  const getDayOfWeekNumber = (dayName: string): number => {
    const mapping: Record<string, number> = {
      'Понедельник': 1,
      'Вторник': 2,
      'Среда': 3,
      'Четверг': 4,
      'Пятница': 5,
      'Суббота': 6,
      'Воскресенье': 0,
    };
    return mapping[dayName] ?? -1;
  };

  // Найти ближайшее занятие из расписания
  const findNextClass = (scheduleItems: ScheduleItem[], groupName: string): NextClass | null => {
    if (scheduleItems.length === 0) return null;

    const now = new Date();
    const currentDay = now.getDay(); // 0 = воскресенье, 1 = понедельник, ...
    const currentTime = now.getHours() * 60 + now.getMinutes(); // время в минутах

    let nearestClass: NextClass | null = null;
    let minDaysDiff = Infinity;

    scheduleItems.forEach((item) => {
      const itemDayNumber = getDayOfWeekNumber(item.dayOfWeek);
      if (itemDayNumber === -1) return;

      const [hours, minutes] = item.time.split(':').map(Number);
      const itemTime = hours * 60 + minutes;

      // Вычисляем, через сколько дней будет это занятие
      let daysDiff = itemDayNumber - currentDay;
      if (daysDiff < 0) {
        // Занятие уже прошло на этой неделе, берем следующую неделю
        daysDiff += 7;
      } else if (daysDiff === 0 && itemTime <= currentTime) {
        // Занятие сегодня, но уже прошло, берем следующую неделю
        daysDiff = 7;
      }

      // Если это занятие ближе, чем текущее ближайшее
      if (daysDiff < minDaysDiff || (daysDiff === minDaysDiff && itemTime < (nearestClass ? parseInt(nearestClass.time.split(':')[0]) * 60 + parseInt(nearestClass.time.split(':')[1]) : Infinity))) {
        const nextClassDate = new Date(now);
        nextClassDate.setDate(nextClassDate.getDate() + daysDiff);
        nextClassDate.setHours(hours, minutes, 0, 0);

        const daysOfWeek = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
        const dayOfWeek = daysOfWeek[nextClassDate.getDay()];

        nearestClass = {
          date: nextClassDate,
          dayOfWeek,
          time: item.time,
          endTime: item.endTime,
          title: item.title,
          group: groupName,
        };
        minDaysDiff = daysDiff;
      }
    });

    return nearestClass;
  };
  
  const formatDateShort = (date: Date): string => {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long'
    });
  };

  useEffect(() => {
    // Загрузка данных для студента
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    setIsLoadingData(true);
    setIsLoading(true);
    try {
      // Получаем группы студента
      const groups = await getGroups();
      const activeGroup = groups.find(g => g.isActive) || groups[0];
      
      if (!activeGroup) {
        console.log('Student is not in any group');
        setSchedule([]);
        setActiveHomework([]);
        setNextClass(null);
        return;
      }

      // Получаем расписание группы
      try {
        const groupSchedule = await getScheduleByGroup(activeGroup.id);
        const transformedSchedule: ScheduleItem[] = groupSchedule.map((s: Schedule) => {
          const startTime = formatTime(s.timeAt);
          const endTime = calculateEndTime(startTime, s.duration);
          return {
            dayOfWeek: formatDayOfWeek(s.dayOfWeek),
            time: startTime,
            endTime: endTime,
            title: activeGroup.name, // Используем название группы как название предмета
            group: activeGroup.name,
            groupId: activeGroup.id,
          };
        });
        setSchedule(transformedSchedule);

        // Находим ближайшее занятие
        const nearest = findNextClass(transformedSchedule, activeGroup.name);
        setNextClass(nearest);
      } catch (error) {
        console.error('Error fetching schedule:', error);
        setSchedule([]);
        setNextClass(null);
      }

      // Получаем задания группы
      try {
        const homework = await getHomeworkByGroup(String(activeGroup.id));
        setActiveHomework(homework);
      } catch (error) {
        console.error('Error fetching homework:', error);
        setActiveHomework([]);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      setSchedule([]);
      setActiveHomework([]);
      setNextClass(null);
    } finally {
      setIsLoading(false);
      setIsLoadingData(false);
    }
  };


  const getDaysUntilDeadline = (dueDate: string): number => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineStatus = (dueDate: string): { text: string; color: string; bgColor: string } => {
    const days = getDaysUntilDeadline(dueDate);
    if (isPast(dueDate)) {
      return { text: 'Просрочено', color: '#ef4444', bgColor: '#fee2e2' };
    } else if (days <= 1) {
      return { text: 'Сдать сегодня', color: '#f97316', bgColor: '#fed7aa' };
    } else if (days <= 3) {
      return { text: `Осталось ${days} дня`, color: '#eab308', bgColor: '#fef9c3' };
    } else {
      return { text: `Осталось ${days} дней`, color: '#4b5563', bgColor: '#f3f4f6' };
    }
  };

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
          <button onClick={handleSettings} className={styles.settingsButton}>
            <Cog6ToothIcon className={styles.settingsIcon} />
          </button>
        }
        className={styles.navbar}
      />

      <div className={styles.content}>
      {/* Приветствие */}
        <div className={styles.greetingSection}>
          <span className={styles.greetingText}>Привет, {userName}!</span>
        </div>

      {/* Моё расписание */}
        <Block className={styles.scheduleBlock}>
          <div className={styles.scheduleHeader}>
            <span className={styles.scheduleTitle}>
              МОЁ РАСПИСАНИЕ
            </span>
          </div>
          
          <div className={styles.scheduleList}>
          {isLoadingData ? (
            <div className={styles.scheduleItem}>
              <div className={styles.scheduleItemContent}>
                <span className={styles.scheduleTime}>Загрузка расписания...</span>
              </div>
            </div>
          ) : schedule.length === 0 ? (
            <div className={styles.scheduleItem}>
              <div className={styles.scheduleItemContent}>
                <span className={styles.scheduleTime}>Нет расписания</span>
              </div>
            </div>
          ) : (
            schedule.map((item, index) => (
              <div key={index} className={styles.scheduleItem}>
                <ClockIcon className={styles.clockIcon} />
                <div className={styles.scheduleItemContent}>
                  <span className={styles.scheduleTime}>{item.dayOfWeek} {item.time} - {item.endTime}</span>
                  <span className={styles.scheduleSeparator}> - </span>
                  <span className={styles.scheduleGroup}>{item.group}</span>
                </div>
              </div>
            ))
          )}
          </div>

          {/* Ближайшее занятие */}
          {nextClass && (
            <div className={styles.nextClassSection}>
              <div className={styles.nextClassTitle}>
                Ближайшее занятие
              </div>
              <div className={styles.scheduleItem}>
                <CalendarIcon className={`${styles.clockIcon} ${styles.blueIcon}`} />
                <div className={styles.scheduleItemContent}>
                  <div className={styles.nextClassContent}>
                    <span className={styles.scheduleSubject}>{nextClass.title}</span>
                    <span className={styles.nextClassDate}>
                      {formatDateShort(nextClass.date)}, {nextClass.dayOfWeek}, {nextClass.time} - {nextClass.endTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
      </Block>

      {/* Мои активные задания */}
        <div className={styles.groupsSection}>
          <h2 className={styles.groupsTitle}>МОИ АКТИВНЫЕ ЗАДАНИЯ</h2>
          
        {isLoading ? (
            <div className={styles.currentHomeworkCard}>
              <div className={`${styles.currentHomeworkText} ${styles.loadingText}`}>
                Загрузка заданий...
              </div>
          </div>
        ) : activeHomework.length === 0 ? (
            <div className={styles.currentHomeworkCard}>
              <div className={`${styles.currentHomeworkText} ${styles.emptyText}`}>
                Нет активных заданий
              </div>
          </div>
        ) : (
            <div className={styles.groupsList}>
            {activeHomework.slice(0, 1).map((homework) => {
              const deadlineStatus = getDeadlineStatus(homework.deadline);

              return (
                  <div 
                  key={homework.id}
                    className={styles.groupCard}
                  >
                    <div className={styles.groupCardContent}>
                      <DocumentTextIcon className={`${styles.groupIcon} ${styles.homeworkIcon}`} />
                      <div className={`${styles.groupInfo} ${styles.flexInfo}`}>
                        <div className={styles.groupName}>{homework.description}</div>
                        <div className={styles.metaRow}>
                          <div 
                            className={styles.deadlineBadge}
                            style={{
                              backgroundColor: deadlineStatus.bgColor,
                              color: deadlineStatus.color,
                            }}
                          >
                            <ClockIcon className={styles.smallClockIcon} />
                            {deadlineStatus.text}
                          </div>
                        </div>
                        <span className={styles.deadlineText}>
                          Выполните до: {formatDate(homework.deadline)}
                        </span>
                      </div>
                    </div>
                  </div>
              );
            })}
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно настроек */}
      {isSettingsOpen && (
        <div className={styles.calendarModal} onClick={handleCloseSettings}>
          <div className={styles.calendarModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.createGroupHeader}>
              <h2 className={styles.createGroupTitle}>Настройки профиля</h2>
              <button onClick={handleCloseSettings} className={styles.createGroupCloseButton}>
                <XMarkIcon className={styles.calendarCloseIcon} />
              </button>
            </div>
            
            <form onSubmit={handleSaveProfile} className={styles.createGroupForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Имя <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                  className={styles.formInput}
                  placeholder="Введите имя"
                  required
                  disabled={isSaving || isDeleting}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Фамилия <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  type="text"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                  className={styles.formInput}
                  placeholder="Введите фамилию"
                  required
                  disabled={isSaving || isDeleting}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Дата рождения <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  type="date"
                  value={profileForm.birthDate}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, birthDate: e.target.value }))}
                  className={styles.formInput}
                  required
                  disabled={isSaving || isDeleting}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Часовой пояс <span className={styles.requiredStar}>*</span>
                </label>
                <select
                  value={profileForm.timezone}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, timezone: e.target.value }))}
                  className={styles.formSelect}
                  required
                  disabled={isSaving || isDeleting}
                >
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formActions}>
                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                  <button
                    type="button"
                    onClick={handleCloseSettings}
                    className={styles.formCancelButton}
                    disabled={isSaving || isDeleting}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className={styles.formSubmitButton}
                    disabled={isSaving || isDeleting || !profileForm.firstName.trim() || !profileForm.lastName.trim()}
                  >
                    {isSaving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteProfile}
                  className={styles.deleteProfileLink}
                  disabled={isSaving || isDeleting}
                >
                  {isDeleting ? 'Удаление...' : 'Удалить профиль'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Page>
  );
};

export default StudentDashboardPage;

