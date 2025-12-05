import apiClient from './apiClient';

// Интерфейсы соответствуют бэкенд схемам из Pydantic (camelCase)
export interface Homework {
  id: number;
  groupId: number;
  description: string;
  deadline: string; // ISO datetime string
  createdAt: string; // ISO datetime string
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

// DTO для использования на фронтенде
export interface CreateHomeworkDto {
  description: string;
  groupId: string; // Конвертируется в groupId при отправке
  dueDate: string; // Конвертируется в deadline при отправке (ISO datetime string)
}

// DTO для обновления домашнего задания (соответствует HomeworkUpdate из бэкенда)
export interface UpdateHomeworkRequestDto {
  description?: string;
  deadline?: string; // ISO datetime string
}

// Получить все домашние задания для группы
export const getHomeworkByGroup = async (groupId: string): Promise<Homework[]> => {
  const response = await apiClient.get<Homework[]>(`/homework/group/${groupId}`);
  return response.data;
};

// Получить домашнее задание по ID
export const getHomeworkById = async (id: string): Promise<Homework> => {
  const response = await apiClient.get<Homework>(`/homework/${id}`);
  return response.data;
};

// Создать новое домашнее задание для группы
// Бэкенд ожидает: description, deadline (groupId берется из URL)
export const createHomework = async (groupId: string, data: CreateHomeworkDto): Promise<Homework> => {
  const requestData: CreateHomeworkRequestDto = {
    description: data.description,
    deadline: data.dueDate,
  };
  const response = await apiClient.post<Homework>(`/groups/${groupId}/homework`, requestData);
  return response.data;
};

// Обновить домашнее задание
export const updateHomework = async (id: string, data: Partial<CreateHomeworkDto>): Promise<Homework> => {
  const requestData: UpdateHomeworkRequestDto = {};
  if (data.description !== undefined) {
    requestData.description = data.description;
  }
  if (data.dueDate !== undefined) {
    requestData.deadline = data.dueDate;
  }
  const response = await apiClient.put<Homework>(`/homework/${id}`, requestData);
  return response.data;
};

// Удалить домашнее задание
export const deleteHomework = async (id: string): Promise<void> => {
  await apiClient.delete(`/homework/${id}`);
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
