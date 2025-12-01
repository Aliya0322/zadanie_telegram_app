import apiClient from './apiClient';

// Интерфейсы соответствуют бэкенд схемам из Pydantic
export interface Schedule {
  id: number;
  group_id: number;
  day_of_week: string; // "monday", "tuesday", etc. (DayOfWeek enum)
  time_at: string; // Time string in format "HH:MM:SS" or "HH:MM"
  duration: number | null; // Продолжительность в минутах
  meeting_link: string | null;
}

// Интерфейс для фронтенда (camelCase для удобства)
export interface ScheduleFrontend {
  id: string;
  groupId: string;
  dayOfWeek: string;
  timeAt: string;
  duration?: number;
  meetingLink?: string;
}

export interface CreateScheduleDto {
  group_id: number;
  day_of_week: string; // "monday", "tuesday", etc. (DayOfWeek enum)
  time_at: string; // Time string in format "HH:MM:SS" or "HH:MM"
  duration?: number | null; // Продолжительность в минутах
  meeting_link?: string | null;
}

export interface UpdateScheduleDto {
  day_of_week?: string;
  time_at?: string; // Time string in format "HH:MM:SS" or "HH:MM"
  duration?: number | null;
  meeting_link?: string | null;
}

// Преобразование дня недели из русского в английский формат API
const dayOfWeekToApi = (day: string): string => {
  const mapping: Record<string, string> = {
    'Понедельник': 'monday',
    'Вторник': 'tuesday',
    'Среда': 'wednesday',
    'Четверг': 'thursday',
    'Пятница': 'friday',
    'Суббота': 'saturday',
    'Воскресенье': 'sunday',
  };
  return mapping[day] || day.toLowerCase();
};

// Преобразование дня недели из API формата в русский
const dayOfWeekFromApi = (day: string): string => {
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

// Преобразование времени из формата "HH:mm" в формат "HH:MM:SS" для API
const timeToApiFormat = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
};

// Преобразование времени из формата API ("HH:MM:SS" или "HH:MM") в формат "HH:mm"
const timeFromApiFormat = (timeString: string): string => {
  const parts = timeString.split(':');
  const hours = parts[0].padStart(2, '0');
  const minutes = parts[1] || '00';
  return `${hours}:${minutes}`;
};

// Преобразование данных расписания из snake_case в camelCase для фронтенда
const transformSchedule = (apiData: Schedule): ScheduleFrontend => ({
  id: String(apiData.id),
  groupId: String(apiData.group_id),
  dayOfWeek: apiData.day_of_week,
  timeAt: timeFromApiFormat(apiData.time_at),
  duration: apiData.duration || undefined,
  meetingLink: apiData.meeting_link || undefined,
});

// Получить расписание для группы
// API: GET /api/v1/schedule/?group_id={group_id}
export const getScheduleByGroup = async (groupId: number): Promise<ScheduleFrontend[]> => {
  console.log('[getScheduleByGroup] Fetching schedule for group:', groupId);
  try {
    // Используем query параметр group_id
    const response = await apiClient.get<Schedule[]>('/schedule/', {
      params: { group_id: groupId },
    });
    console.log('[getScheduleByGroup] ✅ Success, response data:', response.data);
    return response.data.map(transformSchedule);
  } catch (error: any) {
    console.error('[getScheduleByGroup] ❌ Error:', {
      groupId,
      url: `/schedule/?group_id=${groupId}`,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });
    throw error;
  }
};

// Создать расписание
export const createSchedule = async (data: CreateScheduleDto): Promise<ScheduleFrontend> => {
  console.log('[createSchedule] Creating schedule:', data);
  try {
    // Преобразуем time_at в формат API, если нужно
    const requestData: CreateScheduleDto = {
      ...data,
      time_at: data.time_at.includes(':') && !data.time_at.includes('T') 
        ? timeToApiFormat(data.time_at) 
        : data.time_at,
    };
    const response = await apiClient.post<Schedule>('/schedule/', requestData);
    console.log('[createSchedule] ✅ Success, response data:', response.data);
    return transformSchedule(response.data);
  } catch (error: any) {
    console.error('[createSchedule] ❌ Error:', {
      data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
    });
    throw error;
  }
};

// Обновить расписание
export const updateSchedule = async (scheduleId: number, data: UpdateScheduleDto): Promise<ScheduleFrontend> => {
  console.log('[updateSchedule] Updating schedule:', { scheduleId, data });
  try {
    // Преобразуем time_at в формат API, если нужно
    const requestData: UpdateScheduleDto = {
      ...data,
      time_at: data.time_at && data.time_at.includes(':') && !data.time_at.includes('T')
        ? timeToApiFormat(data.time_at)
        : data.time_at,
    };
    const response = await apiClient.put<Schedule>(`/schedule/${scheduleId}`, requestData);
    console.log('[updateSchedule] ✅ Success, response data:', response.data);
    return transformSchedule(response.data);
  } catch (error: any) {
    console.error('[updateSchedule] ❌ Error:', {
      scheduleId,
      data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
    });
    throw error;
  }
};

// Удалить расписание
export const deleteSchedule = async (scheduleId: number): Promise<void> => {
  console.log('[deleteSchedule] Deleting schedule:', scheduleId);
  try {
    await apiClient.delete(`/schedule/${scheduleId}`);
    console.log('[deleteSchedule] ✅ Success');
  } catch (error: any) {
    console.error('[deleteSchedule] ❌ Error:', {
      scheduleId,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
    });
    throw error;
  }
};

// Вспомогательные функции для преобразования форматов
export const scheduleHelpers = {
  // Преобразовать данные из формы в формат API
  formToApi: (formData: { dayOfWeek: string; startTime: string; duration?: number; meetingLink?: string }, groupId: number): CreateScheduleDto => {
    return {
      group_id: groupId,
      day_of_week: dayOfWeekToApi(formData.dayOfWeek),
      time_at: timeToApiFormat(formData.startTime),
      duration: formData.duration || null,
      meeting_link: formData.meetingLink || null,
    };
  },
  
  // Преобразовать данные из API в формат для формы
  apiToForm: (schedule: Schedule): { dayOfWeek: string; startTime: string; duration?: number; meetingLink?: string } => {
    return {
      dayOfWeek: dayOfWeekFromApi(schedule.day_of_week),
      startTime: timeFromApiFormat(schedule.time_at),
      duration: schedule.duration || undefined,
      meetingLink: schedule.meeting_link || undefined,
    };
  },
  
  // Преобразовать данные из API в формат для отображения
  apiToDisplay: (schedule: Schedule): { id: string; dayOfWeek: string; startTime: string; duration: number; meetingLink?: string } => {
    return {
      id: String(schedule.id),
      dayOfWeek: dayOfWeekFromApi(schedule.day_of_week),
      startTime: timeFromApiFormat(schedule.time_at),
      duration: schedule.duration || 90, // По умолчанию 90 минут, если API не возвращает duration
      meetingLink: schedule.meeting_link || undefined,
    };
  },
};

