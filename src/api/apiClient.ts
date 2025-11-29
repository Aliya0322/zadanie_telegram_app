import axios from 'axios';

// Настройка базового URL для API
// ЗАМЕНИТЕ НА АДРЕС ВАШЕГО БЭКЕНДА
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.yourmentordesk.com/v1';

// Создание экземпляра Axios с базовой конфигурацией
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Добавляем Interceptor для передачи initData (авторизации TG)
apiClient.interceptors.request.use(
  (config) => {
    // Внимание: window.Telegram.WebApp должен быть доступен
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      // initData может быть доступен через initData или через query string
      // В некоторых версиях SDK это свойство может называться по-другому
      const initData = (webApp as any).initData || 
                       (webApp as any).initDataRaw ||
                       new URLSearchParams(window.location.search).get('tgWebAppData');

      if (initData) {
        // Ваш бэкенд должен проверить этот initData для авторизации
        config.headers['X-Telegram-Init-Data'] = initData;
      }
    }

    // Также добавляем токен авторизации, если есть (для fallback)
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Обработка неавторизованного доступа
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

