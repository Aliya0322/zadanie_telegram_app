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
export const login = async (): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login');
  return response.data;
};

// Получить информацию о текущем пользователе
export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
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
    requestData.middle_name = data.middleName;
  }
  if (data.birthDate !== undefined) {
    requestData.birth_date = data.birthDate;
  }
  if (data.timezone !== undefined) {
    requestData.timezone = data.timezone;
  }
  
  const response = await apiClient.post<User>('/auth/update-role', requestData);
  return response.data;
};

