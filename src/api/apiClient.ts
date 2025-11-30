import axios from 'axios';

// Настройка базового URL для API
// Бэкенд использует префикс /api/v1
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Убеждаемся, что URL начинается с http:// или https://
if (API_BASE_URL && !API_BASE_URL.match(/^https?:\/\//)) {
  console.warn('[API Config] URL не содержит протокол, добавляю https://');
  API_BASE_URL = `https://${API_BASE_URL}`;
}

// Удаляем trailing slash, если есть
API_BASE_URL = API_BASE_URL.replace(/\/$/, '');

// Логирование URL для отладки (всегда, чтобы видеть проблемы)
console.log('[API Config] Base URL:', API_BASE_URL);
console.log('[API Config] VITE_API_BASE_URL from env:', import.meta.env.VITE_API_BASE_URL);

if (import.meta.env.DEV) {
  // Предупреждение, если используется localhost, но есть .env файл с другим URL
  if (API_BASE_URL.includes('localhost') && import.meta.env.VITE_API_BASE_URL === undefined) {
    console.warn('⚠️ [API Config] ВНИМАНИЕ: Используется localhost вместо URL из .env файла!');
    console.warn('⚠️ Перезапустите dev-сервер (npm run dev), чтобы загрузить переменные из .env');
    console.warn('⚠️ Ожидаемый URL: https://api.myclassapp.ru/api/v1');
  }
}

// Создание экземпляра Axios с базовой конфигурацией
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Функция для получения initData из всех возможных источников
const getTelegramInitData = (): string | null => {
  if (typeof window === 'undefined' || !window.Telegram?.WebApp) {
    return null;
  }

  const webApp = window.Telegram.WebApp;
  
  // Список возможных источников initData (в порядке приоритета)
  const sources = [
    // 1. Основной способ - webApp.initData
    () => (webApp as any).initData,
    // 2. Альтернативный способ - webApp.initDataRaw
    () => (webApp as any).initDataRaw,
    // 3. URL параметр tgWebAppData
    () => new URLSearchParams(window.location.search).get('tgWebAppData'),
    // 4. URL параметр _tgWebAppData (с подчеркиванием)
    () => new URLSearchParams(window.location.search).get('_tgWebAppData'),
    // 5. Проверяем hash часть URL (может содержать initData)
    () => {
      const hash = window.location.hash;
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1));
        return hashParams.get('tgWebAppData') || hashParams.get('_tgWebAppData');
      }
      return null;
    },
  ];

  // Пробуем каждый источник
  for (const getSource of sources) {
    try {
      const data = getSource();
      if (data && typeof data === 'string' && data.trim().length > 0) {
        return data;
      }
    } catch (error) {
      // Пропускаем ошибки и пробуем следующий источник
      continue;
    }
  }

  return null;
};

// Добавляем Interceptor для передачи initData (авторизации TG)
apiClient.interceptors.request.use(
  (config) => {
    // Получаем initData из всех возможных источников
    const initData = getTelegramInitData();

    // Критичное логирование для важных запросов - видно в production
    if (config.url?.includes('/auth/')) {
      console.log('[API] Auth request:', {
        url: config.url,
        method: config.method,
        hasInitData: !!initData,
        initDataLength: initData ? initData.length : 0,
      });
    }

    if (initData) {
      // Бэкенд должен проверить этот initData для авторизации
      config.headers['X-Telegram-Init-Data'] = initData;
      
      if (config.url?.includes('/auth/')) {
        console.log('[API] ✅ InitData found and added to request');
      }
    } else {
      // Критичное предупреждение для auth запросов - видно в production
      if (config.url?.includes('/auth/')) {
        console.error('[API] ❌ Telegram initData NOT FOUND for auth request!');
        console.error('[API] Request will likely fail:', {
          url: config.url,
          method: config.method,
        });
      }
      
      // Детальное логирование для development
      if (import.meta.env.DEV) {
        console.warn('[API Client] Telegram initData not found. Request may fail authentication.');
        console.warn('[API Client] Available Telegram WebApp:', !!window.Telegram?.WebApp);
        if (window.Telegram?.WebApp) {
          const webApp = window.Telegram.WebApp;
          console.warn('[API Client] initDataUnsafe available:', !!webApp.initDataUnsafe);
          console.warn('[API Client] Platform:', webApp.platform);
          console.warn('[API Client] Version:', webApp.version);
          
          // Проверяем все возможные источники initData
          console.warn('[API Client] Checking initData sources:');
          console.warn('  - webApp.initData:', !!(webApp as any).initData);
          console.warn('  - webApp.initDataRaw:', !!(webApp as any).initDataRaw);
          console.warn('  - URL tgWebAppData:', !!new URLSearchParams(window.location.search).get('tgWebAppData'));
          console.warn('  - URL _tgWebAppData:', !!new URLSearchParams(window.location.search).get('_tgWebAppData'));
        }
      }
    }

    // Авторизация только через Telegram initData, без localStorage токена

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

