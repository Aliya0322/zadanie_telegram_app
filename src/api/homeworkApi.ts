import apiClient from './apiClient';

// Интерфейсы соответствуют бэкенд схемам из Pydantic
export interface Homework {
  id: number;
  group_id: number;
  description: string;
  deadline: string; // ISO datetime string
  created_at: string; // ISO datetime string
  reminder_sent: boolean;
}

// Интерфейс для фронтенда (camelCase для удобства)
export interface HomeworkFrontend {
  id: string;
  description: string;
  groupId: string;
  dueDate: string;
  createdAt: string;
  reminderSent: boolean;
}

export interface HomeworkSubmission {
  id: string;
  homeworkId: string;
  studentId: string;
  content: string;
  submittedAt: string;
  grade?: number;
  feedback?: string;
}

// DTO для создания домашнего задания (соответствует HomeworkCreate из бэкенда)
export interface CreateHomeworkRequestDto {
  description: string;
  deadline: string; // ISO datetime string
}

// DTO для использования на фронтенде (удобнее работать с camelCase)
export interface CreateHomeworkDto {
  description: string;
  groupId: string; // Конвертируется в group_id при отправке
  dueDate: string; // Конвертируется в deadline при отправке (ISO datetime string)
}

// DTO для обновления домашнего задания (соответствует HomeworkUpdate из бэкенда)
export interface UpdateHomeworkRequestDto {
  description?: string;
  deadline?: string; // ISO datetime string
}

export interface SubmitHomeworkDto {
  content: string;
}

// Преобразование данных домашнего задания из snake_case в camelCase для фронтенда
export const transformHomework = (apiData: Homework): HomeworkFrontend => ({
  id: String(apiData.id),
  description: apiData.description,
  groupId: String(apiData.group_id),
  dueDate: apiData.deadline,
  createdAt: apiData.created_at,
  reminderSent: apiData.reminder_sent,
});

// Получить все домашние задания для группы
export const getHomeworkByGroup = async (groupId: string): Promise<HomeworkFrontend[]> => {
  const response = await apiClient.get<Homework[]>(`/homework/group/${groupId}`);
  return response.data.map(transformHomework);
};

// Получить домашнее задание по ID
export const getHomeworkById = async (id: string): Promise<HomeworkFrontend> => {
  const response = await apiClient.get<Homework>(`/homework/${id}`);
  return transformHomework(response.data);
};

// Создать новое домашнее задание для группы
// Бэкенд ожидает: description, deadline (group_id берется из URL)
export const createHomework = async (groupId: string, data: CreateHomeworkDto): Promise<HomeworkFrontend> => {
  // Конвертируем фронтенд формат в формат бэкенда
  const requestData: CreateHomeworkRequestDto = {
    description: data.description,
    deadline: data.dueDate,
  };
  const response = await apiClient.post<Homework>(`/groups/${groupId}/homework`, requestData);
  return transformHomework(response.data);
};

// Обновить домашнее задание
export const updateHomework = async (id: string, data: Partial<CreateHomeworkDto>): Promise<HomeworkFrontend> => {
  // Конвертируем фронтенд формат в формат бэкенда
  const requestData: UpdateHomeworkRequestDto = {};
  if (data.description !== undefined) {
    requestData.description = data.description;
  }
  if (data.dueDate !== undefined) {
    requestData.deadline = data.dueDate;
  }
  const response = await apiClient.put<Homework>(`/homework/${id}`, requestData);
  return transformHomework(response.data);
};

// Удалить домашнее задание
export const deleteHomework = async (id: string): Promise<void> => {
  await apiClient.delete(`/homework/${id}`);
};

// Отметить задание как выполненное (для студентов)
// Бэкенд использует эндпоинт /homework/{homework_id}/complete
export const submitHomework = async (homeworkId: string, data?: SubmitHomeworkDto): Promise<HomeworkSubmission> => {
  // Бэкенд может не требовать body, или требовать минимальные данные
  const response = await apiClient.post<HomeworkSubmission>(`/homework/${homeworkId}/complete`, data || {});
  return response.data;
};

// Получить все отправки для домашнего задания
export const getHomeworkSubmissions = async (homeworkId: string): Promise<HomeworkSubmission[]> => {
  const response = await apiClient.get<HomeworkSubmission[]>(`/homework/${homeworkId}/submissions`);
  return response.data;
};

// Оценить домашнее задание (для учителей)
export const gradeHomework = async (
  submissionId: string,
  grade: number,
  feedback?: string
): Promise<HomeworkSubmission> => {
  const response = await apiClient.put<HomeworkSubmission>(`/homework/submissions/${submissionId}/grade`, {
    grade,
    feedback,
  });
  return response.data;
};

