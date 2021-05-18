import { Logform } from 'winston';
import { IJwtPayload } from './jwt.interface';
import { TransactionCategory, TransactionStatus } from './transaction.interface';

/**
 * IBasicLog is the shape of log data for simple logging, when glogger.info & glogger.warn are used
 */
export interface IBasicLogData {
  timestamp?: string;
  additionalInfo?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * IAuditLogData is the shape of logs for audit logging, such as for logging HTTP requests & transactions
 * It is used in auditLogger
 */
export interface IAuditLogData {
  timestamp?: string;
  trxCategory: TransactionCategory;
  userToken?: IJwtPayload;
  trxId: string;
  trxName: string;
  trxStatus: TransactionStatus;
  timeTakenInMillis?: number;
  trxModule: string;
  filename?: string;
  additionalInfo?: Record<string, unknown>;
}

export type IHttpLog = IAuditLogData;

export type ITransactionLog = IAuditLogData;

export interface ICombinedLog extends Logform.TransformableInfo, IBasicLogData, IHttpLog, ITransactionLog {}

export interface IConfigs {
  loggingMode: LoggingMode;
  overrideDefault?: {
    alwaysWriteToConsole?: boolean;
    // default section separator is '\n'
    consoleLogSectionSeparator?: string;
  };
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

export enum LoggingLevel {
  SILLY,
  DEBUG,
  INFO,
  WARN,
  ERROR
}
