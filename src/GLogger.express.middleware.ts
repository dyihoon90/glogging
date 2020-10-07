import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { IExpressRequest, IExpressResponse } from './domainModels';
import { GLogger } from './GLogger';
import { GLoggerAuditLogger } from './GLogger.auditLogger';

/**
 * Middleware which enhances the request with two properties:
 * reqStartTimeInEpochMillis & uuid
 * These properties are consumed in logger later
 * @param req
 * @param res
 * @param next
 */
export function enhanceReqWithTransactionAndTime(
  req: IExpressRequest,
  _: IExpressResponse,
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

/**
 * Factory to create an error logger express middleware.
 * Assumes that req.user has been set to a JWT object. See IJwtPayload interface
 * @param logger A GLogger instance
 * @param trxModule the transaction module e.g. DWP
 * @param trxName the transaction name e.g. HRP
 * @param passErrorToNext whether to pass the error to the next middleware function. Defaults to false. If set to false, this should be the last middleware
 * @param filename the filename. In Node.js can use __filename (if not webpacked)
 */
export function responseErrorLoggerFactory(
  logger: GLogger,
  trxModule: string,
  trxName: string,
  filename?: string,
  passErrorToNext = false
) {
  return (err: Error, req: IExpressRequest, res: IExpressResponse, next: express.NextFunction): void => {
    try {
      const auditLoggerInstance = new GLoggerAuditLogger(logger);
      auditLoggerInstance.logHttpFailure(err, { req, res }, { filename, trxModule, trxName });
      if (passErrorToNext) {
        next(err);
      } else {
        next();
      }
    } catch (e) {
      next(e);
    }
  };
}

/**
 * Factory to create a success logger express middleware.
 * Assumes that req.user has been set to a JWT object. See IJwtPayload interface
 * @param logger A GLogger instance
 * @param trxModule the transaction module e.g. DWP
 * @param trxName the transaction name e.g. HRP
 * @param filename the filename. In Node.js can use __filename (if not webpacked)
 */
export function responseSuccessLoggerFactory(logger: GLogger, trxModule: string, trxName: string, filename?: string) {
  return (req: IExpressRequest, res: IExpressResponse, next: express.NextFunction): void => {
    try {
      res.on('finish', () => {
        if (res.statusCode < 400) {
          const auditLoggerInstance = new GLoggerAuditLogger(logger);
          auditLoggerInstance.logHttpSuccess('HTTP Call Success', { req, res }, { filename, trxModule, trxName });
        }
      });

      next();
    } catch (e) {
      next(e);
    }
  };
}
