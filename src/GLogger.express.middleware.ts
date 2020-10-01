import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { IExpressRequest, IExpressResponse } from './domainModels';
import { GLogger } from './GLogger';

export function enhanceReqWithTransactionAndTime(
  req: IExpressRequest,
  res: IExpressResponse,
  next: express.NextFunction
): void {
  try {
    req.reqStartTimeInEpochMillis = new Date().getTime();
    req.uuid = uuidv4();
    next();
  } catch (e) {
    next(e);
  }
}

export function responseErrorLoggerFactory(logger: GLogger, filename: string, trxModule: string, trxName: string) {
  return (
    err: express.ErrorRequestHandler,
    req: IExpressRequest,
    res: IExpressResponse,
    next: express.NextFunction
  ): void => {
    try {
      logger.logHttpFailure(err, { req, res }, { filename, trxModule, trxName });
      next();
    } catch (e) {
      next(e);
    }
  };
}

export function responseSuccessLoggerFactory(logger: GLogger, filename: string, trxModule: string, trxName: string) {
  return (req: IExpressRequest, res: IExpressResponse, next: express.NextFunction): void => {
    try {
      res.on('finish', () => {
        if (res.statusCode < 400) {
          logger.logHttpSuccess('HTTP Call Success', { req, res }, { filename, trxModule, trxName });
        }
      });

      next();
    } catch (e) {
      next(e);
    }
  };
}
