import apiClient from './apiClient';

export interface Group {
  id: string;
  name: string;
  description?: string;
  teacherId: string;
  students?: string[];
  inviteToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupDto {
  name: string;
  description?: string;
  meetingLink?: string;
}

// Получить все группы
export const getGroups = async (): Promise<Group[]> => {
  const response = await apiClient.get<Group[]>('/groups');
  return response.data;
};

// Получить группу по ID
export const getGroupById = async (id: string): Promise<Group> => {
  const response = await apiClient.get<Group>(`/groups/${id}`);
  return response.data;
};

// Создать новую группу
export const createGroup = async (data: CreateGroupDto): Promise<Group> => {
  const response = await apiClient.post<Group>('/groups', data);
  return response.data;
};

// Обновить группу
export const updateGroup = async (id: string, data: Partial<CreateGroupDto>): Promise<Group> => {
  const response = await apiClient.put<Group>(`/groups/${id}`, data);
  return response.data;
};

// Удалить группу
export const deleteGroup = async (id: string): Promise<void> => {
  await apiClient.delete(`/groups/${id}`);
};

// Добавить студента в группу
export const addStudentToGroup = async (groupId: string, studentId: string): Promise<Group> => {
  const response = await apiClient.post<Group>(`/groups/${groupId}/students`, { studentId });
  return response.data;
};

// Удалить студента из группы
export const removeStudentFromGroup = async (groupId: string, studentId: string): Promise<Group> => {
  const response = await apiClient.delete<Group>(`/groups/${groupId}/students/${studentId}`);
  return response.data;
};

// Создать домашнее задание для группы
// API-запрос на создание задания и автоматическое создание уведомлений
export const createHomework = async (groupId: string, data: any) => {
  const response = await apiClient.post(`/groups/${groupId}/homework`, data);
  return response.data;
};

