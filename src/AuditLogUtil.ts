import { Duration, Instant, ZonedDateTime } from '@js-joda/core';
import { IJwtPayload } from './domainModels/jwt.interface';
import { ITransactionLog } from './domainModels/logger.interface';
import { IExpressRequest } from './domainModels/request.interface';
import { TransactionCategory, TransactionStatus } from './domainModels/transaction.interface';
import LogUtil from './LogUtil';
import _ from 'lodash';

export function logHttpSuccess(message: string, req: IExpressRequest, trxName: string, userToken: IJwtPayload): void {
  const logData: ITransactionLog = {
    message,
    trxCategory: TransactionCategory.HTTP,
    userToken: redactUserToken(userToken),
    trxId: req.uuid,
    trxName: trxName,
    timeTakenInMillis: Duration.between(
      Instant.ofEpochMilli(req.reqStartTimeInEpochMillis),
      ZonedDateTime.now()
    ).toMillis(),
    trxStatus: TransactionStatus.SUCCESS,
    sourceIp: getSourceIp(req),
    metadata: { url: req.url }
  };
  LogUtil.getInstance().info(message, logData);
}
// function logHttpEnd(reqMetadata: IHttpRequestMetadata, trxType, userToken: IJwtPayload, metadataInput = {}) {}

// function logTransactionSuccess(trxContext, trxType, userToken: IJwtPayload, metadataInput = {}) {}
// function logTransactionFailure(trxContext, trxType, userToken: IJwtPayload, internalError, metadataInput = {}) {}

function redactUserToken(token: IJwtPayload): IJwtPayload {
  const nricRegex = /[a-zA-Z]\d{7}[a-zA-Z]/i;
  // const emailRegex = /^[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
  return (_.mapValues(token, (value) => {
    if (typeof value === 'string' && nricRegex.test(value)) {
      return '*****' + value.substring(5);
    }
    return value;
  }) as unknown) as IJwtPayload;
}

function getSourceIp(req: IExpressRequest): string {
  return (req.headers && req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'] : req.ip) as string;
}

// test
const meta = {
  reqStartTimeInEpochMillis: 1600939344000,
  ip: '123.111.222.333',
  headers: {
    'x-forwarded-for': '999.999.999.999'
  },
  url: 'test/test/aa',
  uuid: 'uuid-123'
};

const token = {
  sub: 'jocelyn_ng@tech.gov.sg',
  jti: '7e27866f-402c-4938-95c8-edf85e731b4a',
  iat: 1600665219,
  exp: 1608441219,
  iss: 'onemobileuserauthws.dwp.gov.sg',
  'appInstanceID.dwp.gov.sg': '1',
  'appID.dwp.gov.sg': 'oma-facade',
  'singpass_nric.dwp.gov.sg': 'S2805507B'
};

logHttpSuccess('test', meta, 'TrxName1', token);
