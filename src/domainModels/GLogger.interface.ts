import { Logform } from 'winston';
import { IJwtPayload } from './jwt.interface';
import { TransactionCategory, TransactionStatus } from './transaction.interface';

export interface ILogInfo extends Logform.TransformableInfo {
  timestamp?: string;
}

export interface IBaseLog {
  trxCategory: TransactionCategory;
  userToken?: IJwtPayload;
  trxId: string;
  trxName: string;
  trxStatus: TransactionStatus;
  timeTakenInMillis?: number;
  additionalInfo: Record<string, any>;
  trxModule: string;
  filename?: string;
}

export type IHttpLog = IBaseLog;

export type ITransactionLog = IBaseLog;

export interface ICombinedLog extends ILogInfo, IHttpLog, ITransactionLog {}

export interface IConfigOptions {
  logLabel?: string;
  loggingMode?: LoggingMode;
}

/**
 * LOCAL - defaults to have transport for logging in console, default logs up to debug
 * DEV - defaults to have transport for logging in console, default logs up to info
 * PRODUCTION - defaults to have no transport, default logs up to info
 */
export enum LoggingMode {
  LOCAL = 'LOCAL',
  DEV = 'DEV',
  PRODUCTION = 'PRODUCTION'
}

export interface ITransactionMetadata {
  trxName: string;
  trxModule: string;
  filename?: string;
}
