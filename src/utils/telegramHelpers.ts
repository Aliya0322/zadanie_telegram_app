/**
 * Безопасная обертка для Telegram WebApp методов
 * Обрабатывает случаи, когда методы не поддерживаются в некоторых версиях SDK
 */

/**
 * Безопасное отображение alert в Telegram WebApp
 * Fallback на обычный alert, если метод не поддерживается
 */
export const safeShowAlert = (message: string, callback?: () => void): void => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    try {
      const webApp = window.Telegram.WebApp;
      // showAlert поддерживается в большинстве версий
      if (typeof webApp.showAlert === 'function') {
        webApp.showAlert(message, callback);
        return;
      }
    } catch (error) {
      console.warn('showAlert failed, falling back to alert:', error);
    }
  }
  
  // Fallback на обычный alert
  alert(message);
  if (callback) {
    callback();
  }
};

/**
 * Безопасное отображение confirm в Telegram WebApp
 * Fallback на обычный confirm, если метод не поддерживается
 */
export const safeShowConfirm = (message: string, callback?: (confirmed: boolean) => void): void => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    try {
      const webApp = window.Telegram.WebApp;
      // showConfirm поддерживается в большинстве версий
      if (typeof webApp.showConfirm === 'function') {
        webApp.showConfirm(message, callback);
        return;
      }
    } catch (error) {
      console.warn('showConfirm failed, falling back to confirm:', error);
    }
  }
  
  // Fallback на обычный confirm
  const confirmed = confirm(message);
  if (callback) {
    callback(confirmed);
  }
};

/**
 * Безопасное отображение popup в Telegram WebApp
 * Использует showAlert как fallback, так как showPopup не поддерживается в версии 6.0
 */
export const safeShowPopup = (
  params: { title?: string; message: string },
  callback?: (buttonId: string) => void
): void => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    try {
      const webApp = window.Telegram.WebApp;
      // Проверяем, поддерживается ли showPopup
      if (typeof webApp.showPopup === 'function') {
        webApp.showPopup(params, callback);
        return;
      }
    } catch (error) {
      console.warn('showPopup not supported, falling back to showAlert:', error);
    }
  }
  
  // Fallback на showAlert (или обычный alert)
  const message = params.title ? `${params.title}\n\n${params.message}` : params.message;
  safeShowAlert(message, callback ? () => callback('ok') : undefined);
};

