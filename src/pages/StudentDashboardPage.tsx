import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Navbar, Block } from 'konsta/react';
import { 
  CalendarIcon, 
  ClockIcon, 
  DocumentTextIcon,
  ArrowLeftIcon,
  EllipsisVerticalIcon,
  XMarkIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../features/Auth/hooks/useAuth';
import { useTelegram } from '../hooks/useTelegram';
import type { HomeworkFrontend } from '../api/homeworkApi';
import { formatDateTime, isPast } from '../utils/timeFormat';
import styles from '../features/Groups/Dashboard.module.css';

const StudentDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { user: telegramUser } = useTelegram();
  const [activeHomework, setActiveHomework] = useState<HomeworkFrontend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<HomeworkFrontend | null>(null);
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);

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

  // Моковые данные расписания (в будущем из API)
  const mockSchedule = [
    { dayOfWeek: 'Понедельник', time: '18:00', title: 'Математика ОГЭ', group: 'Группа А', groupId: '1' },
    { dayOfWeek: 'Среда', time: '19:30', title: 'Алгебра', group: 'Иван П.', groupId: '2' },
    { dayOfWeek: 'Пятница', time: '18:00', title: 'Математика ОГЭ', group: 'Группа А', groupId: '1' },
  ];

  // Получить ближайшее занятие
  const getNextClass = () => {
    // Для демо используем первое занятие как ближайшее
    const nextClassDate = new Date();
    nextClassDate.setDate(nextClassDate.getDate() + 1); // Завтра
    nextClassDate.setHours(18, 0, 0, 0);
    
    const daysOfWeek = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const dayOfWeek = daysOfWeek[nextClassDate.getDay()];
    
    return {
      date: nextClassDate,
      dayOfWeek,
      time: '18:00',
      title: 'Математика ОГЭ',
      group: 'Группа А'
    };
  };

  const nextClass = getNextClass();
  
  const formatDateShort = (date: Date): string => {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long'
    });
  };

  useEffect(() => {
    // Загрузка активных заданий для ученика
    fetchActiveHomework();
  }, []);

  const fetchActiveHomework = async () => {
    setIsLoading(true);
    try {
      // В реальном приложении здесь будет API для получения заданий студента
      // Пока используем моковые данные
      // Моковые данные с файлами (в реальном приложении файлы будут приходить с API)
      const mockHomework: (HomeworkFrontend & { files?: string[] })[] = [
        {
          id: 'hw1',
          description: 'Квадратные уравнения: Решить номера №124, 125, 128 из учебника',
          groupId: '1',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // через 2 дня
          createdAt: new Date().toISOString(),
          reminderSent: false,
          files: ['Учебник_стр_45.pdf', 'Дополнительные_задачи.docx'],
        },
        {
          id: 'hw2',
          description: 'Тригонометрия: Выполнить упражнения на стр. 45',
          groupId: '2',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // через 5 дней
          createdAt: new Date().toISOString(),
          reminderSent: false,
          files: ['Тригонометрия_задачи.pdf'],
        },
      ];
      setActiveHomework(mockHomework);
    } catch (error) {
      console.error('Error fetching homework:', error);
    } finally {
      setIsLoading(false);
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
          {mockSchedule.map((item, index) => (
              <div key={index} className={styles.scheduleItem}>
                <ClockIcon className={styles.clockIcon} />
                <div className={styles.scheduleItemContent}>
                  <span className={styles.scheduleTime}>{item.dayOfWeek}, {item.time}</span>
                  <span className={styles.scheduleSeparator}> - </span>
                  <span className={styles.scheduleSubject}>{item.title}</span>
                  <span className={styles.scheduleGroup}>({item.group})</span>
                </div>
              </div>
            ))}
          </div>

          {/* Ближайшее занятие */}
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
                    {formatDateShort(nextClass.date)}, {nextClass.dayOfWeek}, {nextClass.time}
                  </span>
                  <span className={styles.scheduleGroup}>({nextClass.group})</span>
                </div>
              </div>
            </div>
          </div>
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
            {activeHomework.map((homework) => {
              const deadlineStatus = getDeadlineStatus(homework.dueDate);

              return (
                  <div 
                  key={homework.id}
                    className={`${styles.groupCard} ${styles.clickableCard}`}
                    onClick={() => {
                      setSelectedHomework(homework);
                      setIsHomeworkModalOpen(true);
                    }}
                  >
                    <div className={styles.groupCardContent}>
                      <DocumentTextIcon className={`${styles.groupIcon} ${styles.homeworkIcon}`} />
                      <div className={`${styles.groupInfo} ${styles.flexInfo}`}>
                        <div className={styles.groupName}>{homework.description}</div>
                        <div className={`${styles.groupMeta} ${styles.columnMeta}`}>
                          <div className={styles.descriptionText}>
                            {homework.description}
                          </div>
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
                          До: {formatDateTime(homework.dueDate)}
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

      {/* Модальное окно просмотра задания */}
      {isHomeworkModalOpen && selectedHomework && (
        <div 
          className={styles.homeworkModal} 
          onClick={() => {
            setIsHomeworkModalOpen(false);
            setSelectedHomework(null);
          }}
        >
          <div 
            className={styles.homeworkModalContent} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.homeworkModalHeader}>
              <h2 className={styles.homeworkModalTitle}>{selectedHomework.description}</h2>
              <button 
                onClick={() => {
                  setIsHomeworkModalOpen(false);
                  setSelectedHomework(null);
                }} 
                className={styles.homeworkModalCloseButton}
              >
                <XMarkIcon className={styles.homeworkModalCloseIcon} />
              </button>
            </div>
            
            <div className={`${styles.homeworkForm} ${styles.modalFormPadding}`}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Описание задания</label>
                <div className={styles.modalDescriptionBox}>
                  {selectedHomework.description}
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Дедлайн</label>
                <div className={styles.modalDateBox}>
                  {formatDateTime(selectedHomework.dueDate)}
                </div>
              </div>

              {/* Прикрепленные файлы */}
              {(selectedHomework as any).files && (selectedHomework as any).files.length > 0 && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Прикрепленные файлы</label>
                  <div className={styles.fileList}>
                    {(selectedHomework as any).files.map((file: string, index: number) => (
                      <div key={index} className={styles.fileItem}>
                        <PaperClipIcon className={`${styles.fileIcon} ${styles.fileIconBlue}`} />
                        <span 
                          className={`${styles.fileName} ${styles.clickableFile}`}
                          onClick={() => {
                            // В реальном приложении здесь будет открытие файла
                            if (window.Telegram?.WebApp) {
                              window.Telegram.WebApp.showAlert(`Файл: ${file}\n\nВ реальном приложении здесь будет ссылка для скачивания файла.`);
                            } else {
                              alert(`Файл: ${file}\n\nВ реальном приложении здесь будет ссылка для скачивания файла.`);
                            }
                          }}
                        >
                          {file}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Page>
  );
};

export default StudentDashboardPage;

