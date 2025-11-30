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
  console.log('[getGroups] Fetching all groups...');
  try {
    const response = await apiClient.get<any[]>('/groups');
    console.log('[getGroups] Raw response data:', response.data);
    // Преобразуем каждую группу из snake_case в camelCase
    const transformed = response.data.map(transformGroup);
    console.log('[getGroups] Transformed groups:', transformed);
    return transformed;
  } catch (error: any) {
    console.error('[getGroups] ❌ Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

// Получить группу по ID
export const getGroupById = async (id: string): Promise<Group> => {
  // Логирование для отладки
  console.log('[getGroupById] Fetching group:', {
    id,
    idType: typeof id,
    idValue: id,
    trimmed: id?.trim(),
  });
  
  // Убеждаемся, что ID не содержит лишних пробелов
  const cleanId = String(id).trim();
  const url = `/groups/${cleanId}`;
  
  console.log('[getGroupById] Request URL:', url);
  console.log('[getGroupById] Full URL will be:', `${apiClient.defaults.baseURL}${url}`);
  
  try {
    const response = await apiClient.get<any>(url);
    console.log('[getGroupById] ✅ Success, response data:', response.data);
    // Преобразуем ответ API из snake_case в camelCase
    const transformed = transformGroup(response.data);
    console.log('[getGroupById] Transformed group:', transformed);
    return transformed;
  } catch (error: any) {
    console.error('[getGroupById] ❌ Error:', {
      id: cleanId,
      url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      fullError: error,
    });
    throw error;
  }
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

