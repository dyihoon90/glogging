import express from 'express';
import { IJwtPayload } from '.';

/**
 * express requests can be enhanced with reqStartTimeInEpochMillis & uuid using the enhanceReqWithTransactionAndTime middleware
 * If library users want to use this library to log the JWT reprsenting the user, they have to enhance the express request with user
 * See examples/JWTValidator for example middleware
 */
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
