// src/utils/linkHelpers.ts

const BOT_USERNAME = 'myclassapp_bot'; // @myclassapp_bot

export const generateInviteLink = (inviteToken: string): string => {
  // Формат Telegram Deep Link: t.me/username?start=payload
  // Используется бот: @myclassapp_bot
  return `https://t.me/${BOT_USERNAME}?start=group_${inviteToken}`;
};

