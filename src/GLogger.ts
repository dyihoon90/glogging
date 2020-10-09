import winston, { Logger, format, transports, Logform } from 'winston';
import * as Transport from 'winston-transport';
import { ICombinedLog, IConfigOptions, LoggingMode } from './domainModels/GLogger.interface';
import { DateTimeFormatter, ZonedDateTime } from '@js-joda/core';
import _ from 'lodash';

/**
 * How to use this class:
 * Initialize a new instance in your codebase. Use this instance as a singleton through the codebase.
 * if loggingMode is not provided, defaults to LoggingMode.PRODUCTION
 */
export class GLogger {
  private logger: Logger;
  private verboseMode = false;

  constructor({ loggingMode }: IConfigOptions) {
    switch (loggingMode) {
      case LoggingMode.LOCAL:
        this.logger = winston.createLogger({
          level: 'debug',
          format: format.combine(formatTimestamp())
        });
        this.logger.add(
          new transports.Console({
            format: format.combine(format.printf(consoleMessageFormatter))
          })
        );
        break;
      case LoggingMode.DEV:
        this.logger = winston.createLogger({
          level: 'info',
          format: format.combine(formatTimestamp())
        });
        this.logger.add(
          new transports.Console({
            format: format.combine(format.printf(consoleMessageFormatter))
          })
        );
        break;
      case LoggingMode.PRODUCTION:
      default:
        this.logger = winston.createLogger({
          level: 'info',
          format: format.combine(formatTimestamp())
        });
    }
  }

  public toggleVerboseModeOn(): void {
    this.verboseMode = true;
  }

  /**
   * Add a winston transport to this LogUtil instance
   * @param transport a winston-transport Log Transport instance
   */
  addLogTransport(transport: Transport): this {
    this.logger.add(transport);
    return this;
  }

  /**
   * Creates a log object of level debug
   * @example
   * info('msg', {mydata: "data"})
   * // creates the following log object
   * {message: 'msg', level: 'debug', mydata: 'data'}
   * @param data any additional relevant data, as a javascript object.
   * If it contains a `message` property, the string is appended
   * If it contains a `level` property, that is ignored
   */
  debug(message: string, data?: Record<string, unknown>): GLogger {
    if (this.verboseMode) {
      logVerbose('debug', message, data);
    }
    this.logger.debug(message, data);
    return this;
  }

  /**
   * Creates a log object of level info
   * @example
   * info('msg', {mydata: "data"})
   * // creates the following log object
   * {message: 'msg', level: 'info', mydata: 'data'}
   * @param data any additional relevant data, as a javascript object.
   * If it contains a `message` property, the string is appended
   * If it contains a `level` property, that is ignored
   */
  info(message: string, data?: Record<string, unknown>): GLogger {
    if (this.verboseMode) {
      logVerbose('info', message, data);
    }
    this.logger.info(message, data);
    return this;
  }

  /**
   * Creates a log object of level warn
   * @example
   * warn('msg', new Error('error msg'), {mydata: "data"})
   * // creates the following log object
   * {message: 'msg', level: 'warn', mydata: 'data', additionalInfo: {error: {stack: 'errorstack!',message:'error msg',name:'Error'}}}
   * @param data any additional relevant data, as a javascript object.
   * If it contains a `message` property, the string is appended
   * If it contains a `level` property, that is ignored
   */
  warn(message: string, error?: Error, data?: Record<string, unknown>): GLogger {
    if (this.verboseMode) {
      logVerbose('warn', message, data, error);
    }

    const dataToLog = data ? { ...data } : {};
    if (error) {
      dataToLog.additionalInfo = {
        ...(dataToLog.additionalInfo as Record<string, unknown>),
        error: { stack: error.stack, message: error.message, name: error.name }
      };
    }
    this.logger.warn(message, dataToLog);
    return this;
  }

  /**
   * Creates a log object of level error
   * @example
   * error('msg', new Error('error msg'), {mydata: "data"})
   * // creates the following log object
   * {message: 'msg', level: 'error', mydata: 'data', additionalInfo: {error: {stack: 'errorstack!',message:'error msg',name:'Error'}}}
   * @param data any additional relevant data, as a javascript object.
   * If it contains a `message` property, the string is appended
   * If it contains a `level` property, that is ignored
   */
  error(message: string, error?: Error, data?: Record<string, unknown>): GLogger {
    if (this.verboseMode) {
      logVerbose('error', message, data, error);
    }
    const dataToLog = data ? { ...data } : {};
    if (error) {
      dataToLog.additionalInfo = {
        ...(dataToLog.additionalInfo as Record<string, unknown>),
        error: { stack: error.stack, message: error.message, name: error.name }
      };
    }
    this.logger.error(message, dataToLog);
    return this;
  }
}

/**
 * Formatter for console logging in GLogging
 * Depending on whether trxCategory is passed in, either logs out basicLog or enrichedLog
 * @param info
 */
function consoleMessageFormatter(info: winston.Logform.TransformableInfo): string {
  const { level, message, timestamp, additionalInfo, filename, ...data } = info as ICombinedLog;
  const logString = `[${timestamp as string}][${level.toUpperCase()}]`;
  const { trxCategory, trxId, trxModule, trxName, trxStatus, timeTakenInMillis, userToken } = data;
  if (!trxCategory) {
    const basicLog = logString
      .concat(`[${message}]`)
      .concat(`[${data ? formatWithLinebreakAndIndent(data) : 'no data'}]\n`)
      .concat(`[${additionalInfo ? formatWithLinebreakAndIndent(additionalInfo) : 'no additionalInfo'}]\n`);
    return basicLog;
  }
  const enrichedLog = logString
    .concat(
      `[${trxCategory}][${trxModule}][${trxId}][${trxName}][${trxStatus}][${
        timeTakenInMillis?.toString() || 'time taken is not tracked'
      }ms]`
    )
    .concat(`[${message}]\n`)
    .concat(`[${userToken ? formatWithLinebreakAndIndent(userToken) : 'no user token'}]\n`)
    .concat(`[${additionalInfo ? formatWithLinebreakAndIndent(additionalInfo) : 'no additionalInfo'}]\n`);
  return filename ? enrichedLog.concat(`[${filename}]`) : enrichedLog;
}

const formatTimestamp = winston.format((info: Logform.TransformableInfo) => {
  info.timestamp = ZonedDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
  return info;
});

function formatWithLinebreakAndIndent(obj: Record<string, unknown>): string {
  return JSON.stringify(obj, null, 4)?.replace(/\\n/g, '\n');
}

function logVerbose(level: string, message: string, data?: Record<string, unknown>, error?: Error) {
  console.log(`${level}() received message: ${message}`);
  if (data) {
    console.log(`${level}() received data: ${formatWithLinebreakAndIndent(data)}`);
  }
  if (error) {
    console.log(`${level}() received error: ${error.toString()}`);
  }
}
