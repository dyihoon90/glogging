export interface IJwtPayload {
  iss: string;
  sub: string;
  aud?: string;
  jti: string;
  exp: number;
  iat: number;
  [x: string]: unknown;
}
