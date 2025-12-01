import apiClient from './apiClient';

export interface Group {
  id: string;
  name: string;
  description?: string;
  teacherId: string;
  students?: string[];
  inviteToken?: string;
  status?: 'active' | 'paused';
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
  status: apiData.status || 'active',
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
// API: GET /api/v1/groups/{group_id} где group_id - integer
export const getGroupById = async (id: string | number): Promise<Group> => {
  // Логирование для отладки
  console.log('[getGroupById] Fetching group:', {
    id,
    idType: typeof id,
    idValue: id,
  });
  
  // Преобразуем ID в число для валидации, затем обратно в строку для URL
  // API ожидает integer, но в URL параметры всегда строки
  let groupId: number;
  
  if (typeof id === 'number') {
    groupId = id;
  } else {
    const parsed = parseInt(String(id).trim(), 10);
    if (isNaN(parsed) || parsed <= 0) {
      throw new Error(`Invalid group ID: ${id}. Expected a positive integer.`);
    }
    groupId = parsed;
  }
  
  // Преобразуем в строку для URL (URL параметры всегда строки)
  const cleanId = String(groupId);
  const url = `/groups/${cleanId}`;
  const baseURL = apiClient.defaults.baseURL || '';
  const fullURL = `${baseURL}${url}`;
  
  console.log('[getGroupById] Request details:', {
    originalId: id,
    validatedGroupId: groupId,
    cleanId,
    url,
    baseURL,
    fullURL,
    expectedPath: '/api/v1/groups/{group_id}',
  });
  
  try {
    const response = await apiClient.get<any>(url);
    console.log('[getGroupById] ✅ Success, response data:', response.data);
    // Преобразуем ответ API из snake_case в camelCase
    const transformed = transformGroup(response.data);
    console.log('[getGroupById] Transformed group:', transformed);
    return transformed;
  } catch (error: any) {
    console.error('[getGroupById] ❌ Error:', {
      originalId: id,
      validatedGroupId: groupId,
      cleanId,
      url,
      fullURL,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      requestConfig: {
        method: error.config?.method,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        hasInitData: !!error.config?.headers?.['X-Telegram-Init-Data'],
        headers: {
          'X-Telegram-Init-Data': error.config?.headers?.['X-Telegram-Init-Data'] ? 'present' : 'missing',
          'Content-Type': error.config?.headers?.['Content-Type'],
        },
      },
      message: error.message,
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

// Приостановить группу
export const pauseGroup = async (id: string): Promise<Group> => {
  const response = await apiClient.post<any>(`/groups/${id}/pause`);
  return transformGroup(response.data);
};

// Возобновить группу
export const resumeGroup = async (id: string): Promise<Group> => {
  const response = await apiClient.post<any>(`/groups/${id}/resume`);
  return transformGroup(response.data);
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

