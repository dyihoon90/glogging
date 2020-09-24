import { Request } from 'express';
export interface IExpressRequest extends Partial<Request> {
  reqStartTimeInEpochMillis: number;
  uuid: string;
}
