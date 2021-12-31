import express from 'express';
import {
  enhanceReqWithTransactionAndTime,
  GLogger,
  LoggingMode,
  responseErrorLoggerFactory,
  responseSuccessLoggerFactory
} from '../src';

// EXAMPLE: INTIALIZING
const logger = new GLogger({ loggingMode: LoggingMode.LOCAL });

////#region HTTP logger express middleware
const successLogger = responseSuccessLoggerFactory(logger, 'MODULE', 'SUBMODULE', __filename);
const errorLogger = responseErrorLoggerFactory(logger, 'MODULE', 'SUBMODULE', __filename, false);

const server = express();

server.use(enhanceReqWithTransactionAndTime);
server.use(successLogger);
server.get('/success', (req, res, next) => {
  res.send('success. see terminal for failure log examples');
  next();
});
server.get('/fail', (req, res, next) => {
  res.send('fail. see terminal for failure log examples');
  res.status(400);
  next(new Error('failure error'));
});
server.use(errorLogger);
const RANDOM_PORT = 57192;
server.listen(RANDOM_PORT, () => {
  logger.info(`Server started on port ${RANDOM_PORT}`);
  logger.info(`run npm example-server and make get calls to /success and /fail`);
});
//#endregion
