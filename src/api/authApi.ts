import apiClient from './apiClient';

// Интерфейсы соответствуют бэкенд схемам из Pydantic (camelCase)
export interface User {
  id: number;
  tgId: number;
  role: 'teacher' | 'student';
  timezone: string;
  firstName: string | null;
  lastName: string | null;
  patronymic: string | null;
  birthdate: string | null; // ISO datetime string
  isActive: boolean;
  createdAt: string; // ISO datetime string
}

// Интерфейс для фронтенда (camelCase)
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

// LoginResponse из бэкенда
export interface LoginResponseBackend {
  user: User;
  isNewUser: boolean;
  message: string;
}

// LoginResponse для фронтенда (с UserFrontend)
export interface LoginResponse {
  user: UserFrontend;
  isNewUser: boolean;
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
  firstName: string;
  lastName: string;
  patronymic?: string;
  birthdate?: string;
  timezone: string;
}

// Преобразование User (camelCase от бэкенда) в UserFrontend
const transformUser = (userData: User): UserFrontend => ({
  id: String(userData.id),
  telegramId: String(userData.tgId),
  firstName: userData.firstName || '',
  lastName: userData.lastName || '',
  middleName: userData.patronymic || undefined,
  role: userData.role,
  birthDate: userData.birthdate || undefined,
  timezone: userData.timezone || 'UTC',
  isActive: userData.isActive,
  createdAt: userData.createdAt,
});

// Первичная регистрация/авторизация (принимает initData в заголовке X-Telegram-Init-Data)
export const login = async (registrationData?: UpdateRoleRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponseBackend>('/auth/login', registrationData || undefined);
  const apiData = response.data;
  
  const result: LoginResponse = {
    user: transformUser(apiData.user),
    isNewUser: apiData.isNewUser,
    message: apiData.message,
  };
  
  return result;
};

// Получить информацию о текущем пользователе
export const getCurrentUser = async (): Promise<UserFrontend> => {
  const response = await apiClient.get<User>('/auth/me');
  return transformUser(response.data);
};

// Обновить роль пользователя (для регистрации как учитель)
// Бэкенд поддерживает camelCase благодаря populate_by_name=True
export const updateRole = async (data: UpdateRoleRequest): Promise<UserFrontend> => {
  // Преобразуем middleName в patronymic для бэкенда
  // Бэкенд принимает как camelCase, так и snake_case благодаря populate_by_name=True
  const requestData: any = {
    role: data.role,
    firstName: data.firstName,
    lastName: data.lastName,
    patronymic: data.middleName, // Бэкенд принимает patronymic (snake_case)
    birthDate: data.birthDate, // Используем camelCase для согласованности
    timezone: data.timezone,
  };
  
  const response = await apiClient.post<User>('/auth/update-role', requestData);
  return transformUser(response.data);
};

// Обновить профиль пользователя
export const updateProfile = async (data: UpdateRoleRequest): Promise<UserFrontend> => {
  // Преобразуем middleName в patronymic для бэкенда
  const requestData: UserUpdateRequest = {
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    patronymic: data.middleName || undefined,
    birthdate: data.birthDate || undefined,
    timezone: data.timezone || 'UTC', // Обязательное поле согласно бэкенд схеме
  };
  
  const response = await apiClient.put<User>('/auth/me', requestData);
  return transformUser(response.data);
};

// Удалить профиль пользователя
export const deleteProfile = async (): Promise<void> => {
  await apiClient.delete('/auth/me');
};

// Получить пользователя по Telegram ID (для получения информации о студентах)
// В группах хранятся Telegram ID студентов (tg_id), а не внутренние ID БД
export const getUserById = async (telegramId: string | number): Promise<UserFrontend> => {
  const response = await apiClient.get<User>(`/auth/users/by-telegram/${telegramId}`);
  return transformUser(response.data);
};
