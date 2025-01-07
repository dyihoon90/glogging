/* eslint-disable no-shadow */
export enum TransactionCategory {
  AUTH = 'AUTH',
  TRANS = 'TRANS',
  HTTP = 'HTTP'
}

export enum TransactionStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE'
}

export interface ITransactionLoggingOptions {
  /**
   * If true, the transaction results will be logged
   * If false, the transaction results will not be logged
   * @default false
   */
  toLogResults?: boolean;
  /**
   * If true, the transaction success will be logged
   * If false, only transacion failure will be logged
   * @default true
   */
  toLogSuccessTxn?: boolean;
  /**
   * Properties to be redacted from the transaction log
   */
  redactedProperties?: Array<string | number | symbol>;
}

export interface ITransactionMetadata {
  trxCategory: TransactionCategory;
  trxModule: string;
  trxName: string;
  filename?: string;
}

export interface IHTTPTransactionMetadata {
  trxModule: string;
  trxName: string;
  filename?: string;
}

export interface IDecoratorMetadata {
  trxCategory: TransactionCategory;
  trxModule: string;
  filename?: string;
}
