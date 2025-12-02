import apiClient from './apiClient';
import type { Group } from './groupsApi';
import type { Homework } from './homeworkApi';

// Интерфейсы соответствуют бэкенд схемам из Pydantic (camelCase)

// DashboardGroupResponse из бэкенда
export interface DashboardGroupResponse {
  id: number;
  name: string;
  inviteCode: string;
  teacherName: string;
  studentCount: number;
}

// TodayScheduleResponse из бэкенда
export interface TodayScheduleResponse {
  id: number;
  groupName: string;
  dayOfWeek: string; // DayOfWeek enum
  timeAt: string; // Time string "HH:MM:SS" or "HH:MM"
  meetingLink: string | null;
}

// DashboardResponse из бэкенда
export interface DashboardResponse {
  userRole: 'teacher' | 'student';
  groups: DashboardGroupResponse[];
  todaySchedule: TodayScheduleResponse[];
  activeHomeworks: Homework[];
}

// Интерфейсы для фронтенда
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
  groups: Group[];
  schedule: ScheduleItem[];
  activeHomework: Homework[];
}

// Преобразование DashboardGroupResponse в Group (используем только доступные поля)
const transformDashboardGroup = (apiData: DashboardGroupResponse): Group => {
  // Создаем массив "моковых" student IDs для отображения количества
  // В реальности, если нужны реальные ID студентов, нужно запросить полную информацию о группе
  const studentIds: number[] = Array(apiData.studentCount).fill(0).map((_, i) => i + 1);
  
  return {
    id: apiData.id,
    name: apiData.name,
    teacherId: 0, // Не предоставляется в DashboardGroupResponse
    inviteCode: apiData.inviteCode,
    isActive: true, // Предполагаем активную группу
    createdAt: '', // Не предоставляется в DashboardGroupResponse
    students: studentIds,
  };
};

// Преобразование TodayScheduleResponse в ScheduleItem
const transformTodaySchedule = (apiData: TodayScheduleResponse): ScheduleItem => {
  // Преобразуем timeAt из формата "HH:MM:SS" в "HH:mm"
  const timeParts = apiData.timeAt.split(':');
  const timeAt = `${timeParts[0]}:${timeParts[1]}`;
  
  return {
    id: String(apiData.id),
    groupId: '', // Не предоставляется в TodayScheduleResponse
    groupName: apiData.groupName,
    startTime: timeAt,
    dayOfWeek: apiData.dayOfWeek,
    meetingLink: apiData.meetingLink || undefined,
  };
};

// Получить данные для главного экрана
export const getDashboard = async (): Promise<DashboardData> => {
  const response = await apiClient.get<DashboardResponse>('/user/dashboard');
  const apiData = response.data;
  
  return {
    userRole: apiData.userRole,
    groups: apiData.groups.map(transformDashboardGroup),
    schedule: apiData.todaySchedule.map(transformTodaySchedule),
    activeHomework: apiData.activeHomeworks,
  };
};

// UserScheduleResponse из бэкенда
export interface UserScheduleResponse {
  schedules: TodayScheduleResponse[];
  activeHomeworks: Homework[];
}

// Получить полное расписание и активные ДЗ
export const getSchedule = async (): Promise<{
  schedule: ScheduleItem[];
  activeHomework: Homework[];
}> => {
  const response = await apiClient.get<UserScheduleResponse>('/user/schedule');
  const apiData = response.data;
  
  return {
    schedule: apiData.schedules.map(transformTodaySchedule),
    activeHomework: apiData.activeHomeworks,
  };
};
