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
import { IExpressRequest, IReqRes } from './domainModels/request.interface';
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
   * For troubleshooting. This level will not be logged in production environment
   * @param message
   */
  debug(message: string): GLogger {
    this.logger.debug(message);
    return this;
  }

  /**
   * Normally you should use to method to log simple, informational messages.
   * If you need to troubleshoot objects, use debug method instead.
   *
   * @param message Message to log
   */
  info(message: string, metadata?: Record<string, any>): GLogger {
    this.logger.info(message, metadata);
    return this;
  }

  warn(message?: string, metadata?: Record<string, any>): GLogger {
    // const a = errorsFormat.transform(new Error('hi') as any);
    if (message) {
      this.logger.warn(message, metadata);
    } else {
      this.logger.warn(metadata);
    }
    return this;
  }

  error(message: string, err?: Error, metadata?: Record<string, any>): GLogger {
    this.logger.error(message, err, metadata);
    return this;
  }

  logHttpSuccess(message: string, { req, res }: IReqRes, { trxName, trxModule }: ITransactionMetadata): this {
    const logData: IHttpLog = {
      resStatusCode: res.statusCode,
      trxCategory: TransactionCategory.HTTP,
      trxId: req.uuid || 'missing trxId in req',
      trxName,
      trxModule,
      timeTakenInMillis: req.reqStartTimeInEpochMillis
        ? Duration.between(Instant.ofEpochMilli(req.reqStartTimeInEpochMillis), ZonedDateTime.now()).toMillis()
        : undefined,
      trxStatus: TransactionStatus.SUCCESS,
      metadata: { url: req.url, method: req.method, srcIp: getSourceIp(req) }
    };
    if (req.user) {
      logData.userToken = redactUserToken(req.user);
    }
    this.info(message, logData);
    return this;
  }

  logHttpFailure(error: Error | string, { req, res }: IReqRes, { trxName, trxModule }: ITransactionMetadata): this {
    const logData: IHttpLog = {
      resStatusCode: res.statusCode,
      trxCategory: TransactionCategory.HTTP,
      trxId: req.uuid || 'missing trxId in req',
      trxName,
      trxModule,
      timeTakenInMillis: req.reqStartTimeInEpochMillis
        ? Duration.between(Instant.ofEpochMilli(req.reqStartTimeInEpochMillis), ZonedDateTime.now()).toMillis()
        : undefined,
      trxStatus: TransactionStatus.FAILURE,
      metadata: {
        url: req.url,
        method: req.method,
        srcIp: getSourceIp(req)
      }
    };
    if (req.user) {
      logData.userToken = redactUserToken(req.user);
    }
    if (error instanceof Error) {
      logData.metadata.error = { stack: error.stack, name: error.name };
      this.warn(error.message, logData);
    } else {
      logData.metadata.error = error;
      this.warn(error, logData);
    }
    return this;
  }

  logTransactionSuccess(
    message: string,
    { req }: IReqRes,
    { trxName, trxModule }: ITransactionMetadata,
    trxStartTimeInEpochMillis: number
  ): this {
    const logData: ITransactionLog = {
      trxCategory: TransactionCategory.TRANS,
      trxId: req.uuid || 'missing trxId in req',
      trxName,
      trxModule,
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
    error: Error | string,
    { req }: IReqRes,
    { trxName, trxModule }: ITransactionMetadata,
    trxStartTimeInEpochMillis: number
  ): this {
    const logData: ITransactionLog = {
      trxCategory: TransactionCategory.TRANS,
      trxId: req.uuid || 'missing trxId in req',
      trxName,
      trxModule,
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
    if (error instanceof Error) {
      logData.metadata.error = { stack: error.stack, name: error.name };
      this.warn(error.message, logData);
    } else {
      logData.metadata.error = error;
      this.warn(error, logData);
    }
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

const consoleMessageFormatter = (info: winston.Logform.TransformableInfo): string => {
  const { level, message, timestamp, ...others } = info as ICombinedLog;
  const baseLog = `[${timestamp as string}][${level.toUpperCase()}]`;
  const { trxCategory, trxId, trxModule, trxName, trxStatus, timeTakenInMillis, userToken, metadata } = others;
  if (trxCategory) {
    return baseLog
      .concat(
        `[${trxCategory}][${trxModule}][${trxId}][${trxName}][${trxStatus}][${
          timeTakenInMillis?.toString() || 'timeTakenInMillis not tracked'
        }]`
      )
      .concat(`[${message}]`)
      .concat(`[${JSON.stringify(userToken)}][${JSON.stringify(metadata)}]`);
  }
  return baseLog.concat(`[${message}]`);
};

const timestamp = winston.format((info: ILogInfo) => {
  info.timestamp = ZonedDateTime.now().format(DateTimeFormatter.ISO_ZONED_DATE_TIME);
  return info;
});
