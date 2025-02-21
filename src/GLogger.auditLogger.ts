import { Duration, Instant, ZonedDateTime } from '@js-joda/core';
import {
  GLogger,
  IReqRes,
  ITransactionMetadata,
  IHttpLog,
  TransactionCategory,
  TransactionStatus,
  IReq,
  ITransactionLog,
  IHTTPTransactionMetadata
} from '.';

export class GLoggerAuditLogger {
  private glogger: GLogger;
  constructor(glogger: GLogger) {
    this.glogger = glogger;
  }
  logHttpSuccess(
    message: string,
    { req, res }: IReqRes,
    { trxName, trxModule, filename }: IHTTPTransactionMetadata
  ): this {
    const logData: IHttpLog = {
      trxCategory: TransactionCategory.HTTP,
      trxId: req.uuid || '',
      trxName,
      trxModule,
      filename,
      userToken: req.user,
      timeTakenInMillis: req.reqStartTimeInEpochMillis
        ? Duration.between(Instant.ofEpochMilli(req.reqStartTimeInEpochMillis), ZonedDateTime.now()).toMillis()
        : undefined,
      trxStatus: TransactionStatus.SUCCESS,
      additionalInfo: { url: req.url, method: req.method, srcIp: req.ip, statusCode: res.statusCode }
    };
    this.glogger.info(message, { ...logData });
    return this;
  }

  logHttpFailure(
    error: Error,
    { req, res }: IReqRes,
    { trxName, trxModule, filename }: IHTTPTransactionMetadata
  ): this {
    const logData: IHttpLog = {
      trxCategory: TransactionCategory.HTTP,
      trxId: req.uuid || '',
      trxName,
      trxModule,
      filename,
      userToken: req.user,
      timeTakenInMillis: req.reqStartTimeInEpochMillis
        ? Duration.between(Instant.ofEpochMilli(req.reqStartTimeInEpochMillis), ZonedDateTime.now()).toMillis()
        : undefined,
      trxStatus: TransactionStatus.FAILURE,
      additionalInfo: {
        url: req.url,
        method: req.method,
        srcIp: req.ip,
        statusCode: res.statusCode
      }
    };
    this.glogger.warn(error.name, error, { ...logData });
    return this;
  }

  logTransactionSuccess(
    message: string,
    { req }: IReq,
    { trxCategory, trxName, trxModule, filename }: ITransactionMetadata,
    trxStartTimeInEpochMillis: number,
    result?: Record<string, any>
  ): this {
    const logData: ITransactionLog = {
      trxCategory,
      trxId: req?.uuid || '',
      trxModule,
      trxName,
      filename,
      userToken: req?.user,
      timeTakenInMillis: Duration.between(
        Instant.ofEpochMilli(trxStartTimeInEpochMillis),
        ZonedDateTime.now()
      ).toMillis(),
      trxStatus: TransactionStatus.SUCCESS,
      additionalInfo: { url: req?.url, method: req?.method }
    };
    if (logData.additionalInfo && result) {
      logData.additionalInfo.result = result;
    }
    this.glogger.info(message, { ...logData });
    return this;
  }

  logTransactionFailure(
    { req }: IReq,
    { trxCategory, trxName, trxModule, filename }: ITransactionMetadata,
    trxStartTimeInEpochMillis: number,
    error: Error | string | unknown
  ): this {
    const logData: ITransactionLog = {
      trxCategory,
      trxId: req?.uuid || '',
      trxName,
      trxModule,
      filename,
      userToken: req?.user,
      timeTakenInMillis: Duration.between(
        Instant.ofEpochMilli(trxStartTimeInEpochMillis),
        ZonedDateTime.now()
      ).toMillis(),
      trxStatus: TransactionStatus.FAILURE,
      additionalInfo: { url: req?.url, method: req?.method }
    };
    // Promise.reject() by convention should reject with Error.
    // but in scenarios where it rejects with other things, we still try our best to log the object
    if (error instanceof Error) {
      this.glogger.warn(error.message, error, { ...logData });
    } else if (typeof error === 'string') {
      this.glogger.warn(error, undefined, { ...logData });
    } else {
      this.glogger.warn('error', undefined, { ...logData, additionalInfo: { ...logData.additionalInfo, error } });
    }
    return this;
  }
}
