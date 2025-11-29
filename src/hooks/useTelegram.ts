import { useEffect, useState } from 'react';

// Типы для Telegram WebApp SDK
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
          query_id?: string;
          auth_date?: number;
          hash?: string;
        };
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        isClosingConfirmationEnabled: boolean;
        BackButton: {
          isVisible: boolean;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
          setParams: (params: {
            text?: string;
            color?: string;
            text_color?: string;
            is_active?: boolean;
            is_visible?: boolean;
          }) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        sendData: (data: string) => void;
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
        openTelegramLink: (url: string) => void;
        openInvoice: (url: string, callback?: (status: string) => void) => void;
        showPopup: (params: {
          title?: string;
          message: string;
          buttons?: Array<{
            id?: string;
            type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
            text: string;
          }>;
        }, callback?: (buttonId: string) => void) => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
        showScanQrPopup: (params: {
          text?: string;
        }, callback?: (text: string) => void) => void;
        closeScanQrPopup: () => void;
        readTextFromClipboard: (callback?: (text: string) => void) => void;
        requestWriteAccess: (callback?: (granted: boolean) => void) => void;
        requestContact: (callback?: (granted: boolean) => void) => void;
      };
    };
  }
}

export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
}

export const useTelegram = () => {
  const [telegram, setTelegram] = useState<Window['Telegram'] | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Проверяем, доступен ли Telegram WebApp SDK
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      
      // Инициализируем приложение
      webApp.ready();
      webApp.expand();

      setTelegram(window.Telegram);
      
      // Получаем данные пользователя
      const initData = webApp.initDataUnsafe;
      if (initData.user) {
        setUser({
          id: initData.user.id,
          firstName: initData.user.first_name,
          lastName: initData.user.last_name,
          username: initData.user.username,
          languageCode: initData.user.language_code,
        });
      }

      setIsReady(true);
    } else {
      // Для разработки вне Telegram
      console.warn('Telegram WebApp SDK не найден. Работа в режиме разработки.');
      setIsReady(true);
    }
  }, []);

  // Получение объекта WebApp из глобального window
  const tg = telegram?.WebApp;

  // Функция для закрытия приложения
  const close = () => {
    if (tg) {
      tg.close();
    }
  };

  // Функция для использования главной синей кнопки
  const setMainButton = (text: string, onClick: () => void) => {
    if (tg) {
      tg.MainButton.setText(text);
      tg.MainButton.show();
      tg.MainButton.onClick(onClick);
    }
  };

  // Функция для скрытия кнопки
  const hideMainButton = () => {
    if (tg) {
      tg.MainButton.hide();
      tg.MainButton.offClick(() => {});
    }
  };

  // Данные пользователя для логина
  const userData = tg?.initDataUnsafe.user;

  return {
    tg,
    telegram,
    webApp: tg,
    user,
    userData,
    isReady,
    isTelegram: !!telegram,
    close,
    setMainButton,
    hideMainButton,
    // Прочие функции: HapticFeedback, ColorScheme...
    hapticFeedback: tg?.HapticFeedback,
    colorScheme: tg?.colorScheme,
    themeParams: tg?.themeParams,
  };
};

