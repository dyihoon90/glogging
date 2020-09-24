import { DateTimeFormatter, ZonedDateTime } from '@js-joda/core';
import winston, { Logger, format, transports } from 'winston';
import { ILogInfo } from './domainModels/logger.interface';

interface ConfigOptions {
  logLabel?: string;
  productionMode?: boolean;
  enableFileLogs?: boolean;
  maxLogLevel?: string;
  errorLogFileName?: string;
  activityLogFileName?: string;
}

const DEFAULT_LOG_LABEL = 'log';

export const messageFormatter = (info: winston.Logform.TransformableInfo): string => {
  return JSON.stringify(info);
};

const timestamp = winston.format((info: ILogInfo) => {
  info.timestamp = ZonedDateTime.now().format(DateTimeFormatter.ISO_ZONED_DATE_TIME);
  return info;
});

class LogUtil {
  private static logLabel = DEFAULT_LOG_LABEL;

  private static productionMode = false;

  private static enableFileLogs = true;

  private static maxLogLevel = 'debug';

  private static errorLogFileName = 'logs/error.log';

  private static activityLogFileName = 'logs/activity.log';

  private static instance: LogUtil;

  private _logger: Logger;

  static setConfig({
    logLabel,
    productionMode,
    enableFileLogs,
    maxLogLevel,
    errorLogFileName,
    activityLogFileName
  }: ConfigOptions): void {
    LogUtil.logLabel = logLabel || LogUtil.logLabel;
    LogUtil.productionMode = productionMode || LogUtil.productionMode;

    // restrict logging level in production mode
    LogUtil.maxLogLevel = LogUtil.productionMode ? 'info' : maxLogLevel || LogUtil.maxLogLevel;

    LogUtil.enableFileLogs = enableFileLogs || LogUtil.enableFileLogs;
    LogUtil.errorLogFileName = errorLogFileName || LogUtil.errorLogFileName;
    LogUtil.activityLogFileName = activityLogFileName || LogUtil.activityLogFileName;
  }

  static getInstance(): LogUtil {
    if (!LogUtil.instance) {
      LogUtil.instance = new LogUtil();
    }
    return LogUtil.instance;
  }

  constructor() {
    this._logger = winston.createLogger({
      level: LogUtil.maxLogLevel,
      format: format.combine(
        format.errors({ stack: true }),
        format.label({ label: LogUtil.logLabel }),
        timestamp(),
        format.json()
      )
    });

    this._init();
  }

  /**
   * Remainder of this._logger preparation to be done here
   */
  private _init(): void {
    if (LogUtil.enableFileLogs) {
      this._logger
        .add(new transports.File({ filename: LogUtil.errorLogFileName, level: 'error' }))
        .add(new transports.File({ filename: LogUtil.activityLogFileName, level: 'info' }));
    }

    if (!LogUtil.productionMode) {
      this._logger.add(
        new transports.Console({
          format: format.combine(format.colorize(), format.printf(messageFormatter))
        })
      );
    }
  }

  /**
   * Normally you should use to method to log simple, informational messages.
   * If you need to troubleshoot objects, use debug method instead.
   *
   * @param message Message to log
   */
  info(message: string, metadata: Record<string, any>): LogUtil {
    this._logger.info(message, metadata);
    return this;
  }

  debug(message: string): LogUtil {
    this._logger.debug(message);
    return this;
  }

  error(err: Error): LogUtil {
    this._logger.error(err);
    return this;
  }
}

export default LogUtil;
