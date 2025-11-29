// src/utils/linkHelpers.ts

const BOT_USERNAME = 'AlphaClassBot'; // @AlphaClassBot

export const generateInviteLink = (inviteToken: string): string => {
  // Формат Telegram Deep Link: t.me/username?start=payload
  return `https://t.me/${BOT_USERNAME}?start=group_${inviteToken}`;
};

