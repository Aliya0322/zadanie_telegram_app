import axios from 'axios';

// Настройка базового URL для API
// Бэкенд использует префикс /api/v1
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Логирование URL для отладки (только в development)
if (import.meta.env.DEV) {
  console.log('[API Config] Base URL:', API_BASE_URL);
  console.log('[API Config] VITE_API_BASE_URL from env:', import.meta.env.VITE_API_BASE_URL);
}

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
      } else {
        console.warn('Telegram initData not found. Request may fail authentication.');
      }
    }

    // Также добавляем токен авторизации, если есть (для fallback)
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Логирование для отладки (только в development)
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        baseURL: config.baseURL,
        data: config.data,
        headers: {
          'X-Telegram-Init-Data': config.headers['X-Telegram-Init-Data'] ? 'present' : 'missing',
          Authorization: config.headers.Authorization ? 'present' : 'missing',
        },
      });
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
    // Логирование ошибок для отладки
    if (import.meta.env.DEV) {
      console.error('[API Error]', {
        url: error.config?.url,
        method: error.config?.method,
        fullURL: error.config?.baseURL + error.config?.url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code,
      });
      
      // Специальная обработка CORS ошибок
      if (error.message === 'Network Error' && !error.response) {
        console.error('[CORS Error] Возможна проблема с CORS или сервер недоступен');
        console.error('Попытка подключения к:', error.config?.baseURL + error.config?.url);
      }
    }

    if (error.response?.status === 401) {
      // Обработка неавторизованного доступа
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      // Не перенаправляем автоматически, если это не критично
      // window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

