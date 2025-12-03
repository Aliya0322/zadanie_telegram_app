import { useState, useCallback } from 'react';
import type {
  Homework,
  CreateHomeworkDto,
} from '../../../api/homeworkApi';
import {
  getHomeworkByGroup,
  createHomework,
  updateHomework,
  deleteHomework,
} from '../../../api/homeworkApi';

// Функция для сортировки заданий по дедлайну (от ближайшего к дальнему)
const sortHomeworkByDeadline = (homeworkList: Homework[]): Homework[] => {
  return [...homeworkList].sort((a, b) => {
    const dateA = new Date(a.deadline).getTime();
    const dateB = new Date(b.deadline).getTime();
    return dateA - dateB;
  });
};

export const useHomework = (groupId?: string) => {
  const [homework, setHomework] = useState<Homework[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchHomework = useCallback(async () => {
    if (!groupId) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await getHomeworkByGroup(groupId);
      setHomework(sortHomeworkByDeadline(data));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch homework'));
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  const create = useCallback(async (data: CreateHomeworkDto) => {
    if (!groupId) {
      throw new Error('Group ID is required to create homework');
    }
    setIsLoading(true);
    setError(null);
    try {
      const newHomework = await createHomework(groupId, data);
      setHomework((prev) => sortHomeworkByDeadline([...prev, newHomework]));
      return newHomework;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create homework'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  const update = useCallback(async (id: string, data: Partial<CreateHomeworkDto>) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedHomework = await updateHomework(id, data);
      setHomework((prev) =>
        sortHomeworkByDeadline(
          prev.map((hw) => (hw.id === Number(id) ? updatedHomework : hw))
        )
      );
      return updatedHomework;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update homework'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteHomework(id);
      setHomework((prev) => prev.filter((hw) => hw.id !== Number(id)));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete homework'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    homework,
    isLoading,
    error,
    fetchHomework,
    create,
    update,
    remove,
  };
};

