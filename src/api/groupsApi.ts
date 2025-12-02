import apiClient from './apiClient';

// Интерфейсы соответствуют бэкенд схемам из Pydantic (camelCase)
export interface Group {
  id: number;
  name: string;
  teacherId: number;
  inviteCode: string;
  isActive: boolean;
  createdAt: string; // ISO datetime string
  students: number[]; // Список ID студентов
}

// GroupResponseWithInvite (расширенный ответ с ссылкой-приглашением)
export interface GroupWithInviteLink extends Group {
  inviteLink: string;
}

export interface CreateGroupDto {
  name: string;
}

// Получить все группы
// API: GET /api/v1/groups/ - возвращает массив групп (без invite_link)
export const getGroups = async (): Promise<Group[]> => {
  console.log('[getGroups] Fetching all groups...');
  try {
    const response = await apiClient.get<Group[]>('/groups');
    console.log('[getGroups] Raw response data:', response.data);
    return response.data;
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
    return response.data;
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
// API: POST /api/v1/groups/ - возвращает группу с invite_link
export const createGroup = async (data: CreateGroupDto): Promise<Group> => {
  const response = await apiClient.post<GroupWithInviteLink>('/groups/', data);
  // Возвращаем группу без inviteLink (он доступен только через getGroupWithInviteLink)
  return response.data;
};

// Обновить группу (название)
// API: PUT /api/v1/groups/{group_id} - возвращает обновленную группу (без invite_link)
export const updateGroup = async (id: string, data: { name: string }): Promise<Group> => {
  const response = await apiClient.put<Group>(`/groups/${id}`, data);
  return response.data;
};

// Обновить статус группы (активна/неактивна)
// API: PATCH /api/v1/groups/{group_id}/status - body: { isActive: boolean }, возвращает обновленную группу
export const updateGroupStatus = async (id: string, isActive: boolean): Promise<Group> => {
  const response = await apiClient.patch<Group>(`/groups/${id}/status`, { isActive });
  return response.data;
};

// Удалить группу
// API: DELETE /api/v1/groups/{group_id}
export const deleteGroup = async (id: string): Promise<void> => {
  await apiClient.delete(`/groups/${id}`);
};

// Добавить студента в группу (по inviteCode)
export const joinGroupByInviteCode = async (inviteCode: string): Promise<Group> => {
  const response = await apiClient.post<Group>(`/groups/join`, { inviteCode });
  return response.data;
};

// Добавить студента в группу (по ID студента)
export const addStudentToGroup = async (groupId: string, studentId: string): Promise<Group> => {
  const response = await apiClient.post<Group>(`/groups/${groupId}/students`, { studentId: Number(studentId) });
  return response.data;
};

// Удалить студента из группы
// API: DELETE /api/v1/groups/{group_id}/students/{student_tg_id}
export const removeStudentFromGroup = async (groupId: string, studentId: string): Promise<Group> => {
  const response = await apiClient.delete<Group>(`/groups/${groupId}/students/${studentId}`);
  return response.data;
};

// Получить группу с ссылкой-приглашением
// API: GET /api/v1/groups/{group_id}/invite-link
export const getGroupWithInviteLink = async (id: string): Promise<GroupWithInviteLink> => {
  const response = await apiClient.get<GroupWithInviteLink>(`/groups/${id}/invite-link`);
  return response.data;
};
