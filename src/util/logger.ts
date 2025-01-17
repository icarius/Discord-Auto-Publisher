import createLogger from 'pino';
import config from '#config';

const logger = createLogger({
  level: config.loggingLevel ?? 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: false,
    },
  },
  base: undefined,
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
});

export default logger;
