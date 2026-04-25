import JWT, { type JwtPayload } from "jsonwebtoken";
import { env } from "../../env";
import type {
  AuthData,
  AuthRequest,
  SellerServiceData,
  ServiceRequest,
  UserJwt,
} from "../../types/auth";
import { HTTPError, errors } from "../http/errors";
import logger from "../logger";

export function getUserOrThrow(req: AuthRequest): AuthData {
  const user = getUser(req);

  if (!user) {
    throw new HTTPError(errors.Unauthorized);
  }

  return user;
}

export function getStoreOrThrow(req: ServiceRequest): SellerServiceData {
  const user = req.user;

  if (!user) {
    throw new HTTPError(errors.Unauthorized);
  }

  return user;
}

export function getUser(req: AuthRequest): AuthData | null {
  const user = req?.user;

  // validate user
  if (!user || !user.id || typeof user.id !== "number") {
    return null;
  }

  if (!user.email || typeof user.email !== "string") {
    return null;
  }

  return user;
}

export function generateJwtToken(user: UserJwt, ttl?: string | number) {
  const options: JWT.SignOptions = {};

  if (ttl !== undefined) {
    options.expiresIn = ttl;
  }

  return JWT.sign(user, env.JWT_SECRET_KEY, options);
}

export function decodeJwtToken(token: string): JwtPayload | null {
  let payload = null;

  try {
    payload = JWT.verify(token, env.JWT_SECRET_KEY) as JwtPayload;
  } catch (e) {
    logger.error(e);
  }

  return payload;
}
