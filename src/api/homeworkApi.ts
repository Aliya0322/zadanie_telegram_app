import apiClient from './apiClient';

// Интерфейсы соответствуют бэкенд схемам из Pydantic (camelCase)
export interface Homework {
  id: number;
  groupId: number;
  description: string;
  deadline: string; // ISO datetime string
  createdAt: string; // ISO datetime string
  reminderSent: boolean;
  files?: HomeworkFile[]; // Файлы задания
}

export interface HomeworkFile {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
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
  files?: File[]; // Файлы для загрузки
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
// Если есть файлы, отправляем через FormData, иначе через JSON
export const createHomework = async (groupId: string, data: CreateHomeworkDto): Promise<Homework> => {
  // Если есть файлы, используем FormData
  if (data.files && data.files.length > 0) {
    const formData = new FormData();
    formData.append('description', data.description);
    formData.append('deadline', data.dueDate);
    
    // Добавляем все файлы
    data.files.forEach((file) => {
      formData.append('files', file);
    });
    
    const response = await apiClient.post<Homework>(`/groups/${groupId}/homework`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
  
  // Если файлов нет, отправляем как JSON
  const requestData: CreateHomeworkRequestDto = {
    description: data.description,
    deadline: data.dueDate,
  };
  const response = await apiClient.post<Homework>(`/groups/${groupId}/homework`, requestData);
  return response.data;
};

// Обновить домашнее задание
// Если есть файлы, отправляем через FormData, иначе через JSON
export const updateHomework = async (id: string, data: Partial<CreateHomeworkDto>): Promise<Homework> => {
  // Если есть файлы, используем FormData
  if (data.files && data.files.length > 0) {
    const formData = new FormData();
    
    if (data.description !== undefined) {
      formData.append('description', data.description);
    }
    if (data.dueDate !== undefined) {
      formData.append('deadline', data.dueDate);
    }
    
    // Добавляем все файлы
    data.files.forEach((file) => {
      formData.append('files', file);
    });
    
    const response = await apiClient.put<Homework>(`/homework/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
  
  // Если файлов нет, отправляем как JSON
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
