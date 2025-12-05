import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Navbar, Block } from 'konsta/react';
import { 
  CalendarIcon, 
  ClockIcon, 
  DocumentTextIcon,
  ArrowLeftIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../features/Auth/hooks/useAuth';
import { useTelegram } from '../hooks/useTelegram';
import type { Homework } from '../api/homeworkApi';
import { getHomeworkByGroup } from '../api/homeworkApi';
import { getGroups } from '../api/groupsApi';
import { getScheduleByGroup, type Schedule } from '../api/scheduleApi';
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
  const { user } = useAuth();
  const { user: telegramUser } = useTelegram();
  const [activeHomework, setActiveHomework] = useState<Homework[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [nextClass, setNextClass] = useState<NextClass | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Получение имени пользователя
  const userName = telegramUser?.firstName && telegramUser?.lastName 
    ? `${telegramUser.firstName} ${telegramUser.lastName}` 
    : user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : telegramUser?.firstName || user?.firstName || 'Ученик';

  const handleBack = () => {
    navigate(-1);
  };

  const handleMenu = () => {
    console.log('Открыть меню');
    // TODO: Open menu
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
          <button onClick={handleMenu} className={styles.navButton}>
            <EllipsisVerticalIcon className={styles.navIcon} />
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
                        <div className={`${styles.groupMeta} ${styles.columnMeta}`}>
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
                            <span className={styles.deadlineText}>
                          До: {formatDate(homework.deadline)}
                        </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
              );
            })}
            </div>
          )}
        </div>
      </div>
    </Page>
  );
};

export default StudentDashboardPage;

