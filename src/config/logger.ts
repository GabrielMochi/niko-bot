import { createLogger, Logger, transports, format } from 'winston';
import path from 'path';

const logDirname: string = path.resolve(__dirname, '../../logs');
const infoLogFilePath: string = path.join(logDirname, 'info.log');
const errorLogFilePath: string = path.join(logDirname, 'error.log');

// tslint:disable-next-line: typedef
const simpleTimestampFormatter = format(info => {
  info.message = `${new Date().toISOString()} ${info.message}`;
  return info;
});

const logger: Logger = createLogger({
  transports: [
    new transports.Console({
      level: 'debug',
      format: format.combine(
        format.colorize(),
        simpleTimestampFormatter(),
        format.simple()
      ),
      handleExceptions: true
    }),
    new transports.File({
      level: 'info',
      filename: infoLogFilePath,
      format: format.combine(
        simpleTimestampFormatter(),
        format.simple()
      )
    }),
    new transports.File({
      level: 'error',
      filename: errorLogFilePath,
      format: format.combine(
        simpleTimestampFormatter(),
        format.simple()
      ),
      handleExceptions: true
    })
  ]
});

export default logger;
