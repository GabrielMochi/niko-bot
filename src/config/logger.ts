import { createLogger, Logger, transports, format } from 'winston';
import path from 'path';

const logDirname: string = path.resolve(__dirname, '../../logs');
const infoLogFilePath: string = path.join(logDirname, 'info.log');
const errorLogFilePath: string = path.join(logDirname, 'error.log');

const logger: Logger = createLogger({
  transports: [
    new transports.Console({
      level: 'debug',
      format: format.simple(),
      handleExceptions: true
    }),
    new transports.File({
      level: 'info',
      filename: infoLogFilePath,
      format: format.simple()
    }),
    new transports.File({
      level: 'error',
      filename: errorLogFilePath,
      format: format.simple(),
      handleExceptions: true
    })
  ]
});

export default logger;
