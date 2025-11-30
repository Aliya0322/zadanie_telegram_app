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

// Преобразование данных группы из snake_case в camelCase
const transformGroup = (apiData: any): Group => ({
  id: String(apiData.id || ''),
  name: apiData.name || '',
  description: apiData.description || undefined,
  teacherId: String(apiData.teacher_id || apiData.teacherId || ''),
  students: apiData.students || undefined,
  inviteToken: apiData.invite_code || apiData.inviteToken || undefined,
  createdAt: apiData.created_at || apiData.createdAt || '',
  updatedAt: apiData.updated_at || apiData.updatedAt || '',
});

// Получить все группы
export const getGroups = async (): Promise<Group[]> => {
  const response = await apiClient.get<any[]>('/groups');
  // Преобразуем каждую группу из snake_case в camelCase
  return response.data.map(transformGroup);
};

// Получить группу по ID
export const getGroupById = async (id: string): Promise<Group> => {
  const response = await apiClient.get<any>(`/groups/${id}`);
  // Преобразуем ответ API из snake_case в camelCase
  return transformGroup(response.data);
};

// Создать новую группу
export const createGroup = async (data: CreateGroupDto): Promise<Group> => {
  const response = await apiClient.post<any>('/groups', data);
  // Преобразуем ответ API из snake_case в camelCase
  return transformGroup(response.data);
};

// Обновить группу
export const updateGroup = async (id: string, data: Partial<CreateGroupDto>): Promise<Group> => {
  const response = await apiClient.put<any>(`/groups/${id}`, data);
  // Преобразуем ответ API из snake_case в camelCase
  return transformGroup(response.data);
};

// Удалить группу
export const deleteGroup = async (id: string): Promise<void> => {
  await apiClient.delete(`/groups/${id}`);
};

// Добавить студента в группу
export const addStudentToGroup = async (groupId: string, studentId: string): Promise<Group> => {
  const response = await apiClient.post<any>(`/groups/${groupId}/students`, { studentId });
  // Преобразуем ответ API из snake_case в camelCase
  return transformGroup(response.data);
};

// Удалить студента из группы
export const removeStudentFromGroup = async (groupId: string, studentId: string): Promise<Group> => {
  const response = await apiClient.delete<any>(`/groups/${groupId}/students/${studentId}`);
  // Преобразуем ответ API из snake_case в camelCase
  return transformGroup(response.data);
};

// Создать домашнее задание для группы
// API-запрос на создание задания и автоматическое создание уведомлений
export const createHomework = async (groupId: string, data: any) => {
  const response = await apiClient.post(`/groups/${groupId}/homework`, data);
  return response.data;
};

