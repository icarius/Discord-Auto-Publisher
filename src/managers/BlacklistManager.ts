import Cluster from 'discord-hybrid-sharding';
import { Client, ShardClientUtil, Snowflake } from 'discord.js-light';
import client from '#client';
import config from '#config';
import dbIds from '#constants/redisDatabaseIds';
import getGuild from '#functions/getGuild';
import RedisBaseManager from '#managers/RedisBaseManager';
import { keys } from '#structures/RedisClient';
import logger from '#util/logger';
import { guildToString } from '#util/stringFormatters';

const { spam } = config;
const isValidGuild = async (guildId: Snowflake) => !!(await getGuild(guildId));

export default class BlacklistManager extends RedisBaseManager {
  private SET = keys.BLACKLIST;

  constructor() {
    super(dbIds.BLACKLIST);
  }

  async startupCheck() {
    logger.debug('Checking for blacklisted guilds...');
    const guildIds: Snowflake[] = await this.redisClient.sMembers(this.SET);

    guildIds.forEach(async (guildId) => {
      if (client.guilds.cache.get(guildId) && spam.autoLeave) this.leaveGuild(guildId);
    });
  }

  async has(guildId: Snowflake) {
    return await this.redisClient.sIsMember(this.SET, guildId);
  }

  async add(guildId: Snowflake) {
    if (!isValidGuild) return 'Invalid server ID provided.';
    if (await this.has(guildId)) return `${guildId} is already blacklisted.`;
    await this.redisClient.sAdd(this.SET, guildId);

    this.leaveGuild(guildId);
    return `Added ${guildId} to the blacklist.`;
  }

  async remove(guildId: Snowflake) {
    if (await this.has(guildId)) return `${guildId} is not blacklisted.`;
    await this.redisClient.sRem(this.SET, guildId);
    return `Removed ${guildId} from the blacklist.`;
  }

  async leaveGuild(guildId: Snowflake) {
    const guild = client.guilds.cache.get(guildId);
    if (guild) {
      guild
        .leave()
        .then(() => logger.info(`Left blacklisted guild ${guildToString(guild)}`))
        .catch(logger.error);
      return;
    }

    // In case the guild is not on the same shard
    const shardData = Cluster.Client.getInfo();
    const shardId = ShardClientUtil.shardIdForGuildId(guildId, shardData.TOTAL_SHARDS);

    client.cluster
      .broadcastEval(
        async (c: Client, { guildId }: { guildId: Snowflake }) => {
          const guild = c.guilds?.cache?.get(guildId);
          if (guild) return await guild.leave();
          return;
        },
        {
          cluster: shardId,
          context: { guildId },
        }
      )
      .then(() => logger.info(`Left blacklisted guild ${guildId}`))
      .catch(logger.error);
  }
}