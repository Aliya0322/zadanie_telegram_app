import React, { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';
import type { GroupFrontend } from '../../../api/groupsApi';
import { getGroups, createGroup } from '../../../api/groupsApi';
import type { CreateGroupDto } from '../../../api/groupsApi';

export interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  group: string;
  groupId?: string;
  date?: string;
}

interface GroupContextType {
  groups: GroupFrontend[];
  schedule: ScheduleItem[];
  fetchGroups: () => Promise<void>;
  createGroup: (newGroupData: CreateGroupDto) => Promise<void>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const useGroups = () => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroups must be used within a GroupProvider');
  }
  return context;
};

interface GroupProviderProps {
  children: ReactNode;
}

export const GroupProvider: React.FC<GroupProviderProps> = ({ children }) => {
  const [groups, setGroups] = useState<GroupFrontend[]>([]);
  const [schedule] = useState<ScheduleItem[]>([]);

  // Функции для загрузки, создания и обновления данных
  const fetchGroups = async () => {
    try {
      // ... вызов API
      const data = await getGroups();
      setGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const createGroupHandler = async (newGroupData: CreateGroupDto) => {
    try {
      // ... вызов API
      const newGroup = await createGroup(newGroupData);
      setGroups((prev) => [...prev, newGroup]);
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  };

  return (
    <GroupContext.Provider value={{ groups, schedule, fetchGroups, createGroup: createGroupHandler }}>
      {children}
    </GroupContext.Provider>
  );
};

