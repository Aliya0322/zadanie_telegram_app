import apiClient from './apiClient';

// Интерфейсы соответствуют бэкенд схемам из Pydantic
export interface Group {
  id: number;
  name: string;
  teacher_id: number;
  invite_code: string;
  is_active: boolean;
  created_at: string; // ISO datetime string
  students: number[]; // Список ID студентов
}

// Интерфейс для фронтенда (camelCase для удобства)
export interface GroupFrontend {
  id: string;
  name: string;
  teacherId: string;
  students?: string[];
  inviteToken?: string;
  isActive: boolean;
  createdAt: string;
}

// GroupResponseWithInvite (расширенный ответ с ссылкой-приглашением)
export interface GroupWithInviteLink extends Group {
  invite_link: string;
}

export interface CreateGroupDto {
  name: string;
}

// Преобразование данных группы из snake_case в camelCase для фронтенда
export const transformGroup = (apiData: Group): GroupFrontend => ({
  id: String(apiData.id),
  name: apiData.name,
  teacherId: String(apiData.teacher_id),
  students: apiData.students?.map(id => String(id)),
  inviteToken: apiData.invite_code,
  isActive: apiData.is_active,
  createdAt: apiData.created_at,
});

// Получить все группы
export const getGroups = async (): Promise<GroupFrontend[]> => {
  console.log('[getGroups] Fetching all groups...');
  try {
    const response = await apiClient.get<Group[]>('/groups');
    console.log('[getGroups] Raw response data:', response.data);
    // Преобразуем каждую группу из snake_case в camelCase для фронтенда
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
    const response = await apiClient.get<Group>(url);
    console.log('[getGroupById] ✅ Success, response data:', response.data);
    // Преобразуем ответ API из snake_case в camelCase для фронтенда
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
export const createGroup = async (data: CreateGroupDto): Promise<GroupFrontend> => {
  const response = await apiClient.post<Group>('/groups', data);
  // Преобразуем ответ API из snake_case в camelCase для фронтенда
  return transformGroup(response.data);
};

// Обновить группу (название)
export const updateGroup = async (id: string, data: { name: string }): Promise<GroupFrontend> => {
  const response = await apiClient.put<Group>(`/groups/${id}`, data);
  // Преобразуем ответ API из snake_case в camelCase для фронтенда
  return transformGroup(response.data);
};

// Обновить статус группы (активна/неактивна)
export const updateGroupStatus = async (id: string, isActive: boolean): Promise<GroupFrontend> => {
  const response = await apiClient.patch<Group>(`/groups/${id}/status`, { is_active: isActive });
  return transformGroup(response.data);
};

// Удалить группу
export const deleteGroup = async (id: string): Promise<void> => {
  await apiClient.delete(`/groups/${id}`);
};

// Добавить студента в группу (по invite_code)
export const joinGroupByInviteCode = async (inviteCode: string): Promise<GroupFrontend> => {
  const response = await apiClient.post<Group>(`/groups/join`, { invite_code: inviteCode });
  return transformGroup(response.data);
};

// Добавить студента в группу (по ID студента)
export const addStudentToGroup = async (groupId: string, studentId: string): Promise<GroupFrontend> => {
  const response = await apiClient.post<Group>(`/groups/${groupId}/students`, { student_id: Number(studentId) });
  return transformGroup(response.data);
};

// Удалить студента из группы
export const removeStudentFromGroup = async (groupId: string, studentId: string): Promise<GroupFrontend> => {
  const response = await apiClient.delete<Group>(`/groups/${groupId}/students/${studentId}`);
  return transformGroup(response.data);
};

// Получить группу с ссылкой-приглашением
export const getGroupWithInviteLink = async (id: string): Promise<GroupWithInviteLink> => {
  const response = await apiClient.get<GroupWithInviteLink>(`/groups/${id}/invite`);
  return response.data;
};

