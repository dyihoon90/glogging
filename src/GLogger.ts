import isSecret from 'is-secret';
import winston, { Logger, format, transports, Logform } from 'winston';
import * as Transport from 'winston-transport';
import { ICombinedLog, IConfigs, LoggingLevel, LoggingMode } from './domainModels/GLogger.interface';
import { DateTimeFormatter, ZonedDateTime } from '@js-joda/core';
import { traverseObject } from './utils/ObjUtils';

const DEFAULT_CONFIG: IConfigs = { loggingMode: LoggingMode.PRODUCTION };

/**
 * How to use this class:
 * Initialize a new instance in your codebase. Use this instance as a singleton through the codebase.
 * if loggingMode is not provided, defaults to LoggingMode.PRODUCTION
 */
export class GLogger {
  private logger: Logger;
  private verboseMode = false;
  private loggingMode: LoggingMode = LoggingMode.PRODUCTION;
  private loggingLevel: LoggingLevel = LoggingLevel.INFO;

  constructor(inputConfigs: Partial<IConfigs>) {
    const configs = { ...DEFAULT_CONFIG, ...inputConfigs };
    this.loggingMode = configs.loggingMode;
    switch (this.loggingMode) {
      case LoggingMode.LOCAL:
        this.loggingLevel = LoggingLevel.DEBUG;
        this.logger = winston.createLogger({
          level: 'debug',
          format: format.combine(formatTimestamp(), sensitiveDataRedacter)
        });
        this.logger.add(
          new transports.Console({
            format: format.combine(format.printf(consoleMessageFormatterFactory(configs)))
          })
        );
        break;
      case LoggingMode.DEV:
        this.loggingLevel = LoggingLevel.INFO;
        this.logger = winston.createLogger({
          level: 'info',
          format: format.combine(formatTimestamp(), sensitiveDataRedacter)
        });
        this.logger.add(
          new transports.Console({
            format: format.combine(format.printf(consoleMessageFormatterFactory(configs)))
          })
        );
        break;
      case LoggingMode.PRODUCTION:
      default:
        this.loggingLevel = LoggingLevel.INFO;
        this.logger = winston.createLogger({
          level: 'info',
          format: format.combine(formatTimestamp(), sensitiveDataRedacter)
        });
        if (configs.overrideDefault?.alwaysWriteToConsole) {
          this.logger.add(
            new transports.Console({
              format: format.combine(format.printf(consoleMessageFormatterFactory(configs)))
            })
          );
        }
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
  debug(message: string, data?: Record<string, any>): GLogger {
    if (this.verboseMode) {
      logVerbose('debug', message, data);
    }
    if (this.loggingLevel <= LoggingLevel.DEBUG) {
      this.logger.debug(message, data);
    }
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
  info(message: string, data?: Record<string, any>): GLogger {
    if (this.verboseMode) {
      logVerbose('info', message, data);
    }
    if (this.loggingLevel <= LoggingLevel.INFO) {
      this.logger.info(message, data);
    }
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
  warn(message: string, error?: Error, data?: Record<string, any>): GLogger {
    if (this.verboseMode) {
      logVerbose('warn', message, data, error);
    }

    const dataToLog = data ? { ...data } : {};
    if (error) {
      dataToLog.additionalInfo = {
        ...(dataToLog.additionalInfo as Record<string, any>),
        error: { stack: error.stack, message: error.message, name: error.name }
      };
    }
    if (this.loggingLevel <= LoggingLevel.WARN) {
      this.logger.warn(message, dataToLog);
    }
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
  error(message: string, error?: Error, data?: Record<string, any>): GLogger {
    if (this.verboseMode) {
      logVerbose('error', message, data, error);
    }
    const dataToLog = data ? { ...data } : {};
    if (error) {
      dataToLog.additionalInfo = {
        ...(dataToLog.additionalInfo as Record<string, any>),
        error: { stack: error.stack, message: error.message, name: error.name }
      };
    }
    if (this.loggingLevel <= LoggingLevel.ERROR) {
      this.logger.error(message, dataToLog);
    }
    return this;
  }
}

/**
 * Formatter for console logging in GLogging
 * Depending on whether trxCategory is passed in, either logs out basicLog or enrichedLog
 * @param info
 */
const consoleMessageFormatterFactory = (config: IConfigs) => {
  return (info: winston.Logform.TransformableInfo) => {
    const sectionSeparator =
      config.overrideDefault?.consoleLogSectionSeparator === '' || config.overrideDefault?.consoleLogSectionSeparator
        ? config.overrideDefault?.consoleLogSectionSeparator
        : '\n';

    const { level, message, timestamp, additionalInfo, filename, ...data } = info as ICombinedLog;
    const logString = `[${timestamp as string}][${level.toUpperCase()}]`;
    const { trxCategory, trxId, trxModule, trxName, trxStatus, timeTakenInMillis, userToken } = data;
    if (!trxCategory) {
      const basicLog = logString
        .concat(`[${message}][${data ? formatWithLinebreakAndIndent(data, config) : 'no data'}]`)
        .concat(sectionSeparator)
        .concat(`[${additionalInfo ? formatWithLinebreakAndIndent(additionalInfo, config) : 'no additionalInfo'}]`)
        .concat(sectionSeparator);
      return basicLog;
    }
    const enrichedLog = logString
      .concat(
        `[${trxCategory}][${trxModule}][${trxId}][${trxName}][${trxStatus}][${
          timeTakenInMillis?.toString() || 'time taken is not tracked'
        }ms]`
      )
      .concat(`[${message}]`)
      .concat(sectionSeparator)
      .concat(`[${userToken ? formatWithLinebreakAndIndent(userToken, config) : 'no user token'}]`)
      .concat(sectionSeparator)
      .concat(`[${additionalInfo ? formatWithLinebreakAndIndent(additionalInfo, config) : 'no additionalInfo'}]`)
      .concat(sectionSeparator);
    return filename ? enrichedLog.concat(`[${filename}]`) : enrichedLog;
  };
};

const formatTimestamp = winston.format((info: Logform.TransformableInfo) => {
  info.timestamp = ZonedDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
  return info;
});

function formatWithLinebreakAndIndent(obj: Record<string, any>, config?: IConfigs): string {
  const separator =
    config?.overrideDefault?.consoleLogSectionSeparator === '' || config?.overrideDefault?.consoleLogSectionSeparator
      ? config?.overrideDefault?.consoleLogSectionSeparator
      : '\n';
  return JSON.stringify(obj, null, 1)?.replace(/\\n/g, separator).replace(/\n/g, separator);
}

function logVerbose(level: string, message: string, data?: Record<string, any>, error?: Error) {
  console.log(`[GLogger] ${level}() received message: ${message}`);
  if (data) {
    console.log(`[GLogger] ${level}() received data: ${formatWithLinebreakAndIndent(data)}`);
  }
  if (error) {
    console.log(`[GLogger] ${level}() received error: ${error.toString()}`);
  }
}

const sensitiveDataRedacter = winston.format((info) => {
  traverseObject(info, redactSensitiveValue);
  return info;
})();

/**
 * redacts all sensitive values
 * @param key property key of the object
 * @param value value of the object's property
 */
function redactSensitiveValue(key: string, value: string): string {
  if (typeof value !== 'string') {
    return value;
  }
  const nricRegex = /[a-zA-Z]\d{7}[a-zA-Z]/i;
  // const emailRegex = /^[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
  if (typeof value === 'string' && nricRegex.test(value)) {
    return '*****' + value.substring(5);
  }
  if (isSecret.key(key) || isSecret.value(value)) {
    return '[REDACTED]';
  }
  return value;
}
