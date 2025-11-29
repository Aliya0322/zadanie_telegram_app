# Backend API

Бэкенд приложения находится в отдельном репозитории.

## Структура проекта

```
zadanie_telegram_app/              # Frontend (текущий репозиторий)
zadanie_telegram_app_backend/      # Backend (отдельный репозиторий)
```

## API Endpoints

Бэкенд должен предоставлять следующие эндпоинты:

### Base URL
```
https://api.yourmentordesk.com/v1
```

### Авторизация
Все запросы должны включать заголовок:
```
X-Telegram-Init-Data: <telegram_init_data>
```

Бэкенд должен проверять и валидировать `initData` для авторизации пользователей.

### Группы

- `GET /groups` - Получить все группы пользователя
- `GET /groups/:id` - Получить группу по ID
- `POST /groups` - Создать новую группу
- `PUT /groups/:id` - Обновить группу
- `DELETE /groups/:id` - Удалить группу
- `POST /groups/:id/students` - Добавить студента в группу
- `DELETE /groups/:id/students/:studentId` - Удалить студента из группы

### Домашние задания

- `GET /homework/group/:groupId` - Получить задания для группы
- `GET /homework/:id` - Получить задание по ID
- `POST /homework` - Создать новое задание
- `POST /groups/:groupId/homework` - Создать задание для группы (с уведомлениями)
- `PUT /homework/:id` - Обновить задание
- `DELETE /homework/:id` - Удалить задание
- `POST /homework/:id/submit` - Отправить выполненное задание (для студентов)
- `GET /homework/:id/submissions` - Получить все отправки для задания
- `PUT /homework/submissions/:submissionId/grade` - Оценить задание (для учителей)

### Расписание

- `GET /schedule` - Получить расписание пользователя
- `GET /schedule/student/:studentId` - Получить расписание студента

## Переменные окружения

В `.env` файле фронтенда:
```
VITE_API_BASE_URL=https://api.yourmentordesk.com/v1
```

## Рекомендуемый стек для бэкенда

- **Node.js + Express** или **Python + FastAPI**
- **PostgreSQL** или **MongoDB** для базы данных
- **Telegram Bot API** для отправки уведомлений
- **JWT** или проверка `initData` для авторизации

## Проверка Telegram InitData

Бэкенд должен проверять валидность `initData` от Telegram:

1. Проверить подпись (hash)
2. Проверить срок действия (auth_date)
3. Извлечь данные пользователя

Пример библиотек:
- Node.js: `node-telegram-bot-api` или `@twa-dev/init-data-node`
- Python: `python-telegram-bot` или `telegram-web-apps`



