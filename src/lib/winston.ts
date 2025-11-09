import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize } = format;

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

export const logger = createLogger({
  level: 'info',
  format: combine(timestamp(), logFormat),
  transports: [
    new transports.Console({ format: combine(colorize(), timestamp(), logFormat) }),
    // You can add more transports here (e.g., File transport)
  ],
});

// Example usage:
// logger.info('This is an info message');
// logger.error('This is an error message');

// You can create helper functions for different log levels if needed
export const logInfo = (message: string) => {
  logger.info(message);
};

export const logError = (message: string) => {
  logger.error(message);
};
