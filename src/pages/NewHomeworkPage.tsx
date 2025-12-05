import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Page, Navbar, List, ListInput, Block, Toggle, ListItem } from 'konsta/react';
import { useTelegram } from '../hooks/useTelegram';
import { useHomework } from '../features/Homework/hooks/useHomework';
import type { CreateHomeworkDto } from '../api/homeworkApi';

const NewHomeworkPage = () => {
  const { id: groupId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { webApp } = useTelegram();
  const { create } = useHomework(groupId);
  
  const [taskText, setTaskText] = useState('');
  const [deadline, setDeadline] = useState('');
  const [sendPush, setSendPush] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!taskText.trim() || !deadline || !groupId) {
      return;
    }

    setIsLoading(true);
    try {
      const homeworkData: CreateHomeworkDto = {
        description: taskText.trim(),
        groupId,
        dueDate: new Date(deadline).toISOString(),
      };

      await create(homeworkData);
      
      // После успешного создания задания - возврат к деталям группы
      if (webApp) {
        webApp.showAlert('Задание успешно создано!', () => {
          // В Telegram WebApp можно закрыть или вернуться назад
          if (groupId) {
            navigate(`/groups/${groupId}`);
          } else {
            webApp.close();
          }
        });
      } else {
        // В браузере - возврат к деталям группы
        if (groupId) {
          navigate(`/groups/${groupId}`);
        }
      }
    } catch (error) {
      console.error('Error creating homework:', error);
      if (webApp) {
        webApp.showAlert('Ошибка при создании задания. Попробуйте снова.');
      } else {
        alert('Ошибка при создании задания');
      }
    } finally {
      setIsLoading(false);
    }
  }, [taskText, deadline, groupId, webApp, navigate, create]);

  useEffect(() => {
    // Настройка MainButton Telegram
    if (webApp) {
      webApp.MainButton.setText('ОТПРАВИТЬ В ГРУППУ');
      webApp.MainButton.show();
      webApp.MainButton.onClick(handleSubmit);
      webApp.MainButton.disable();

      return () => {
        webApp.MainButton.offClick(handleSubmit);
        webApp.MainButton.hide();
      };
    }
  }, [webApp, handleSubmit]);

  useEffect(() => {
    // Включение/отключение кнопки в зависимости от заполненности полей
    if (webApp) {
      if (taskText.trim() && deadline) {
        webApp.MainButton.enable();
      } else {
        webApp.MainButton.disable();
      }
    }
  }, [webApp, taskText, deadline]);

  const handleCancel = () => {
    if (webApp) {
      webApp.close();
    } else {
      navigate(`/groups/${groupId}`);
    }
  };

  return (
    <Page>
      <Navbar
        title="Новое задание"
        left={
          <button onClick={handleCancel} className="text-blue-600">
            Отмена
          </button>
        }
      />

      <List strong className="mt-4">
        <ListInput
          label="Текст задания"
          type="textarea"
          placeholder="Решить номера №124, 125, 128..."
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          inputClassName="!h-28"
        />

        <ListInput
          label="Дедлайн (срок сдачи)"
          type="datetime-local"
          placeholder="Выберите дату и время"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
      </List>

      <List strong className="mt-4">
        <ListItem
          title="Отправить пуш-уведомление"
          after={
            <Toggle
              checked={sendPush}
              onChange={() => setSendPush(!sendPush)}
              className="k-color-blue"
            />
          }
        >
          <div className="text-xs text-gray-500">
            Ученики получат уведомление немедленно.
          </div>
        </ListItem>
      </List>

      {/* Кнопка отправки - для десктопа */}
      {!webApp && (
        <Block className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-200">
          <button
            onClick={handleSubmit}
            disabled={!taskText.trim() || !deadline || isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Отправка...' : 'ОТПРАВИТЬ В ГРУППУ'}
          </button>
        </Block>
      )}
    </Page>
  );
};

export default NewHomeworkPage;

