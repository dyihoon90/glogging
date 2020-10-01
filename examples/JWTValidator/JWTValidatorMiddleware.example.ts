import express from "express"
import TokenValidator from "./TokenValidator";

export async function JWTValidator(req: express.Request, res: express.Response, next: express.NextFunction) {
  const jwt = req.headers.dwp_auth_token as string;
  try {
      const user = await TokenValidator.getInstance().validate(jwt);
      req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}
