import { Request, Response } from 'express';
import { IJwtPayload } from '.';
export interface IExpressRequest extends Partial<Request> {
  reqStartTimeInEpochMillis?: number;
  uuid?: string;
  user?: IJwtPayload;
}

export type IExpressResponse = Partial<Response>;

export interface IReqRes {
  req: IExpressRequest;
  res: IExpressResponse;
}
