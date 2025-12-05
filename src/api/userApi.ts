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

// Helper to get value from object with camelCase or snake_case key
const getVal = (obj: any, camel: string, snake?: string) => {
  if (!obj) return undefined;
  if (obj[camel] !== undefined) return obj[camel];
  if (snake && obj[snake] !== undefined) return obj[snake];
  return undefined;
};

// Преобразование DashboardGroupResponse в Group (используем только доступные поля)
const transformDashboardGroup = (apiData: any): Group => {
  // Поддержка и camelCase и snake_case
  const id = getVal(apiData, 'id');
  const name = getVal(apiData, 'name');
  const inviteCode = getVal(apiData, 'inviteCode', 'invite_code');
  const studentCount = getVal(apiData, 'studentCount', 'student_count') || 0;

  // Создаем массив "моковых" student IDs для отображения количества
  // В реальности, если нужны реальные ID студентов, нужно запросить полную информацию о группе
  // Если studentCount равен 0 или меньше, создаем пустой массив
  const studentIds: number[] = studentCount > 0 
    ? Array(studentCount).fill(0).map((_, i) => i + 1)
    : [];
  
  return {
    id: id !== undefined ? Number(id) : 0,
    name: name || '',
    teacherId: 0, // Не предоставляется в DashboardGroupResponse
    inviteCode: inviteCode || '',
    isActive: true, // Предполагаем активную группу
    createdAt: '', // Не предоставляется в DashboardGroupResponse
    students: studentIds,
  };
};

// Преобразование TodayScheduleResponse в ScheduleItem
const transformTodaySchedule = (apiData: any): ScheduleItem => {
  const id = getVal(apiData, 'id');
  const groupName = getVal(apiData, 'groupName', 'group_name');
  const dayOfWeek = getVal(apiData, 'dayOfWeek', 'day_of_week');
  const timeAtRaw = getVal(apiData, 'timeAt', 'time_at') || '';
  const meetingLink = getVal(apiData, 'meetingLink', 'meeting_link');

  // Преобразуем timeAt из формата "HH:MM:SS" в "HH:mm"
  const timeParts = timeAtRaw.split(':');
  const timeAt = timeParts.length >= 2 ? `${timeParts[0]}:${timeParts[1]}` : timeAtRaw;
  
  return {
    id: id !== undefined ? String(id) : '',
    groupId: '', // Не предоставляется в TodayScheduleResponse
    groupName: groupName || '',
    startTime: timeAt,
    dayOfWeek: dayOfWeek || '',
    meetingLink: meetingLink || undefined,
  };
};

// Получить данные для главного экрана
export const getDashboard = async (): Promise<DashboardData> => {
  // Используем any для response.data, чтобы обойти строгую типизацию и проверить snake_case
  const response = await apiClient.get<any>('/user/dashboard');
  const apiData = response.data;
  
  const userRole = getVal(apiData, 'userRole', 'user_role') || 'student';
  const groups = getVal(apiData, 'groups') || [];
  const todaySchedule = getVal(apiData, 'todaySchedule', 'today_schedule') || [];
  const activeHomeworks = getVal(apiData, 'activeHomeworks', 'active_homeworks') || [];
  
  return {
    userRole: userRole,
    groups: Array.isArray(groups) ? groups.map(transformDashboardGroup) : [],
    schedule: Array.isArray(todaySchedule) ? todaySchedule.map(transformTodaySchedule) : [],
    activeHomework: Array.isArray(activeHomeworks) ? activeHomeworks : [],
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
  const response = await apiClient.get<any>('/user/schedule');
  const apiData = response.data;
  
  const schedules = getVal(apiData, 'schedules') || [];
  const activeHomeworks = getVal(apiData, 'activeHomeworks', 'active_homeworks') || [];
  
  return {
    schedule: Array.isArray(schedules) ? schedules.map(transformTodaySchedule) : [],
    activeHomework: Array.isArray(activeHomeworks) ? activeHomeworks : [],
  };
};
