import apiClient from './apiClient';
import type { Group } from './groupsApi';
import type { Homework } from './homeworkApi';

export interface ScheduleItem {
  id: string;
  groupId: string;
  groupName: string;
  startTime: string;
  endTime?: string;
  dayOfWeek?: number;
  date?: string;
}

export interface DashboardData {
  userRole: 'teacher' | 'student';
  groups: Group[];
  schedule: ScheduleItem[];
  activeHomework: Homework[];
}

// Получить данные для главного экрана
export const getDashboard = async (): Promise<DashboardData> => {
  const response = await apiClient.get<DashboardData>('/user/dashboard');
  return response.data;
};

// Получить полное расписание и активные ДЗ
export const getSchedule = async (): Promise<{
  schedule: ScheduleItem[];
  activeHomework: Homework[];
}> => {
  const response = await apiClient.get<{
    schedule: ScheduleItem[];
    activeHomework: Homework[];
  }>('/user/schedule');
  return response.data;
};

