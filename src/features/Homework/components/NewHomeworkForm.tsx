import React, { useState } from 'react';
import type { CreateHomeworkDto } from '../../../api/homeworkApi';
import Button from '../../../components/ui/Button';
import CustomCard from '../../../components/ui/CustomCard';

export interface NewHomeworkFormProps {
  groupId: string;
  onSubmit: (data: CreateHomeworkDto) => Promise<void>;
  onCancel?: () => void;
}

const NewHomeworkForm: React.FC<NewHomeworkFormProps> = ({
  groupId,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CreateHomeworkDto>({
    title: '',
    description: '',
    groupId,
    dueDate: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateHomeworkDto, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CreateHomeworkDto, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Название обязательно';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Описание обязательно';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Дата сдачи обязательна';
    } else if (new Date(formData.dueDate) < new Date()) {
      newErrors.dueDate = 'Дата сдачи не может быть в прошлом';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
      // Сброс формы после успешной отправки
      setFormData({
        title: '',
        description: '',
        groupId,
        dueDate: '',
      });
    } catch (error) {
      console.error('Error creating homework:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Очистка ошибки при изменении поля
    if (errors[name as keyof CreateHomeworkDto]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <CustomCard title="Новое домашнее задание">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Название *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Введите название задания"
          />
          {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Описание *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Введите описание задания"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500">{errors.description}</p>
          )}
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
            Дата сдачи *
          </label>
          <input
            type="datetime-local"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.dueDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.dueDate && <p className="mt-1 text-sm text-red-500">{errors.dueDate}</p>}
        </div>

        <div className="flex gap-2">
          <Button type="submit" variant="primary" isLoading={isLoading} className="flex-1">
            Создать задание
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Отмена
            </Button>
          )}
        </div>
      </form>
    </CustomCard>
  );
};

export default NewHomeworkForm;

