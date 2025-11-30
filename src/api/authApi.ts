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
export const updateRole = async (data: UpdateRoleRequest): Promise<User> => {
  const response = await apiClient.post<User>('/auth/update-role', data);
  return response.data;
};

