import type { Guild, GuildChannel, Snowflake } from 'discord.js';

export const channelToString = (channel: GuildChannel): string => {
  return `#${channel.name} (${channel.id})`;
};

export const guildToString = (guild: Guild | null, guildIdFallback?: Snowflake): string => {
  if (!guild) return `unknown guild (${guildIdFallback ?? 'unknown guild ID'})`;
  return `"${guild}" (${guildIdFallback ?? guild.id})`;
};

export const guildMembersToString = (guild: Guild): string => {
  return `${guild.memberCount ?? 'unknown'} members`;
};
