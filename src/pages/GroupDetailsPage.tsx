import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Page, Navbar } from 'konsta/react';
import { 
  DocumentTextIcon, 
  CalendarIcon,
  UserGroupIcon,
  ArrowLeftIcon,
  EllipsisVerticalIcon,
  PaperClipIcon,
  PlusIcon,
  XMarkIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { getGroupById, updateGroup, deleteGroup, updateGroupStatus } from '../api/groupsApi';
import type { GroupFrontend } from '../api/groupsApi';
import { useTelegram } from '../hooks/useTelegram';
import { useHomework } from '../features/Homework/hooks/useHomework';
import type { CreateHomeworkDto } from '../api/homeworkApi';
import { 
  getScheduleByGroup, 
  createSchedule, 
  updateSchedule, 
  deleteSchedule,
  scheduleHelpers 
} from '../api/scheduleApi';
import { generateInviteLink } from '../utils/linkHelpers';
import styles from '../features/Groups/GroupDetails.module.css';

const GroupDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { webApp } = useTelegram();
  const [activeTab, setActiveTab] = useState<'students' | 'schedule' | 'tasks'>('tasks');
  const [group, setGroup] = useState<GroupFrontend | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
  const [homeworkTitle, setHomeworkTitle] = useState('');
  const [homeworkDescription, setHomeworkDescription] = useState('');
  const [homeworkDueDate, setHomeworkDueDate] = useState('');
  const [homeworkFiles, setHomeworkFiles] = useState<File[]>([]);
  const [isCreatingHomework, setIsCreatingHomework] = useState(false);
  const [isInviteLinkVisible, setIsInviteLinkVisible] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);
  const [homeworkToDelete, setHomeworkToDelete] = useState<string | null>(null);
  const [editingHomeworkId, setEditingHomeworkId] = useState<string | null>(null);
  const [scheduleItems, setScheduleItems] = useState<Array<{
    id: string;
    dayOfWeek: string;
    startTime: string;
    duration: number;
    meetingLink?: string;
  }>>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleFormData, setScheduleFormData] = useState({
    dayOfWeek: '',
    startTime: '',
    duration: '90',
    meetingLink: ''
  });
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const { fetchHomework, create, update, remove, homework } = useHomework(id || undefined);

  useEffect(() => {
    if (id) {
      fetchGroup();
      fetchHomework();
      fetchSchedule();
    }
  }, [id]);

  useEffect(() => {
    if (group) {
      setGroupName(group.name);
    }
  }, [group]);

  const fetchSchedule = async () => {
    if (!id) return;
    
    const groupId = parseInt(id, 10);
    if (isNaN(groupId)) {
      console.error('[fetchSchedule] Invalid group ID:', id);
      return;
    }

    setIsLoadingSchedule(true);
    try {
      const schedules = await getScheduleByGroup(groupId);
      const transformed = schedules.map(schedule => scheduleHelpers.apiToDisplay(schedule));
      setScheduleItems(transformed);
      console.log('[fetchSchedule] ✅ Schedule fetched successfully:', transformed);
    } catch (err: any) {
      console.error('[fetchSchedule] ❌ Error fetching schedule:', {
        error: err,
        groupId,
        status: err.response?.status,
        responseData: err.response?.data,
      });
      // В случае ошибки оставляем пустой массив
      setScheduleItems([]);
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  useEffect(() => {
    // Скрываем MainButton Telegram на всех вкладках
    if (webApp) {
      webApp.MainButton.hide();
    }

    return () => {
      if (webApp) {
        webApp.MainButton.offClick(() => {});
        webApp.MainButton.hide();
      }
    };
  }, [webApp]);

  const fetchGroup = async () => {
    if (!id) {
      console.error('[fetchGroup] No id provided from URL params');
      return;
    }

    console.log('[fetchGroup] Starting fetch, id from URL:', {
      id,
      idType: typeof id,
      idValue: id,
      currentUrl: window.location.href,
      pathname: window.location.pathname,
    });

    setIsLoading(true);
    try {
      // Убеждаемся, что ID передается правильно (может быть строкой или числом)
      const data = await getGroupById(id);
      console.log('[fetchGroup] ✅ Group fetched successfully:', data);
      setGroup(data);
    } catch (err: any) {
      console.error('[fetchGroup] ❌ Error fetching group:', {
        error: err,
        id,
        idType: typeof id,
        status: err.response?.status,
        statusText: err.response?.statusText,
        responseData: err.response?.data,
        requestUrl: err.config?.url,
        requestBaseURL: err.config?.baseURL,
        fullRequestUrl: err.config?.baseURL ? `${err.config.baseURL}${err.config.url}` : err.config?.url,
      });
      // Не используем моковые данные - редирект на dashboard
      setGroup(null);
      // Редирект на dashboard, если группа не найдена
      navigate('/teacher/dashboard');
    } finally {
      setIsLoading(false);
    }
  };


  const handleBack = () => {
    navigate(-1);
  };

  const handleMenu = () => {
    if (group) {
      setGroupName(group.name);
      setIsGroupSettingsOpen(true);
    }
  };

  const handleCloseGroupSettings = () => {
    setIsGroupSettingsOpen(false);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !groupName.trim()) return;

    setIsSaving(true);
    try {
      const updatedGroup = await updateGroup(id, { name: groupName.trim() });
      setGroup(updatedGroup);
      setIsGroupSettingsOpen(false);

      if (window.Telegram?.WebApp) {
        try {
          window.Telegram.WebApp.showAlert('Название группы успешно обновлено!');
        } catch (error) {
          alert('Название группы успешно обновлено!');
        }
      } else {
        alert('Название группы успешно обновлено!');
      }
    } catch (error: any) {
      console.error('Error updating group:', error);
      let errorMessage = 'Ошибка при обновлении группы. Попробуйте снова.';
      
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

  const handleToggleGroupStatus = async () => {
    if (!id || !group) return;

    setIsTogglingStatus(true);
    try {
      const newStatus = !group.isActive;
      const updatedGroup = await updateGroupStatus(id, newStatus);
      setGroup(updatedGroup);

      const statusMessage = updatedGroup.isActive 
        ? 'Группа возобновлена'
        : 'Группа приостановлена';

      if (window.Telegram?.WebApp) {
        try {
          window.Telegram.WebApp.showAlert(statusMessage);
        } catch (error) {
          alert(statusMessage);
        }
      } else {
        alert(statusMessage);
      }
    } catch (error: any) {
      console.error('Error toggling group status:', error);
      let errorMessage = 'Ошибка при изменении статуса группы. Попробуйте снова.';
      
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
      setIsTogglingStatus(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!id) return;

    const confirmMessage = 'Вы уверены, что хотите удалить эту группу? Это действие нельзя отменить.';
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
      await deleteGroup(id);
      navigate('/teacher/dashboard');
    } catch (error: any) {
      console.error('Error deleting group:', error);
      let errorMessage = 'Ошибка при удалении группы. Попробуйте снова.';
      
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

  const handleCopyInviteLink = () => {
    if (!group?.inviteToken) return;
    
    const inviteLink = generateInviteLink(group.inviteToken);
    
    navigator.clipboard.writeText(inviteLink)
      .then(() => {
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.showAlert('Ссылка скопирована!');
        } else {
          alert('Ссылка скопирована!');
        }
      })
      .catch(err => {
        console.error('Ошибка копирования:', err);
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.showAlert('Не удалось скопировать ссылку.');
        } else {
          alert('Не удалось скопировать ссылку.');
        }
      });
  };

  const handleRemoveStudent = (studentId: string) => {
    setStudentToDelete(studentId);
  };

  const handleConfirmDelete = () => {
    if (!studentToDelete || !group) return;

    // TODO: Вызов API для удаления ученика
    console.log('Удаление ученика:', studentToDelete);
    
    // Обновляем локальное состояние
    setGroup({
      ...group,
      students: group.students?.filter(id => id !== studentToDelete) || []
    });

    // Показываем уведомление об успехе
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.showAlert('Ученик удален из группы');
    } else {
      alert('Ученик удален из группы');
    }

    setStudentToDelete(null);
  };

  const handleCancelDelete = () => {
    setStudentToDelete(null);
  };

  // Функция для вычисления времени окончания
  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    startDate.setMinutes(startDate.getMinutes() + durationMinutes);
    
    const endHours = startDate.getHours().toString().padStart(2, '0');
    const endMinutes = startDate.getMinutes().toString().padStart(2, '0');
    return `${endHours}:${endMinutes}`;
  };

  // Функции для работы с расписанием
  const handleOpenScheduleModal = (scheduleId?: string) => {
    if (scheduleId) {
      const scheduleItem = scheduleItems.find(item => item.id === scheduleId);
      if (scheduleItem) {
        setScheduleFormData({
          dayOfWeek: scheduleItem.dayOfWeek,
          startTime: scheduleItem.startTime,
          duration: scheduleItem.duration.toString(),
          meetingLink: scheduleItem.meetingLink || ''
        });
        setEditingScheduleId(scheduleId);
      }
    } else {
      setScheduleFormData({
        dayOfWeek: '',
        startTime: '',
        duration: '90',
        meetingLink: ''
      });
      setEditingScheduleId(null);
    }
    setIsScheduleModalOpen(true);
  };

  const handleCloseScheduleModal = () => {
    setIsScheduleModalOpen(false);
    setEditingScheduleId(null);
    setScheduleFormData({
      dayOfWeek: '',
      startTime: '',
      duration: '90',
      meetingLink: ''
    });
  };

  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !scheduleFormData.dayOfWeek.trim() || !scheduleFormData.startTime.trim()) {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert('Пожалуйста, заполните все обязательные поля');
      } else {
        alert('Пожалуйста, заполните все обязательные поля');
      }
      return;
    }

    const groupId = parseInt(id, 10);
    if (isNaN(groupId)) {
      console.error('[handleSubmitSchedule] Invalid group ID:', id);
      return;
    }

    setIsLoadingSchedule(true);
    try {
      if (editingScheduleId) {
        // Редактирование существующего элемента
        const scheduleId = parseInt(editingScheduleId, 10);
        if (isNaN(scheduleId)) {
          throw new Error('Invalid schedule ID');
        }

        const updateData = {
          day_of_week: scheduleHelpers.formToApi(scheduleFormData, groupId).day_of_week,
          time_at: scheduleHelpers.formToApi(scheduleFormData, groupId).time_at,
          meeting_link: scheduleFormData.meetingLink || undefined,
        };

        const updated = await updateSchedule(scheduleId, updateData);
        const transformed = scheduleHelpers.apiToDisplay(updated);
        
        setScheduleItems(prev => prev.map(item => 
          item.id === editingScheduleId ? transformed : item
        ));

        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.showAlert('Расписание успешно обновлено!');
        } else {
          alert('Расписание успешно обновлено!');
        }
      } else {
        // Добавление нового элемента
        const createData = scheduleHelpers.formToApi(scheduleFormData, groupId);
        const created = await createSchedule(createData);
        const transformed = scheduleHelpers.apiToDisplay(created);
        
        setScheduleItems(prev => [...prev, transformed]);

        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.showAlert('Занятие успешно добавлено в расписание!');
        } else {
          alert('Занятие успешно добавлено в расписание!');
        }
      }

      handleCloseScheduleModal();
    } catch (error: any) {
      console.error('[handleSubmitSchedule] Error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Ошибка при сохранении расписания';
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert(errorMessage);
      } else {
        alert(errorMessage);
      }
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    setScheduleToDelete(scheduleId);
  };

  const handleConfirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return;

    const scheduleId = parseInt(scheduleToDelete, 10);
    if (isNaN(scheduleId)) {
      console.error('[handleConfirmDeleteSchedule] Invalid schedule ID:', scheduleToDelete);
      setScheduleToDelete(null);
      return;
    }

    setIsLoadingSchedule(true);
    try {
      await deleteSchedule(scheduleId);
      setScheduleItems(prev => prev.filter(item => item.id !== scheduleToDelete));
      
      // Показываем уведомление об успехе
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert('Занятие удалено из расписания');
      } else {
        alert('Занятие удалено из расписания');
      }
    } catch (error: any) {
      console.error('[handleConfirmDeleteSchedule] Error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Ошибка при удалении расписания';
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert(errorMessage);
      } else {
        alert(errorMessage);
      }
    } finally {
      setIsLoadingSchedule(false);
      setScheduleToDelete(null);
    }
  };

  const handleCancelDeleteSchedule = () => {
    setScheduleToDelete(null);
  };

  const handleOpenHomeworkModal = (homeworkId?: string) => {
    if (homeworkId) {
      const homeworkItem = homework.find(hw => hw.id === homeworkId);
      if (homeworkItem) {
        setHomeworkTitle(homeworkItem.title);
        setHomeworkDescription(homeworkItem.description);
        // Преобразуем ISO дату в формат YYYY-MM-DD для input type="date"
        const dueDate = new Date(homeworkItem.dueDate);
        const year = dueDate.getFullYear();
        const month = String(dueDate.getMonth() + 1).padStart(2, '0');
        const day = String(dueDate.getDate()).padStart(2, '0');
        setHomeworkDueDate(`${year}-${month}-${day}`);
        setEditingHomeworkId(homeworkId);
      }
    } else {
      setEditingHomeworkId(null);
    }
    setIsHomeworkModalOpen(true);
  };

  const handleCloseHomeworkModal = () => {
    setIsHomeworkModalOpen(false);
    setHomeworkTitle('');
    setHomeworkDescription('');
    setHomeworkDueDate('');
    setHomeworkFiles([]);
    setEditingHomeworkId(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const validFiles = Array.from(files).filter(file => {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        const validExtensions = ['pdf', 'doc', 'docx', 'mp3', 'jpeg', 'jpg', 'png'];
        return fileExtension && validExtensions.includes(fileExtension);
      });
      
      if (validFiles.length !== files.length) {
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.showAlert('Разрешены только файлы: PDF, Word (doc, docx), MP3, изображения (jpeg, jpg, png)');
        } else {
          alert('Разрешены только файлы: PDF, Word (doc, docx), MP3, изображения (jpeg, jpg, png)');
        }
      }
      
      setHomeworkFiles(prev => [...prev, ...validFiles]);
    }
    // Сброс input для возможности выбрать тот же файл снова
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setHomeworkFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return '📄';
    if (['doc', 'docx'].includes(extension || '')) return '📝';
    if (extension === 'mp3') return '🎵';
    if (['jpeg', 'jpg', 'png'].includes(extension || '')) return '🖼️';
    return '📎';
  };

  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!homeworkTitle.trim() || !homeworkDescription.trim() || !homeworkDueDate || !id) {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert('Пожалуйста, заполните все обязательные поля');
      } else {
        alert('Пожалуйста, заполните все обязательные поля');
      }
      return;
    }

    setIsCreatingHomework(true);
    try {
      const homeworkData: CreateHomeworkDto = {
        title: homeworkTitle.trim(),
        description: homeworkDescription.trim(),
        groupId: id,
        dueDate: new Date(homeworkDueDate).toISOString(),
      };
      
      if (editingHomeworkId) {
        // Редактирование существующего задания
        await update(editingHomeworkId, homeworkData);
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.showAlert('Задание успешно обновлено!');
        } else {
          alert('Задание успешно обновлено!');
        }
      } else {
        // Создание нового задания
        await create(homeworkData);
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.showAlert('Задание успешно создано!');
        } else {
          alert('Задание успешно создано!');
        }
      }
      
      // Закрываем модальное окно и обновляем список заданий
      handleCloseHomeworkModal();
      fetchHomework();
    } catch (error) {
      console.error('Error saving homework:', error);
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert('Ошибка при сохранении задания. Попробуйте снова.');
      } else {
        alert('Ошибка при сохранении задания');
      }
    } finally {
      setIsCreatingHomework(false);
    }
  };

  const handleDeleteHomework = (homeworkId: string) => {
    setHomeworkToDelete(homeworkId);
  };

  const handleConfirmDeleteHomework = async () => {
    if (!homeworkToDelete) return;

    try {
      await remove(homeworkToDelete);
      
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert('Задание удалено');
      } else {
        alert('Задание удалено');
      }
      
      setHomeworkToDelete(null);
      fetchHomework();
    } catch (error) {
      console.error('Error deleting homework:', error);
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert('Ошибка при удалении задания. Попробуйте снова.');
      } else {
        alert('Ошибка при удалении задания');
      }
    }
  };

  const handleCancelDeleteHomework = () => {
    setHomeworkToDelete(null);
  };

  return (
    <Page className={styles.page}>
      <Navbar 
        title={isLoading ? 'Загрузка...' : (group?.name || 'Группа')} 
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
        {/* Сегментированный контрол */}
        <div className={styles.segmentedControl}>
          <button
            className={`${styles.segmentedButton} ${
              activeTab === 'students' ? styles.segmentedButtonActive : ''
            }`}
            onClick={() => setActiveTab('students')}
          >
            <UserGroupIcon className={styles.segmentedButtonIcon} />
            Ученики
          </button>
          <button
            className={`${styles.segmentedButton} ${
              activeTab === 'schedule' ? styles.segmentedButtonActive : ''
            }`}
            onClick={() => setActiveTab('schedule')}
          >
            <CalendarIcon className={styles.segmentedButtonIcon} />
            Расписание
          </button>
          <button
            className={`${styles.segmentedButton} ${
              activeTab === 'tasks' ? styles.segmentedButtonActive : ''
            }`}
            onClick={() => setActiveTab('tasks')}
          >
            <DocumentTextIcon className={styles.segmentedButtonIcon} />
            Задания
          </button>
        </div>

      {activeTab === 'tasks' && (
        <>
            {/* Секция актуальных заданий */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>АКТУАЛЬНЫЕ ЗАДАНИЯ</h2>
              
              <div className={styles.pastHomeworkList}>
                {homework.length > 0 ? (
                  homework.map((task) => {
                    const dueDate = new Date(task.dueDate);
                    const isPast = dueDate < new Date();
                    const formattedDate = dueDate.toLocaleDateString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    });
                    
                    return (
                      <div key={task.id} className={styles.pastHomeworkCard}>
                        <DocumentTextIcon className={`${styles.pastHomeworkIcon} ${isPast ? styles.iconGray : styles.iconBlue}`} />
                        <div className={`${styles.pastHomeworkContent} ${styles.flexContent}`}>
                          <div className={styles.pastHomeworkTitle}>{task.title}</div>
                          <div className={styles.pastHomeworkStatus}>
                            Дедлайн: {formattedDate}
                          </div>
                          {task.description && (
                            <div className={`${styles.pastHomeworkStatus} ${styles.smallStatusText}`}>
                              {task.description.length > 50 ? `${task.description.substring(0, 50)}...` : task.description}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenHomeworkModal(task.id);
                          }}
                          className={styles.scheduleEditButton}
                          aria-label="Редактировать"
                        >
                          <PencilIcon className={styles.scheduleEditIcon} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteHomework(task.id);
                          }}
                          className={styles.removeStudentButton}
                          aria-label="Удалить"
                        >
                          <TrashIcon className={styles.removeStudentIcon} />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.currentHomeworkCard}>
                    <div className={styles.currentHomeworkText}>Нет заданий</div>
                  </div>
                )}
              </div>
            </div>

          </>
        )}

        {/* Кнопка добавления задания */}
        {activeTab === 'tasks' && (
          <button
            className={styles.addScheduleButton}
            onClick={() => handleOpenHomeworkModal()}
          >
            <PlusIcon className={styles.addScheduleIcon} />
            Добавить задание
          </button>
        )}

        {activeTab === 'students' && (
          <>
            {/* Список учеников */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>УЧЕНИКИ</h2>
              <div className={styles.pastHomeworkList}>
                {group?.students && group.students.length > 0 ? (
                  group.students.map((studentId, index) => (
                    <div key={index} className={styles.pastHomeworkCard}>
                      <UserGroupIcon className={`${styles.pastHomeworkIcon} ${styles.iconBlue}`} />
                      <div className={styles.pastHomeworkContent}>
                        <div className={styles.pastHomeworkTitle}>{studentId}</div>
                        <div className={`${styles.pastHomeworkStatus} ${styles.greenStatus}`}>
                          Активен
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveStudent(studentId);
                        }}
                        className={styles.removeStudentButton}
                        aria-label="Удалить ученика"
                      >
                        <TrashIcon className={styles.removeStudentIcon} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className={styles.currentHomeworkCard}>
                    <div className={styles.currentHomeworkText}>Нет учеников в группе</div>
                  </div>
                )}
              </div>
            </div>

            {/* Блок приглашения внизу */}
            {group?.inviteToken && (
              <div className={styles.section}>
                <div className={styles.inviteHeader}>
                  <h2 className={styles.sectionTitle}>ПРИГЛАШЕНИЕ УЧЕНИКОВ</h2>
                  <button
                    onClick={() => setIsInviteLinkVisible(!isInviteLinkVisible)}
                    className={styles.inviteToggleButton}
                    aria-label={isInviteLinkVisible ? 'Скрыть ссылку' : 'Показать ссылку'}
                  >
                    {isInviteLinkVisible ? (
                      <ChevronUpIcon className={styles.inviteToggleIcon} />
                    ) : (
                      <ChevronDownIcon className={styles.inviteToggleIcon} />
                    )}
                  </button>
                </div>
                
                {isInviteLinkVisible && (
                  <div className={styles.inviteBlock}>
                    <div className={styles.inviteLinkCard}>
                      <LinkIcon className={styles.inviteLinkIcon} />
                      <div className={styles.inviteLinkContent}>
                        <div className={styles.inviteLinkLabel}>Ссылка для группы</div>
                        <div className={styles.inviteLinkValue} title={generateInviteLink(group?.inviteToken || '')}>
                          {generateInviteLink(group?.inviteToken || '')}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleCopyInviteLink}
                      className={styles.inviteCopyButton}
                    >
                      <ClipboardDocumentIcon className={styles.inviteCopyIcon} />
                      КОПИРОВАТЬ ССЫЛКУ
                    </button>
                    
                    <div className={styles.inviteHint}>
                      Ученик должен нажать на ссылку и запустить бота.
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'schedule' && (
          <>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>РАСПИСАНИЕ</h2>
              <div className={styles.pastHomeworkList}>
                {isLoadingSchedule ? (
                  <div className={styles.currentHomeworkCard}>
                    <div className={styles.currentHomeworkText}>Загрузка расписания...</div>
                  </div>
                ) : scheduleItems.length > 0 ? (
                  scheduleItems.map((item) => {
                    const endTime = calculateEndTime(item.startTime, item.duration);
                    return (
                      <div key={item.id} className={styles.pastHomeworkCard}>
                        <CalendarIcon className={`${styles.pastHomeworkIcon} ${styles.iconBlue}`} />
                        <div className={`${styles.pastHomeworkContent} ${styles.flexContent}`}>
                          <div className={styles.pastHomeworkTitle}>{item.dayOfWeek}</div>
                          <div className={styles.pastHomeworkStatus}>{item.startTime} - {endTime}</div>
                          {item.meetingLink && (
                            <div className={styles.pastHomeworkStatus}>
                              <LinkIcon className={styles.inviteLinkIcon} style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px' }} />
                              <a href={item.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                                Ссылка на встречу
                              </a>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenScheduleModal(item.id);
                          }}
                          className={styles.scheduleEditButton}
                          aria-label="Редактировать"
                          disabled={isLoadingSchedule}
                        >
                          <PencilIcon className={styles.scheduleEditIcon} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSchedule(item.id);
                          }}
                          className={styles.removeStudentButton}
                          aria-label="Удалить"
                          disabled={isLoadingSchedule}
                        >
                          <TrashIcon className={styles.removeStudentIcon} />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.currentHomeworkCard}>
                    <div className={styles.currentHomeworkText}>Нет занятий в расписании</div>
                  </div>
                )}
              </div>
            </div>

            {/* Кнопка добавления занятия */}
            <button
              className={styles.addScheduleButton}
              onClick={() => handleOpenScheduleModal()}
            >
              <PlusIcon className={styles.addScheduleIcon} />
              Добавить занятие
            </button>
          </>
        )}
      </div>

      {/* Модальное окно создания домашнего задания */}
      {isHomeworkModalOpen && (
        <div className={styles.homeworkModal} onClick={handleCloseHomeworkModal}>
          <div className={styles.homeworkModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.homeworkModalHeader}>
              <h2 className={styles.homeworkModalTitle}>
                {editingHomeworkId ? 'Редактировать задание' : 'Новое домашнее задание'}
              </h2>
              <button onClick={handleCloseHomeworkModal} className={styles.homeworkModalCloseButton}>
                <XMarkIcon className={styles.homeworkModalCloseIcon} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitHomework} className={styles.homeworkForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Тема задания <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  type="text"
                  value={homeworkTitle}
                  onChange={(e) => setHomeworkTitle(e.target.value)}
                  placeholder="Например: Квадратные уравнения"
                  className={styles.formInput}
                  required
                  disabled={isCreatingHomework}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Описание задания <span className={styles.requiredStar}>*</span>
                </label>
                <textarea
                  value={homeworkDescription}
                  onChange={(e) => setHomeworkDescription(e.target.value)}
                  placeholder="Решить номера №124, 125, 128 из учебника..."
                  className={styles.formTextarea}
                  rows={4}
                  required
                  disabled={isCreatingHomework}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Дедлайн <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  type="date"
                  value={homeworkDueDate}
                  onChange={(e) => setHomeworkDueDate(e.target.value)}
                  className={styles.formInput}
                  required
                  disabled={isCreatingHomework}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Прикрепить файлы (PDF, Word, MP3)
                </label>
                
                {/* Список выбранных файлов */}
                {homeworkFiles.length > 0 && (
                  <div className={styles.fileList}>
                    {homeworkFiles.map((file, index) => (
                      <div key={index} className={styles.fileItem}>
                        <span className={styles.fileIcon}>{getFileIcon(file.name)}</span>
                        <span className={styles.fileName} title={file.name}>
                          {file.name.length > 30 ? `${file.name.substring(0, 30)}...` : file.name}
                        </span>
                        <span className={styles.fileSize}>
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className={styles.fileRemoveButton}
                          disabled={isCreatingHomework}
                          aria-label="Удалить файл"
                        >
                          <XMarkIcon className={styles.fileRemoveIcon} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Кнопка для выбора файлов */}
                <label className={styles.fileUploadButton}>
                  <PaperClipIcon className={styles.fileUploadIcon} />
                  <span>Выбрать файлы</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.mp3,.jpeg,.jpg,.png"
                    multiple
                    onChange={handleFileSelect}
                    className={styles.fileInput}
                    disabled={isCreatingHomework}
                  />
                </label>
                <div className={styles.fileHint}>
                  Разрешены файлы: PDF, Word (doc, docx), MP3, изображения (jpeg, jpg, png)
                </div>
              </div>
              
              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={handleCloseHomeworkModal}
                  className={styles.formCancelButton}
                  disabled={isCreatingHomework}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className={styles.formSubmitButton}
                  disabled={isCreatingHomework || !homeworkTitle.trim() || !homeworkDescription.trim() || !homeworkDueDate}
                >
                  {isCreatingHomework 
                    ? (editingHomeworkId ? 'Сохранение...' : 'Создание...') 
                    : (editingHomeworkId ? 'Сохранить изменения' : 'Создать задание')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения удаления ученика */}
      {studentToDelete && (
        <div className={styles.deleteModal} onClick={handleCancelDelete}>
          <div className={styles.deleteModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.deleteModalHeader}>
              <h3 className={styles.deleteModalTitle}>Подтверждение удаления</h3>
            </div>
            
            <div className={styles.deleteModalBody}>
              <p className={styles.deleteModalText}>
                Вы уверены, что хотите удалить ученика <strong>{studentToDelete}</strong> из группы?
              </p>
              <p className={styles.deleteModalWarning}>
                Это действие нельзя отменить.
              </p>
            </div>
            
            <div className={styles.deleteModalActions}>
              <button
                onClick={handleCancelDelete}
                className={styles.deleteCancelButton}
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmDelete}
                className={styles.deleteConfirmButton}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования расписания */}
      {isScheduleModalOpen && (
        <div className={styles.homeworkModal} onClick={handleCloseScheduleModal}>
          <div className={styles.homeworkModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.homeworkModalHeader}>
              <h2 className={styles.homeworkModalTitle}>
                {editingScheduleId ? 'Редактировать занятие' : 'Добавить занятие'}
              </h2>
              <button onClick={handleCloseScheduleModal} className={styles.homeworkModalCloseButton}>
                <XMarkIcon className={styles.homeworkModalCloseIcon} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitSchedule} className={styles.homeworkForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  День недели <span className={styles.requiredStar}>*</span>
                </label>
                <select
                  value={scheduleFormData.dayOfWeek}
                  onChange={(e) => setScheduleFormData(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                  className={styles.formInput}
                  required
                  disabled={isLoadingSchedule}
                >
                  <option value="">Выберите день</option>
                  <option value="Понедельник">Понедельник</option>
                  <option value="Вторник">Вторник</option>
                  <option value="Среда">Среда</option>
                  <option value="Четверг">Четверг</option>
                  <option value="Пятница">Пятница</option>
                  <option value="Суббота">Суббота</option>
                  <option value="Воскресенье">Воскресенье</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Время начала <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  type="time"
                  value={scheduleFormData.startTime}
                  onChange={(e) => setScheduleFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className={styles.formInput}
                  required
                  disabled={isLoadingSchedule}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Продолжительность занятия (минуты) <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  type="number"
                  value={scheduleFormData.duration}
                  onChange={(e) => setScheduleFormData(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="Например: 90"
                  className={styles.formInput}
                  min="1"
                  required
                  disabled={isLoadingSchedule}
                />
                <div className={`${styles.fileHint} ${styles.fileHintMargin}`}>
                  Введите продолжительность в минутах (например: 90 для полуторачасового занятия)
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Ссылка на встречу (Zoom, Google Meet и т.д.)
                </label>
                <input
                  type="url"
                  value={scheduleFormData.meetingLink}
                  onChange={(e) => setScheduleFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                  placeholder="https://zoom.us/j/..."
                  className={styles.formInput}
                  disabled={isLoadingSchedule}
                />
                <div className={`${styles.fileHint} ${styles.fileHintMargin}`}>
                  Необязательное поле. Ссылка на онлайн-встречу для занятия
                </div>
              </div>
              
              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={handleCloseScheduleModal}
                  className={styles.formCancelButton}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className={styles.formSubmitButton}
                  disabled={isLoadingSchedule || !scheduleFormData.dayOfWeek.trim() || !scheduleFormData.startTime.trim()}
                >
                  {isLoadingSchedule 
                    ? (editingScheduleId ? 'Сохранение...' : 'Создание...') 
                    : (editingScheduleId ? 'Сохранить' : 'Добавить')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения удаления занятия */}
      {scheduleToDelete && (() => {
        const scheduleItem = scheduleItems.find(item => item.id === scheduleToDelete);
        if (!scheduleItem) return null;
        const endTime = calculateEndTime(scheduleItem.startTime, scheduleItem.duration);
        return (
          <div className={styles.deleteModal} onClick={handleCancelDeleteSchedule}>
            <div className={styles.deleteModalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.deleteModalHeader}>
                <h3 className={styles.deleteModalTitle}>Подтверждение удаления</h3>
              </div>
              
              <div className={styles.deleteModalBody}>
                <p className={styles.deleteModalText}>
                  Вы действительно хотите удалить занятие <strong>({scheduleItem.dayOfWeek}, {scheduleItem.startTime} - {endTime})</strong>?
                </p>
                <p className={styles.deleteModalWarning}>
                  Это действие нельзя отменить.
                </p>
              </div>
              
              <div className={styles.deleteModalActions}>
                <button
                  onClick={handleCancelDeleteSchedule}
                  className={styles.deleteCancelButton}
                >
                  Отмена
                </button>
                <button
                  onClick={handleConfirmDeleteSchedule}
                  className={styles.deleteConfirmButton}
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Модальное окно подтверждения удаления задания */}
      {homeworkToDelete && (() => {
        const homeworkItem = homework.find(item => item.id === homeworkToDelete);
        if (!homeworkItem) return null;
        return (
          <div className={styles.deleteModal} onClick={handleCancelDeleteHomework}>
            <div className={styles.deleteModalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.deleteModalHeader}>
                <h3 className={styles.deleteModalTitle}>Подтверждение удаления</h3>
              </div>
              
              <div className={styles.deleteModalBody}>
                <p className={styles.deleteModalText}>
                  Вы действительно хотите удалить задание <strong>"{homeworkItem.title}"</strong>?
                </p>
                <p className={styles.deleteModalWarning}>
                  Это действие нельзя отменить.
                </p>
              </div>
              
              <div className={styles.deleteModalActions}>
                <button
                  onClick={handleCancelDeleteHomework}
                  className={styles.deleteCancelButton}
                >
                  Отмена
                </button>
                <button
                  onClick={handleConfirmDeleteHomework}
                  className={styles.deleteConfirmButton}
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Модальное окно настроек группы */}
      {isGroupSettingsOpen && group && (
        <div className={styles.calendarModal} onClick={handleCloseGroupSettings}>
          <div className={styles.calendarModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.createGroupHeader}>
              <h2 className={styles.createGroupTitle}>Настройки группы</h2>
              <button onClick={handleCloseGroupSettings} className={styles.createGroupCloseButton}>
                <XMarkIcon className={styles.calendarCloseIcon} />
              </button>
            </div>
            
            <form onSubmit={handleSaveGroup} className={styles.createGroupForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Название группы <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className={styles.formInput}
                  placeholder="Введите название группы"
                  required
                  disabled={isSaving || isDeleting || isTogglingStatus}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Статус группы
                </label>
                <button
                  type="button"
                  onClick={handleToggleGroupStatus}
                  className={styles.formStatusButton}
                  disabled={isSaving || isDeleting || isTogglingStatus}
                >
                  {isTogglingStatus 
                    ? 'Изменение...' 
                    : !group.isActive 
                      ? 'Возобновить группу' 
                      : 'Приостановить группу'}
                </button>
                {!group.isActive && (
                  <p className={styles.statusHint}>Группа приостановлена</p>
                )}
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={handleDeleteGroup}
                  className={styles.formDeleteButton}
                  disabled={isSaving || isDeleting || isTogglingStatus}
                >
                  {isDeleting ? 'Удаление...' : 'Удалить группу'}
                </button>
                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                  <button
                    type="button"
                    onClick={handleCloseGroupSettings}
                    className={styles.formCancelButton}
                    disabled={isSaving || isDeleting || isTogglingStatus}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className={styles.formSubmitButton}
                    disabled={isSaving || isDeleting || isTogglingStatus || !groupName.trim()}
                  >
                    {isSaving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </Page>
  );
};

export default GroupDetailsPage;

