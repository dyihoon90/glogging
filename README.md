![Release pipeline](https://github.com/dyihoon90/glogging/workflows/Release%20Package%20to%20NPM/badge.svg)
![CI pipeline](https://github.com/dyihoon90/glogging/workflows/Run%20CI%20per%20push%20to%20Github%20repo/badge.svg)

# Audit logger for Express requests and Transactions

## Table of Content
- [Audit logger for Express requests and Transactions](#audit-logger-for-express-requests-and-transactions)
  - [Table of Content](#table-of-content)
    - [Installation](#installation)
    - [Description](#description)
  - [GLogger](#glogger)
    - [Constructor](#constructor)
    - [Override default configs](#override-default-configs)
    - [Instance methods](#instance-methods)
    - [Instance properties](#instance-properties)
  - [Express middlewares](#express-middlewares)
    - [Middlewares](#middlewares)
  - [Class, Method & Function decorators for Express services (Works out of the box for Express/Koa servers)](#class-method--function-decorators-for-express-services-works-out-of-the-box-for-expresskoa-servers)
    - [Purpose](#purpose)
    - [Metadata](#metadata)
    - [Decorators (Works out of the box for Express/Koa servers)](#decorators-works-out-of-the-box-for-expresskoa-servers)
  - [Examples](#examples)

### Installation

`npm i @dyihoon90/glogging`

### Description

This library builds on winston to provide a GLogger class to do logging for:

1. Normal logging
2. HTTP requests in express
3. Logging for transactions to external systems



---
This library includes the following:

## GLogger

A glogger instance uses the `winston` logger library under the hood.

### Constructor

```typescript
const logger = new GLogger({ loggingMode: LoggingMode.LOCAL });
```

When constructing an instance, there are 3 modes:

| Mode       | Description                                                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| LOCAL      | <ul><li>defaults to have transport for console.</li><li>Log level up to debug</li></ul>                                                |
| DEV        | <ul><li>defaults to have transport for console.</li><li>Log level up to info</li></ul>                                                 |
| PRODUCTION | <ul><li>defaults to have no transport. Use glogger.addTransport to add a winston log transport.</li><li>Log level up to info</li></ul> |


To override the default behaviors for each Mode above, you can use `overrideDefault`

```typescript
const logger = new GLogger({ loggingMode: LoggingMode.LOCAL, overrideDefault: { alwaysWriteToConsole: true, consoleLogSectionSeparator: '' }});
```

### Override default configs
| Config                     | Purpose                                                                                                               |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| alwaysWriteToConsole       | always write to console, regardless of environment. useful for AWS Lambda                                             |
| consoleLogSectionSeparator | override the default section separator character for console logs. the default is newline '\n'. useful for AWS Lambda |



---

### Instance methods
| Method              | Purpose                                                              |
| ------------------- | -------------------------------------------------------------------- |
| debug               | create log object of level debug                                     |
| info                | create log object of level info                                      |
| warn                | create log object of level warn                                      |
| error               | create log object of level error                                     |
| toggleVerboseModeOn | toggle debug mode to see what is being sent to the above log methods |
| addLogTransport     | add a winston log transport to transport the log object              |

### Instance properties
| Property      | Purpose                                     |
| ------------- | ------------------------------------------- |
| winstonLogger | Expose the underlying winston logger object |

---

## Express middlewares

Express middleware will log all request and response with the following metadata:
| Metadata                  | Full Name                  | What is it?                                                                                                                                                                                                                    | Example                                |
| ------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| trxId                     | Transaction ID             | A randomly generated uuidv4 added to the request by the `enhanceReqWithTransactionAndTime` middleware. If using multiple microservices, can pass the ID on for tracking requests                                               | 'e6c0ea38-f459-4f84-a9b6-873255e95896' |
| trxModule                 | Transaction Module         | The transaction module                                                                                                                                                                                                         | 'DWP'                                  |
| trxName                   | Transaction Name           | The transaction name                                                                                                                                                                                                           | 'HRP'                                  |
| userToken                 | User Token                 | If request.user is filled, this will log out the field. The purpose is to be able to identify the user that made the call, for better ops support                                                                              |                                        |
| timeTakenInMillis         | Time Taken in Milliseconds | The time the request took from request received to response sent                                                                                                                                                               | 61877                                  |
| trxStatus                 | Transaction Status         | Transaction success is defined by a <400 status code. Transaction failure is defined by the error logger receiving an error object propagated down by previous middleware calling the express next() function with next(error) | 'SUCCESS' / 'FAILURE'                  |
| additionalInfo.url        | URL                        | The full URL path                                                                                                                                                                                                              | '/list?types[]=leave'                  |
| additionalInfo.method     | Method                     | The HTTP method                                                                                                                                                                                                                | 'GET'                                  |
| additionalInfo.srcIp      | Source IP                  | The source IP of the call. Uses express.request.ip. See [here](https://expressjs.com/en/api.html#trust.proxy.options.table) for more details of how the app setting `trust proxy` in express affects the source IP             | 127.0.0.1                              |
| additionalInfo.statusCode | Status Code                | The HTTP status code returned to the client                                                                                                                                                                                    | 200                                    |
| additionalInfo.error      | Error                      | The error passed to the error logger middleware, only when status is 'FAILURE'                                                                                                                                                 | 'new Error('error')'                   |

---

### Middlewares

This library has the following express middlewares

| Middleware                       | Purpose                                                                                            |
| -------------------------------- | -------------------------------------------------------------------------------------------------- |
| enhanceReqWithTransactionAndTime | enhance request with req.reqStartTimeInEpochMillis & req.uuid (if req.uuid does not already exist) |
| responseErrorLoggerFactory       | factory to create an error logger middleware. See middleware.example.ts for how to use it          |
| responseSuccessLoggerFactory     | factory to create a successs logger middleware. See middleware.example.ts for how to use it        |

---

## Class, Method & Function decorators for Express services (Works out of the box for Express/Koa servers)

### Purpose

With these decorators, you have standardized logging for certain transactional functions in your application. 

For example, one of your routes invokes a function that makes a call to persist an item in your a DB, then returns results from those systems. 

You can decorate the function that makes that DB call to get a rich view of that function invocation, including which Express route your user called that invoked this function, the transaction ID, some details of the user that made the request (if available in the request), and results/errors

 Works out of the box for decorating functions in an Express / Koa server.

---
### Metadata

All functions being logged must take in an `IExpressRequest` object as its first parameter, even if the function itself doesn't require it.


You need to use the `enhanceReqWithTransactionAndTime` above for `trxId` & `timeTakenInMillis` to work.


Decorator will log functions with the following metadata:

| Metadata              | Full Name                  | What is it?                                                                                                                                                                              | Example                                              |
| --------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| trxId                 | Transaction ID             | A randomly generated uuidv4 added to the express request by the `enhanceReqWithTransactionAndTime` middleware. If using multiple microservices, can pass the ID on for tracking requests | 'e6c0ea38-f459-4f84-a9b6-873255e95896'               |
| trxModule             | Transaction Module         | The transaction module                                                                                                                                                                   | 'User'                                               |
| trxName               | Transaction Name           | This will be the name of the decorated function                                                                                                                                          | 'getUserList'                                        |
| fileName              | File Name                  | The name of the file                                                                                                                                                                     | 'services/user.service.ts'                           |
| userToken             | User Token                 | If request.user is filled, this will log out the field. The purpose is to be able to identify the user that made the call, for better ops support                                        |                                                      |
| timeTakenInMillis     | Time Taken in Milliseconds | The time the request took from request received to response sent                                                                                                                         | 61877                                                |
| trxStatus             | Transaction Status         | Transaction success is defined by function successful execution, or returning a resolved promise. Transaction failure is defined function throwing or returning a rejected promise.      | 'SUCCESS' / 'FAILURE'                                |
| additionalInfo.url    | URL                        | The full URL path                                                                                                                                                                        | '/list?types[]=leave'                                |
| additionalInfo.method | Method                     | The HTTP method                                                                                                                                                                          | 'GET'                                                |
| additionalInfo.result | Result                     | The result of the returned function. Only logged if options.toLogResult is set to `true`. Use options.redactedProperties to add object properties to redact from the logged result       | `{ aPublicValue: 'OK', 'aSecretValue': '[REDACTED]'` |
| additionalInfo.error  | Error                      | The error thrown by the function, only when status is 'FAILURE'                                                                                                                          | 'new Error('error')'                                 |

---

### Decorators (Works out of the box for Express/Koa servers)

This library has the following class, class method, & function decorators

| Decorator Factory | Purpose                                         |
| ----------------- | ----------------------------------------------- |
| LoggedClass       | Decorate all class methods except `constructor` |
| LoggedMethod      | Decorate a class method                         |
| LoggedFunction    | Decorate a raw function                         |

All the above are decorator factories. In order to create the decorator, they take in the following parameters:

| Parameter                  | Explanation                                                                                                                                                                                                                                                                   | Required?                  | Example                     |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | --------------------------- |
| logger                     | a GLogger instance                                                                                                                                                                                                                                                            | required                   | new GLogger()               |
| metadata                   | metadata including transaction category, transaction module, & optional filename                                                                                                                                                                                              | required                   |                             |
| metadata.trxCategory       | Transaction category                                                                                                                                                                                                                                                          | required                   | `TransactionCategory.TRANS` |
| metadata.trxModule         | Transaction module                                                                                                                                                                                                                                                            | required                   | 'User'                      |
| options                    | Optional option parameter                                                                                                                                                                                                                                                     | optional                   |                             |
| options.toLogResult        | whether to log the return value of the decorated function. Defaults to false.                                                                                                                                                                                                 | required if options is set | `true`/`false`              |
| options.redactedProperties | if `options.toLogResult` set to true, use this array for properties from the function return value you don't want logged. works for both objects with nested properties and objects inside of arrays. you can also pass in an integer to redact a particular item in an array | optional                   | ['mySecretProperty', 0]     |

---

## Examples

See examples folder for usage.

Or you can clone this repo and run:
- `npm i` then,
- `npm run example` for base logger and decorator demo
- `npm run example-server` for middleware demo
