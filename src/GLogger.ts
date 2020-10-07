import winston, { Logger, format, transports } from 'winston';
import * as Transport from 'winston-transport';
import {
  ICombinedLog,
  IConfigOptions,
  ILogInfo,
  ITransactionMetadata,
  LoggingMode
} from './domainModels/GLogger.interface';
import { DateTimeFormatter, Duration, Instant, ZonedDateTime } from '@js-joda/core';
import { IJwtPayload } from './domainModels/jwt.interface';
import { IHttpLog, ITransactionLog } from './domainModels/GLogger.interface';
import { IExpressRequest, IReq, IReqRes } from './domainModels/request.interface';
import { TransactionCategory, TransactionStatus } from './domainModels/transaction.interface';
import _ from 'lodash';

const DEFAULT_LOG_LABEL = 'log';

/**
 * How to use this class:
 * Initialize a new instance in your codebase. Use this instance as a singleton through the codebase.
 * if loggingMode is not provided, defaults to LoggingMode.PRODUCTION
 */
export class GLogger {
  private logger: Logger;

  constructor({ logLabel, loggingMode }: IConfigOptions) {
    switch (loggingMode) {
      case LoggingMode.LOCAL:
        this.logger = winston.createLogger({
          level: 'debug',
          format: format.combine(format.label({ label: logLabel || DEFAULT_LOG_LABEL }), timestamp())
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
          format: format.combine(format.label({ label: logLabel || DEFAULT_LOG_LABEL }), timestamp())
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
          format: format.combine(
            format.label({ label: logLabel || DEFAULT_LOG_LABEL }),
            timestamp(),
            format.prettyPrint()
          )
        });
    }
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
  info(message: string, data?: Record<string, any>): GLogger {
    this.logger.info(message, data);
    return this;
  }

  /**
   * Creates a log object of level warn
   * @example
   * warn('msg', new Error('error msg'), {mydata: "data"})
   * // creates the following log object
   * {message: 'msg', level: 'warn', mydata: 'data', metadata: {error: {stack: 'errorstack!',message:'error msg',name:'Error'}}}
   * @param data any additional relevant data, as a javascript object.
   * If it contains a `message` property, the string is appended
   * If it contains a `level` property, that is ignored
   */
  warn(message: string, error?: Error, data?: Record<string, any>): GLogger {
    const dataToLog = data ? { ...data } : {};
    if (error) {
      dataToLog.additionalInfo = {
        ...dataToLog.additionalInfo,
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
   * {message: 'msg', level: 'error', mydata: 'data', metadata: {error: {stack: 'errorstack!',message:'error msg',name:'Error'}}}
   * @param data any additional relevant data, as a javascript object.
   * If it contains a `message` property, the string is appended
   * If it contains a `level` property, that is ignored
   */
  error(message: string, error?: Error, data?: Record<string, any>): GLogger {
    const dataToLog = data ? { ...data } : {};
    if (error) {
      dataToLog.additionalInfo = {
        ...dataToLog.additionalInfo,
        error: { stack: error.stack, message: error.message, name: error.name }
      };
    }
    this.logger.error(message, dataToLog);
    return this;
  }
}

/**
 * Formatter for console logging in GLogging
 * @param info
 */
const consoleMessageFormatter = (info: winston.Logform.TransformableInfo): string => {
  const { level, message, timestamp, ...others } = info as ICombinedLog;
  const logString = `[${timestamp as string}][${level.toUpperCase()}]`;
  const {
    trxCategory,
    trxId,
    trxModule,
    trxName,
    trxStatus,
    filename,
    timeTakenInMillis,
    userToken,
    additionalInfo
  } = others;
  if (!trxCategory) {
    const basicLog = logString
      .concat(`[${message}]`)
      .concat(`[${additionalInfo ? formatWithLinebreakAndIndent(additionalInfo) : 'no additionalInfo'}]\n`);

    return filename ? basicLog.concat(`[${filename}]`) : basicLog;
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
};

const timestamp = winston.format((info: ILogInfo) => {
  info.timestamp = ZonedDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
  return info;
});

function formatWithLinebreakAndIndent(obj: Record<string, unknown>): string {
  return JSON.stringify(obj, null, 4)?.replace(/\\n/g, '\n');
}
