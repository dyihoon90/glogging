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
  toLogResults: boolean;
}
