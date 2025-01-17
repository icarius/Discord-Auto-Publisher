import { Manager as ClusterManager, ManagerOptions as ClusterManagerOptions } from 'discord-hybrid-sharding';
import { getFiles } from '#util/fileUtils';
import logger from '#util/logger';
import { minToMs } from '#util/timeConverters';

class AutoPublisher extends ClusterManager {
  constructor(options?: ClusterManagerOptions) {
    const clientFile = getFiles('AutoPublisher.js')[0];
    super(clientFile, options);
  }

  public start() {
    this._registerEvents();
    this.spawn({ timeout: -1 }).then(() => {
      logger.info('Clustering complete!');
      setTimeout(() => {
        /* eslint-disable @typescript-eslint/ban-ts-comment */
        this.broadcastEval((c) => {
          // @ts-ignore
          c.updatePresence();
          // @ts-ignore
          c.startPresenceInterval();
        });
      }, minToMs(1));
    });
  }

  private async _registerEvents() {
    this.on('clusterCreate', ({ id }) => logger.debug(`[Cluster ${id}] Created`));
    this.on('debug', (value) => logger.debug(value));
  }
}

process.on('unhandledRejection', ({ stack }: Error) => logger.error(stack));

export default AutoPublisher;
