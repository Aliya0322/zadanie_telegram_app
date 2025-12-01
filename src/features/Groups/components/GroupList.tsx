import React from 'react';
import type { GroupFrontend } from '../../../api/groupsApi';
import CustomCard from '../../../components/ui/CustomCard';

export interface GroupListProps {
  groups: GroupFrontend[];
  onGroupClick: (group: GroupFrontend) => void;
  isLoading?: boolean;
}

const GroupList: React.FC<GroupListProps> = ({ groups, onGroupClick, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Нет групп</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <CustomCard
          key={group.id}
          title={group.name}
          subtitle={group.description}
          onClick={() => onGroupClick(group)}
          className="hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>👤 {group.students?.length || 0} учеников</span>
            <span className="text-xs text-gray-400">
              Создано: {new Date(group.createdAt).toLocaleDateString('ru-RU')}
            </span>
          </div>
        </CustomCard>
      ))}
    </div>
  );
};

export default GroupList;

