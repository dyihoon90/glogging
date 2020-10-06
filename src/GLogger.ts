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
   * Creates a log object of level warn
   * @example
   * info('msg', {mydata: "data"})
   * // creates the following log object
   * {message: 'msg', level: 'debug', mydata: 'data'}
   * @param metadata any additional relevant data, as a javascript object.
   * If it contains a `message` property, the string is appended
   * If it contains a `level` property, that is ignored
   */
  debug(message: string, metadata?: Record<string, any>): GLogger {
    this.logger.debug(message, metadata);
    return this;
  }

  /**
   * Creates a log object of level warn
   * @example
   * info('msg', {mydata: "data"})
   * // creates the following log object
   * {message: 'msg', level: 'info', mydata: 'data'}
   * @param metadata any additional relevant data, as a javascript object.
   * If it contains a `message` property, the string is appended
   * If it contains a `level` property, that is ignored
   */
  info(message: string, metadata?: Record<string, any>): GLogger {
    this.logger.info(message, metadata);
    return this;
  }

  /**
   * Creates a log object of level warn
   * @example
   * warn('msg', new Error('error msg'), {mydata: "data"})
   * // creates the following log object
   * {message: 'msg', level: 'warn', mydata: 'data', metadata: {error: {stack: 'errorstack!',message:'error msg',name:'Error'}}}
   * @param metadata any additional relevant data, as a javascript object.
   * If it contains a `message` property, the string is appended
   * If it contains a `level` property, that is ignored
   */
  warn(message: string, error?: Error, metadata?: Record<string, any>): GLogger {
    const metadataToLog = metadata ? { ...metadata } : {};
    if (error) {
      metadataToLog.metadata = { error: { stack: error.stack, message: error.message, name: error.name } };
    }
    this.logger.warn(message, metadataToLog);
    return this;
  }

  /**
   * Creates a log object of level error
   * @example
   * error('msg', new Error('error msg'), {mydata: "data"})
   * // creates the following log object
   * {message: 'msg', level: 'error', mydata: 'data', metadata: {error: {stack: 'errorstack!',message:'error msg',name:'Error'}}}
   * @param metadata any additional relevant data, as a javascript object.
   * If it contains a `message` property, the string is appended
   * If it contains a `level` property, that is ignored
   */
  error(message: string, error?: Error, metadata?: Record<string, any>): GLogger {
    const metadataToLog = metadata ? { ...metadata } : {};
    if (error) {
      metadataToLog.metadata = { error: { stack: error.stack, message: error.message, name: error.name } };
    }
    this.logger.error(message, metadataToLog);
    return this;
  }

  logHttpSuccess(message: string, { req, res }: IReqRes, { trxName, trxModule, filename }: ITransactionMetadata): this {
    const logData: IHttpLog = {
      trxCategory: TransactionCategory.HTTP,
      trxId: req.uuid || 'missing trxId in req',
      trxName,
      trxModule,
      filename,
      timeTakenInMillis: req.reqStartTimeInEpochMillis
        ? Duration.between(Instant.ofEpochMilli(req.reqStartTimeInEpochMillis), ZonedDateTime.now()).toMillis()
        : undefined,
      trxStatus: TransactionStatus.SUCCESS,
      metadata: { url: req.url, method: req.method, srcIp: getSourceIp(req), statusCode: res.statusCode }
    };
    if (req.user) {
      logData.userToken = redactUserToken(req.user);
    }
    this.info(message, logData);
    return this;
  }

  logHttpFailure(error: Error, { req, res }: IReqRes, { trxName, trxModule, filename }: ITransactionMetadata): this {
    const logData: IHttpLog = {
      trxCategory: TransactionCategory.HTTP,
      trxId: req.uuid || 'missing trxId in req',
      trxName,
      trxModule,
      filename,
      timeTakenInMillis: req.reqStartTimeInEpochMillis
        ? Duration.between(Instant.ofEpochMilli(req.reqStartTimeInEpochMillis), ZonedDateTime.now()).toMillis()
        : undefined,
      trxStatus: TransactionStatus.FAILURE,
      metadata: {
        url: req.url,
        method: req.method,
        srcIp: getSourceIp(req),
        statusCode: res.statusCode
      }
    };
    if (req.user) {
      logData.userToken = redactUserToken(req.user);
    }
    this.warn(error.name, error, logData);
    return this;
  }

  logTransactionSuccess(
    message: string,
    { req }: IReq,
    { trxName, trxModule, filename }: ITransactionMetadata,
    trxStartTimeInEpochMillis: number
  ): this {
    const logData: ITransactionLog = {
      trxCategory: TransactionCategory.TRANS,
      trxId: req.uuid || 'missing trxId in req',
      trxName,
      trxModule,
      filename,
      timeTakenInMillis: Duration.between(
        Instant.ofEpochMilli(trxStartTimeInEpochMillis),
        ZonedDateTime.now()
      ).toMillis(),
      trxStatus: TransactionStatus.SUCCESS,
      metadata: { url: req.url, method: req.method }
    };
    if (req.user) {
      logData.userToken = redactUserToken(req.user);
    }
    this.info(message, logData);
    return this;
  }

  logTransactionFailure(
    error: Error,
    { req }: IReq,
    { trxName, trxModule, filename }: ITransactionMetadata,
    trxStartTimeInEpochMillis: number
  ): this {
    const logData: ITransactionLog = {
      trxCategory: TransactionCategory.TRANS,
      trxId: req.uuid || 'missing trxId in req',
      trxName,
      trxModule,
      filename,
      timeTakenInMillis: Duration.between(
        Instant.ofEpochMilli(trxStartTimeInEpochMillis),
        ZonedDateTime.now()
      ).toMillis(),
      trxStatus: TransactionStatus.FAILURE,
      metadata: { url: req.url, method: req.method }
    };
    if (req.user) {
      logData.userToken = redactUserToken(req.user);
    }
    this.warn(error.message, error, logData);
    return this;
  }
}

function redactUserToken(token: IJwtPayload): IJwtPayload {
  const nricRegex = /[a-zA-Z]\d{7}[a-zA-Z]/i;
  // const emailRegex = /^[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
  return (_.mapValues(token, (value) => {
    if (typeof value === 'string' && nricRegex.test(value)) {
      return '*****' + value.substring(5);
    }
    return value;
  }) as unknown) as IJwtPayload;
}

function getSourceIp(req: IExpressRequest): string {
  return (req.headers && req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'] : req.ip) as string;
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
    metadata
  } = others;
  if (!trxCategory) {
    const basicLog = logString.concat(`[${message}]`);
    return filename ? basicLog.concat(`[${filename}]`) : basicLog;
  }
  const enrichedLog = logString
    .concat(
      `[${trxCategory}][${trxModule}][${trxId}][${trxName}][${trxStatus}][${
        timeTakenInMillis?.toString() || 'time taken is not tracked'
      }ms]`
    )
    .concat(`[${message}]\n`)
    .concat(`[${userToken ? JSON.stringify(userToken, null, 4)?.replace(/\\n/g, '\n') : 'no user token'}]\n`)
    .concat(`[${JSON.stringify(metadata, null, 4)?.replace(/\\n/g, '\n')}]\n`);
  return filename ? enrichedLog.concat(`[${filename}]`) : enrichedLog;
};

const timestamp = winston.format((info: ILogInfo) => {
  info.timestamp = ZonedDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
  return info;
});
