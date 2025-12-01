import apiClient from './apiClient';
import type { GroupFrontend } from './groupsApi';
import type { Homework, HomeworkFrontend } from './homeworkApi';
import { transformHomework } from './homeworkApi';

// Интерфейсы соответствуют бэкенд схемам из Pydantic

// DashboardGroupResponse из бэкенда
export interface DashboardGroupResponse {
  id: number;
  name: string;
  invite_code: string;
  teacher_name: string;
  student_count: number;
}

// TodayScheduleResponse из бэкенда
export interface TodayScheduleResponse {
  id: number;
  group_name: string;
  day_of_week: string; // DayOfWeek enum
  time_at: string; // Time string "HH:MM:SS" or "HH:MM"
  meeting_link: string | null;
}

// DashboardResponse из бэкенда
export interface DashboardResponse {
  user_role: 'teacher' | 'student';
  groups: DashboardGroupResponse[];
  today_schedule: TodayScheduleResponse[];
  active_homeworks: Homework[];
}

// Интерфейсы для фронтенда (camelCase для удобства)
export interface ScheduleItem {
  id: string;
  groupId: string;
  groupName: string;
  startTime: string;
  dayOfWeek: string;
  meetingLink?: string;
}

export interface DashboardData {
  userRole: 'teacher' | 'student';
  groups: GroupFrontend[];
  schedule: ScheduleItem[];
  activeHomework: HomeworkFrontend[];
}

// Преобразование DashboardGroupResponse в GroupFrontend
const transformDashboardGroup = (apiData: DashboardGroupResponse): GroupFrontend => ({
  id: String(apiData.id),
  name: apiData.name,
  teacherId: '', // Не предоставляется в DashboardGroupResponse
  students: Array(apiData.student_count).fill('').map((_, i) => String(i)), // Моковые ID для отображения количества
  inviteToken: apiData.invite_code,
  isActive: true, // Предполагаем активную группу
  createdAt: '', // Не предоставляется в DashboardGroupResponse
});

// Преобразование TodayScheduleResponse в ScheduleItem
const transformTodaySchedule = (apiData: TodayScheduleResponse): ScheduleItem => {
  // Преобразуем time_at из формата "HH:MM:SS" в "HH:mm"
  const timeParts = apiData.time_at.split(':');
  const timeAt = `${timeParts[0]}:${timeParts[1]}`;
  
  return {
    id: String(apiData.id),
    groupId: '', // Не предоставляется в TodayScheduleResponse
    groupName: apiData.group_name,
    startTime: timeAt,
    dayOfWeek: apiData.day_of_week,
    meetingLink: apiData.meeting_link || undefined,
  };
};

// Получить данные для главного экрана
export const getDashboard = async (): Promise<DashboardData> => {
  const response = await apiClient.get<DashboardResponse>('/user/dashboard');
  const apiData = response.data;
  
  // Преобразуем данные из snake_case в camelCase для фронтенда
  return {
    userRole: apiData.user_role,
    groups: apiData.groups.map(transformDashboardGroup),
    schedule: apiData.today_schedule.map(transformTodaySchedule),
    activeHomework: apiData.active_homeworks.map(transformHomework),
  };
};

// UserScheduleResponse из бэкенда
export interface UserScheduleResponse {
  schedules: any[]; // ScheduleResponse[]
  active_homeworks: Homework[];
}

// Получить полное расписание и активные ДЗ
export const getSchedule = async (): Promise<{
  schedule: ScheduleItem[];
  activeHomework: HomeworkFrontend[];
}> => {
  const response = await apiClient.get<UserScheduleResponse>('/user/schedule');
  const apiData = response.data;
  
  // Преобразуем данные из snake_case в camelCase для фронтенда
  return {
    schedule: apiData.schedules.map((s: any) => transformTodaySchedule({
      id: s.id,
      group_name: s.group_name || '',
      day_of_week: s.day_of_week,
      time_at: s.time_at,
      meeting_link: s.meeting_link,
    })),
    activeHomework: apiData.active_homeworks.map(transformHomework),
  };
};

