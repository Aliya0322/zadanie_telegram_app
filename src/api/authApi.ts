import apiClient from './apiClient';

export interface User {
  id: string;
  telegramId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  role: 'teacher' | 'student';
  birthDate?: string;
  timezone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  user: User;
  token?: string;
}

export interface UpdateRoleRequest {
  role: 'teacher' | 'student';
  firstName?: string;
  lastName?: string;
  middleName?: string;
  birthDate?: string;
  timezone?: string;
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
  
  const response = await apiClient.post<any>('/auth/login', Object.keys(requestData).length > 0 ? requestData : undefined);
  // Преобразуем ответ API из snake_case в camelCase
  const apiData = response.data;
  const transformUser = (userData: any): User => ({
    id: String(userData.id || ''),
    telegramId: String(userData.tg_id || userData.telegramId || ''),
    firstName: userData.first_name || '',
    lastName: userData.last_name || '',
    middleName: userData.patronymic || userData.middle_name || undefined,
    role: userData.role || 'student',
    birthDate: userData.birthdate || userData.birth_date || undefined,
    timezone: userData.timezone || undefined,
    createdAt: userData.created_at || undefined,
    updatedAt: userData.updated_at || undefined,
  });
  
  return {
    user: transformUser(apiData.user || apiData),
    token: apiData.token,
  };
};

// Получить информацию о текущем пользователе
export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<any>('/auth/me');
  // Преобразуем ответ API из snake_case в camelCase
  const apiData = response.data;
  return {
    id: String(apiData.id || ''),
    telegramId: String(apiData.tg_id || apiData.telegramId || ''),
    firstName: apiData.first_name || '',
    lastName: apiData.last_name || '',
    middleName: apiData.patronymic || apiData.middle_name || undefined,
    role: apiData.role || 'student',
    birthDate: apiData.birthdate || apiData.birth_date || undefined,
    timezone: apiData.timezone || undefined,
    createdAt: apiData.created_at || undefined,
    updatedAt: apiData.updated_at || undefined,
  };
};

// Обновить роль пользователя (для регистрации как учитель)
// Бэкенд ожидает snake_case формат
export const updateRole = async (data: UpdateRoleRequest): Promise<User> => {
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
    requestData.birth_date = data.birthDate;
  }
  if (data.timezone !== undefined) {
    requestData.timezone = data.timezone;
  }
  
  const response = await apiClient.post<any>('/auth/update-role', requestData);
  // Преобразуем ответ API из snake_case в camelCase
  const apiData = response.data;
  return {
    id: String(apiData.id || ''),
    telegramId: String(apiData.tg_id || apiData.telegramId || ''),
    firstName: apiData.first_name || '',
    lastName: apiData.last_name || '',
    middleName: apiData.patronymic || apiData.middle_name || undefined,
    role: apiData.role || 'student',
    birthDate: apiData.birthdate || apiData.birth_date || undefined,
    timezone: apiData.timezone || undefined,
    createdAt: apiData.created_at || undefined,
    updatedAt: apiData.updated_at || undefined,
  };
};

