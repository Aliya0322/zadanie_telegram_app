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

export interface CreateHomeworkDto {
  title: string;
  description: string;
  groupId: string;
  dueDate: string;
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
export const createHomework = async (data: CreateHomeworkDto): Promise<Homework> => {
  const response = await apiClient.post<Homework>('/homework', data);
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

// Отправить выполненное задание (для студентов)
export const submitHomework = async (homeworkId: string, data: SubmitHomeworkDto): Promise<HomeworkSubmission> => {
  const response = await apiClient.post<HomeworkSubmission>(`/homework/${homeworkId}/submit`, data);
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

