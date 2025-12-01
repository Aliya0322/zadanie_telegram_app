import apiClient from './apiClient';

// Интерфейсы соответствуют бэкенд схемам из Pydantic
export interface User {
  id: number;
  tg_id: number;
  role: 'teacher' | 'student';
  timezone: string;
  first_name: string | null;
  last_name: string | null;
  patronymic: string | null;
  birthdate: string | null; // ISO datetime string
  is_active: boolean;
  created_at: string; // ISO datetime string
}

// Интерфейс для фронтенда (camelCase для удобства)
export interface UserFrontend {
  id: string;
  telegramId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  role: 'teacher' | 'student';
  birthDate?: string;
  timezone: string;
  isActive: boolean;
  createdAt: string;
}

export interface LoginResponse {
  user: User;
  is_new_user: boolean;
  message: string;
}

export interface UpdateRoleRequest {
  role: 'teacher' | 'student';
  firstName?: string;
  lastName?: string;
  middleName?: string;
  birthDate?: string;
  timezone?: string;
}

// UserUpdate для обновления профиля (соответствует UserUpdate из бэкенда)
export interface UserUpdateRequest {
  first_name: string;
  last_name: string;
  patronymic?: string;
  birthdate?: string;
  timezone: string;
}

// Первичная регистрация/авторизация (принимает initData в заголовке X-Telegram-Init-Data)
// Теперь может принимать данные для регистрации (объединено с updateRole)
export const login = async (registrationData?: UpdateRoleRequest): Promise<LoginResponse> => {
  // Конвертируем camelCase в snake_case для бэкенда, если переданы данные регистрации
  const requestData: any = {};
  
  if (registrationData) {
    if (registrationData.role !== undefined) {
      requestData.role = registrationData.role;
    }
    if (registrationData.firstName !== undefined) {
      requestData.first_name = registrationData.firstName;
    }
    if (registrationData.lastName !== undefined) {
      requestData.last_name = registrationData.lastName;
    }
    if (registrationData.middleName !== undefined) {
      requestData.patronymic = registrationData.middleName; // API использует patronymic
    }
    if (registrationData.birthDate !== undefined) {
      requestData.birthdate = registrationData.birthDate;
    }
    if (registrationData.timezone !== undefined) {
      requestData.timezone = registrationData.timezone;
    }
  }
  
  const response = await apiClient.post<LoginResponse>('/auth/login', Object.keys(requestData).length > 0 ? requestData : undefined);
  // Преобразуем ответ API из snake_case в camelCase для фронтенда
  const apiData = response.data;
  const transformUser = (userData: User): UserFrontend => ({
    id: String(userData.id),
    telegramId: String(userData.tg_id),
    firstName: userData.first_name || '',
    lastName: userData.last_name || '',
    middleName: userData.patronymic || undefined,
    role: userData.role,
    birthDate: userData.birthdate || undefined,
    timezone: userData.timezone || 'UTC',
    isActive: userData.is_active,
    createdAt: userData.created_at,
  });
  
  return {
    user: transformUser(apiData.user),
    is_new_user: apiData.is_new_user,
    message: apiData.message,
  };
};

// Получить информацию о текущем пользователе
export const getCurrentUser = async (): Promise<UserFrontend> => {
  const response = await apiClient.get<User>('/auth/me');
  // Преобразуем ответ API из snake_case в camelCase для фронтенда
  const apiData = response.data;
  return {
    id: String(apiData.id),
    telegramId: String(apiData.tg_id),
    firstName: apiData.first_name || '',
    lastName: apiData.last_name || '',
    middleName: apiData.patronymic || undefined,
    role: apiData.role,
    birthDate: apiData.birthdate || undefined,
    timezone: apiData.timezone || 'UTC',
    isActive: apiData.is_active,
    createdAt: apiData.created_at,
  };
};

// Обновить роль пользователя (для регистрации как учитель)
// Бэкенд ожидает snake_case формат
export const updateRole = async (data: UpdateRoleRequest): Promise<UserFrontend> => {
  // Конвертируем camelCase в snake_case для бэкенда
  const requestData: any = {
    role: data.role,
  };
  
  if (data.firstName !== undefined) {
    requestData.first_name = data.firstName;
  }
  if (data.lastName !== undefined) {
    requestData.last_name = data.lastName;
  }
  if (data.middleName !== undefined) {
    requestData.patronymic = data.middleName; // API использует patronymic
  }
  if (data.birthDate !== undefined) {
    requestData.birthdate = data.birthDate;
  }
  if (data.timezone !== undefined) {
    requestData.timezone = data.timezone;
  }
  
  const response = await apiClient.post<User>('/auth/update-role', requestData);
  // Преобразуем ответ API из snake_case в camelCase для фронтенда
  const apiData = response.data;
  return {
    id: String(apiData.id),
    telegramId: String(apiData.tg_id),
    firstName: apiData.first_name || '',
    lastName: apiData.last_name || '',
    middleName: apiData.patronymic || undefined,
    role: apiData.role,
    birthDate: apiData.birthdate || undefined,
    timezone: apiData.timezone || 'UTC',
    isActive: apiData.is_active,
    createdAt: apiData.created_at,
  };
};

// Обновить профиль пользователя
// Бэкенд ожидает UserUpdate схему: first_name, last_name, patronymic?, birthdate?, timezone (обязательное)
export const updateProfile = async (data: UpdateRoleRequest): Promise<UserFrontend> => {
  // Конвертируем camelCase в snake_case для бэкенда
  const requestData: UserUpdateRequest = {
    first_name: data.firstName || '',
    last_name: data.lastName || '',
    patronymic: data.middleName || undefined,
    birthdate: data.birthDate || undefined,
    timezone: data.timezone || 'UTC', // Обязательное поле согласно бэкенд схеме
  };
  
  const response = await apiClient.put<User>('/auth/me', requestData);
  const apiData = response.data;
  return {
    id: String(apiData.id),
    telegramId: String(apiData.tg_id),
    firstName: apiData.first_name || '',
    lastName: apiData.last_name || '',
    middleName: apiData.patronymic || undefined,
    role: apiData.role,
    birthDate: apiData.birthdate || undefined,
    timezone: apiData.timezone || 'UTC',
    isActive: apiData.is_active,
    createdAt: apiData.created_at,
  };
};

// Удалить профиль пользователя
export const deleteProfile = async (): Promise<void> => {
  await apiClient.delete('/auth/me');
};

