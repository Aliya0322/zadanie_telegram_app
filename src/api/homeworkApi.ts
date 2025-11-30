import apiClient from './apiClient';

export interface Homework {
  id: string;
  title: string;
  description: string;
  groupId: string;
  teacherId: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  submissions?: HomeworkSubmission[];
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

// DTO для отправки на бэкенд (соответствует API бэкенда)
export interface CreateHomeworkRequestDto {
  group_id: string;
  description: string;
  deadline: string;
}

// DTO для использования на фронтенде (удобнее работать с camelCase)
export interface CreateHomeworkDto {
  title?: string; // Не используется бэкендом, только для фронтенда
  description: string;
  groupId: string; // Конвертируется в group_id при отправке
  dueDate: string; // Конвертируется в deadline при отправке
}

export interface SubmitHomeworkDto {
  content: string;
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

// Создать новое домашнее задание
// Бэкенд ожидает: group_id, description, deadline
export const createHomework = async (data: CreateHomeworkDto): Promise<Homework> => {
  // Конвертируем фронтенд формат в формат бэкенда
  const requestData: CreateHomeworkRequestDto = {
    group_id: data.groupId,
    description: data.description,
    deadline: data.dueDate,
  };
  const response = await apiClient.post<Homework>('/homework', requestData);
  return response.data;
};

// Обновить домашнее задание
export const updateHomework = async (id: string, data: Partial<CreateHomeworkDto>): Promise<Homework> => {
  const response = await apiClient.put<Homework>(`/homework/${id}`, data);
  return response.data;
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

