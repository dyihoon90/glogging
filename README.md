![Release pipeline](https://github.com/dyihoon90/glogging/workflows/Release%20Package%20to%20NPM/badge.svg)
![CI pipeline](https://github.com/dyihoon90/glogging/workflows/Run%20CI%20per%20push%20to%20Github%20repo/badge.svg)

# Opiniated audit logger for Express HTTP & Transactions

### Installation

`npm i @dyihoon90/glogging`

### Description

This library builds on winston to provide a GLogger class to do logging for:

1. requests in express
2. logging for transactions to external systems in express

There are 3 modes:

### LOCAL
- defaults to have transport for console.
- Log level up to debug
### DEV
- Defaults to have transport for console.
- Log level up to info
### PRODUCTION
- Defaults to have no transport at all. Use logger.addTransport to add a winston log transport
- Log level up to info

### EXAMPLES

For example usage of this library, clone this library, do `npm i`, then:

Run `npm run example` to see normal and transaction function decorator examples

Run `npm run example-server` to create an example express server and see middleware examples

---
This library includes the following:


## 1. Express middlewares

Express middleware will log all request and response with the following metadata:
| Metadata                  | Full Name                  | What is it?                                                                                                                                                                                                                    | Example                                |
| ------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| trxId                     | Transaction ID             | A randomly generated uuidv4 added to the request by the `enhanceReqWithTransactionAndTime` middleware. If using multiple microservices, can pass the ID on for tracking requests                                               | 'e6c0ea38-f459-4f84-a9b6-873255e95896' |
| trxModule                 | Transaction Module         | The transaction module                                                                                                                                                                                                         | 'DWP'                                  |
| trxName                   | Transaction Name           | The transaction name                                                                                                                                                                                                           | 'HRP'                                  |
| userToken                 | User Token                 | If request.user is filled, this will log out the field. The purpose is to be able to identify the user that made the call, for better ops support                                                                              |
| timeTakenInMillis         | Time Taken in Milliseconds | The time the request took from request received to response sent                                                                                                                                                               | 61877                                  |
| trxStatus                 | Transaction Status         | Transaction success is defined by a <400 status code. Transaction failure is defined by the error logger receiving an error object propagated down by previous middleware calling the express next() function with next(error) | 'SUCCESS' / 'FAILURE'                  |
| additionalInfo.url        | URL                        | The full URL path                                                                                                                                                                                                              | '/list?types[]=leave'                  |
| additionalInfo.method     | Method                     | The HTTP method                                                                                                                                                                                                                | 'GET'                                  |
| additionalInfo.srcIp      | Source IP                  | The source IP of the call. Uses express.request.ip. See [here](https://expressjs.com/en/api.html#trust.proxy.options.table) for more details of how the app setting `trust proxy` in express affects the source IP             | 127.0.0.1                              |
| additionalInfo.statusCode | Status Code                | The HTTP status code returned to the client                                                                                                                                                                                    | 200                                    |
| additionalInfo.error      | Error                      | The error passed to the error logger middleware, only when status is 'FAILURE'                                                                                                                                                 | 'new Error('error')'                   |



### Middlewares

This library has the following express middlewares

| Middleware                       | Purpose                                                                                            |     |     |     |
| -------------------------------- | -------------------------------------------------------------------------------------------------- | --- | --- | --- |
| enhanceReqWithTransactionAndTime | enhance request with req.reqStartTimeInEpochMillis & req.uuid (if req.uuid does not already exist) |     |     |     |
| responseErrorLoggerFactory       | factory to create an error logger middleware. See middleware.example.ts for how to use it          |     |     |     |
| responseSuccessLoggerFactory     | factory to create a successs logger middleware. See middleware.example.ts for how to use it        |     |     |     |

---

## 2. Class, Method & Function decorators

Class decorator for logging success/failure of transactions to external systems, such as other APIs or DB calls.

### Purpose
Using the decorators, we can log applications functions we deem to be transactions, such as those making calls to external systems or databases

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
| userToken             | User Token                 | If request.user is filled, this will log out the field. The purpose is to be able to identify the user that made the call, for better ops support                                        |
| timeTakenInMillis     | Time Taken in Milliseconds | The time the request took from request received to response sent                                                                                                                         | 61877                                                |
| trxStatus             | Transaction Status         | Transaction success is defined by function successful execution, or returning a resolved promise. Transaction failure is defined function throwing or returning a rejected promise.      | 'SUCCESS' / 'FAILURE'                                |
| additionalInfo.url    | URL                        | The full URL path                                                                                                                                                                        | '/list?types[]=leave'                                |
| additionalInfo.method | Method                     | The HTTP method                                                                                                                                                                          | 'GET'                                                |
| additionalInfo.result | Result                     | The result of the returned function. Only logged if options.toLogResult is set to `true`. Use options.redactedProperties to add object properties to redact from the logged result       | `{ aPublicValue: 'OK', 'aSecretValue': '[REDACTED]'` |
| additionalInfo.error  | Error                      | The error thrown by the function, only when status is 'FAILURE'                                                                                                                          | 'new Error('error')'                                 |

### Middlewares

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
