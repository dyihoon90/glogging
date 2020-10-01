import express from 'express';
import { IJwtPayload } from '.';
export interface IExpressRequest extends express.Request {
  reqStartTimeInEpochMillis?: number;
  uuid?: string;
  user?: IJwtPayload;
}

export type IExpressResponse = express.Response;

export interface IReqRes {
  req: IExpressRequest;
  res: IExpressResponse;
}

export interface IReq {
  req: IExpressRequest;
}
