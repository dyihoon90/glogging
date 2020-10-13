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
