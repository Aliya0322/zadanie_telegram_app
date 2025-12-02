import React from 'react';
import type { Group } from '../../../api/groupsApi';
import CustomCard from '../../../components/ui/CustomCard';
import Button from '../../../components/ui/Button';

export interface GroupDetailsProps {
  group: Group;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddStudent?: () => void;
}

const GroupDetails: React.FC<GroupDetailsProps> = ({
  group,
  onEdit,
  onDelete,
  onAddStudent,
}) => {
  return (
    <div className="space-y-4">
      <CustomCard title={group.name}>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700">ID группы:</p>
            <p className="text-sm text-gray-600">{group.id}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Количество учеников:</p>
            <p className="text-sm text-gray-600">{group.students?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Дата создания:</p>
            <p className="text-sm text-gray-600">
              {new Date(group.createdAt).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </CustomCard>

      {group.students && group.students.length > 0 && (
        <CustomCard title="Ученики">
          <ul className="space-y-2">
            {group.students.map((studentId, index) => (
              <li key={index} className="text-sm text-gray-600">
                👤 Ученик #{studentId}
              </li>
            ))}
          </ul>
        </CustomCard>
      )}

      <div className="flex gap-2">
        {onEdit && (
          <Button variant="outline" onClick={onEdit} className="flex-1">
            Редактировать
          </Button>
        )}
        {onAddStudent && (
          <Button variant="primary" onClick={onAddStudent} className="flex-1">
            Добавить ученика
          </Button>
        )}
        {onDelete && (
          <Button variant="danger" onClick={onDelete}>
            Удалить
          </Button>
        )}
      </div>
    </div>
  );
};

export default GroupDetails;

