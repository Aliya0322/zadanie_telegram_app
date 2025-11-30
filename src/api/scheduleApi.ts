import apiClient from './apiClient';

export interface Schedule {
  id: number;
  group_id: number;
  day_of_week: string; // "monday", "tuesday", etc.
  time_at: string; // ISO datetime string
  meeting_link?: string;
}

export interface CreateScheduleDto {
  group_id: number;
  day_of_week: string; // "monday", "tuesday", etc.
  time_at: string; // ISO datetime string
  meeting_link?: string;
}

export interface UpdateScheduleDto {
  day_of_week?: string;
  time_at?: string;
  meeting_link?: string;
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

// Преобразование времени из формата "HH:mm" в ISO datetime
const timeToISO = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

// Преобразование ISO datetime в формат "HH:mm"
const timeFromISO = (isoString: string): string => {
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Получить расписание для группы
// API: GET /api/v1/schedule/?group_id={group_id}
export const getScheduleByGroup = async (groupId: number): Promise<Schedule[]> => {
  console.log('[getScheduleByGroup] Fetching schedule for group:', groupId);
  try {
    // Используем query параметр group_id
    const response = await apiClient.get<Schedule[]>('/schedule/', {
      params: { group_id: groupId },
    });
    console.log('[getScheduleByGroup] ✅ Success, response data:', response.data);
    return response.data;
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
export const createSchedule = async (data: CreateScheduleDto): Promise<Schedule> => {
  console.log('[createSchedule] Creating schedule:', data);
  try {
    const response = await apiClient.post<Schedule>('/schedule/', data);
    console.log('[createSchedule] ✅ Success, response data:', response.data);
    return response.data;
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
export const updateSchedule = async (scheduleId: number, data: UpdateScheduleDto): Promise<Schedule> => {
  console.log('[updateSchedule] Updating schedule:', { scheduleId, data });
  try {
    const response = await apiClient.put<Schedule>(`/schedule/${scheduleId}`, data);
    console.log('[updateSchedule] ✅ Success, response data:', response.data);
    return response.data;
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
  formToApi: (formData: { dayOfWeek: string; startTime: string; meetingLink?: string }, groupId: number): CreateScheduleDto => {
    return {
      group_id: groupId,
      day_of_week: dayOfWeekToApi(formData.dayOfWeek),
      time_at: timeToISO(formData.startTime),
      meeting_link: formData.meetingLink,
    };
  },
  
  // Преобразовать данные из API в формат для формы
  apiToForm: (schedule: Schedule): { dayOfWeek: string; startTime: string; meetingLink?: string } => {
    return {
      dayOfWeek: dayOfWeekFromApi(schedule.day_of_week),
      startTime: timeFromISO(schedule.time_at),
      meetingLink: schedule.meeting_link,
    };
  },
  
  // Преобразовать данные из API в формат для отображения
  apiToDisplay: (schedule: Schedule): { id: string; dayOfWeek: string; startTime: string; duration: number; meetingLink?: string } => {
    return {
      id: String(schedule.id),
      dayOfWeek: dayOfWeekFromApi(schedule.day_of_week),
      startTime: timeFromISO(schedule.time_at),
      duration: 90, // По умолчанию 90 минут, если API не возвращает duration
      meetingLink: schedule.meeting_link,
    };
  },
};

