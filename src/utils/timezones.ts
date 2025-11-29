export interface TimezoneOption {
  value: string;
  label: string;
}

export const timezones: TimezoneOption[] = [
  // Россия и СНГ
  { value: 'Europe/Moscow', label: 'Москва (UTC+3)' },
  { value: 'Europe/Kiev', label: 'Киев (UTC+2)' },
  { value: 'Asia/Almaty', label: 'Алматы (UTC+6)' },
  { value: 'Asia/Tashkent', label: 'Ташкент (UTC+5)' },
  { value: 'Asia/Baku', label: 'Баку (UTC+4)' },
  { value: 'Asia/Yerevan', label: 'Ереван (UTC+4)' },
  { value: 'Asia/Tbilisi', label: 'Тбилиси (UTC+4)' },
  { value: 'Europe/Minsk', label: 'Минск (UTC+3)' },
  { value: 'Asia/Dushanbe', label: 'Душанбе (UTC+5)' },
  { value: 'Asia/Bishkek', label: 'Бишкек (UTC+6)' },
  { value: 'Asia/Ashgabat', label: 'Ашхабад (UTC+5)' },
  
  // Европа
  { value: 'Europe/London', label: 'Лондон (UTC+0/+1)' },
  { value: 'Europe/Paris', label: 'Париж (UTC+1/+2)' },
  { value: 'Europe/Berlin', label: 'Берлин (UTC+1/+2)' },
  { value: 'Europe/Rome', label: 'Рим (UTC+1/+2)' },
  { value: 'Europe/Madrid', label: 'Мадрид (UTC+1/+2)' },
  { value: 'Europe/Athens', label: 'Афины (UTC+2/+3)' },
  { value: 'Europe/Warsaw', label: 'Варшава (UTC+1/+2)' },
  { value: 'Europe/Prague', label: 'Прага (UTC+1/+2)' },
  { value: 'Europe/Stockholm', label: 'Стокгольм (UTC+1/+2)' },
  { value: 'Europe/Amsterdam', label: 'Амстердам (UTC+1/+2)' },
  
  // Америка
  { value: 'America/New_York', label: 'Нью-Йорк (UTC-5/-4)' },
  { value: 'America/Los_Angeles', label: 'Лос-Анджелес (UTC-8/-7)' },
  { value: 'America/Chicago', label: 'Чикаго (UTC-6/-5)' },
  { value: 'America/Denver', label: 'Денвер (UTC-7/-6)' },
  { value: 'America/Toronto', label: 'Торонто (UTC-5/-4)' },
  { value: 'America/Mexico_City', label: 'Мехико (UTC-6/-5)' },
  { value: 'America/Sao_Paulo', label: 'Сан-Паулу (UTC-3)' },
  { value: 'America/Buenos_Aires', label: 'Буэнос-Айрес (UTC-3)' },
  
  // Азия
  { value: 'Asia/Tokyo', label: 'Токио (UTC+9)' },
  { value: 'Asia/Shanghai', label: 'Шанхай (UTC+8)' },
  { value: 'Asia/Seoul', label: 'Сеул (UTC+9)' },
  { value: 'Asia/Hong_Kong', label: 'Гонконг (UTC+8)' },
  { value: 'Asia/Singapore', label: 'Сингапур (UTC+8)' },
  { value: 'Asia/Bangkok', label: 'Бангкок (UTC+7)' },
  { value: 'Asia/Jakarta', label: 'Джакарта (UTC+7)' },
  { value: 'Asia/Manila', label: 'Манила (UTC+8)' },
  { value: 'Asia/Kolkata', label: 'Мумбаи (UTC+5:30)' },
  { value: 'Asia/Dubai', label: 'Дубай (UTC+4)' },
  { value: 'Asia/Riyadh', label: 'Эр-Рияд (UTC+3)' },
  { value: 'Asia/Tehran', label: 'Тегеран (UTC+3:30)' },
  
  // Австралия и Океания
  { value: 'Australia/Sydney', label: 'Сидней (UTC+10/+11)' },
  { value: 'Australia/Melbourne', label: 'Мельбурн (UTC+10/+11)' },
  { value: 'Pacific/Auckland', label: 'Окленд (UTC+12/+13)' },
];

// Функция для получения часового пояса по умолчанию (часовой пояс браузера)
export const getDefaultTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'Europe/Moscow'; // Fallback на Москву
  }
};

// Функция для поиска часового пояса в списке
export const findTimezone = (timezone: string): TimezoneOption | undefined => {
  return timezones.find(tz => tz.value === timezone);
};

