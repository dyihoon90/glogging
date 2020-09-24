import { Logform } from 'winston';
import { IJwtPayload } from './jwt.interface';
import { TransactionCategory, TransactionStatus } from './transaction.interface';

export interface ILogInfo extends Logform.TransformableInfo {
  timestamp?: string;
}

export interface ITransactionLog {
  message: string;
  sourceIp: string;
  trxCategory: TransactionCategory;
  userToken: IJwtPayload;
  trxId: string;
  trxName: string;
  trxStatus: TransactionStatus;
  timeTakenInMillis: number;
  metadata: Record<string, any>;
}
