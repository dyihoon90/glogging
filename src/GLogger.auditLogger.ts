import { Duration, Instant, ZonedDateTime } from '@js-joda/core';
import _ from 'lodash';
import {
  GLogger,
  IReqRes,
  ITransactionMetadata,
  IHttpLog,
  TransactionCategory,
  TransactionStatus,
  IReq,
  ITransactionLog,
  IExpressRequest,
  IJwtPayload
} from '.';

export class GLoggerAuditLogger {
  private glogger: GLogger;
  constructor(glogger: GLogger) {
    this.glogger = glogger;
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
      additionalInfo: { url: req.url, method: req.method, srcIp: getSourceIp(req), statusCode: res.statusCode }
    };
    if (req.user) {
      logData.userToken = redactUserToken(req.user);
    }
    this.glogger.info(message, { ...logData });
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
      additionalInfo: {
        url: req.url,
        method: req.method,
        srcIp: getSourceIp(req),
        statusCode: res.statusCode
      }
    };
    if (req.user) {
      logData.userToken = redactUserToken(req.user);
    }
    this.glogger.warn(error.name, error, { ...logData });
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
      additionalInfo: { url: req.url, method: req.method }
    };
    if (req.user) {
      logData.userToken = redactUserToken(req.user);
    }
    this.glogger.info(message, { ...logData });
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
      additionalInfo: { url: req.url, method: req.method }
    };
    if (req.user) {
      logData.userToken = redactUserToken(req.user);
    }
    this.glogger.warn(error.message, error, { ...logData });
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
