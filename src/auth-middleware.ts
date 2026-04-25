import type { Request, Response } from "express";
import { verifyIdToken } from "./lib/firebase";
import { HTTPError, errors } from "./lib/http/errors";
import logger from "./lib/logger";
import type { AuthData, SellerServiceData } from "./types/auth";

export enum SecurityName {
  JWT = "jwt",
  JWTWithoutThrow = "jwtWithoutThrow",
  NoAuth = "noAuth",
}

export async function expressAuthentication(
  req: Request,
  securityName: string,
  scopes?: string[],
  res?: Response,
): Promise<AuthData | null | SellerServiceData> {
  switch (securityName) {
    case SecurityName.JWT:
      return await verifyUser(req, scopes);
    case SecurityName.JWTWithoutThrow:
      return await verifyUser(req, scopes).catch(() => null);
    case SecurityName.NoAuth:
      return null;
    default:
      break;
  }

  throw new HTTPError(errors.Unauthorized);
}

async function verifyUser(
  request: Request,
  scopes?: string[],
): Promise<AuthData> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new HTTPError(
      errors.Unauthorized,
      "Invalid authorization header format",
    );
  }

  const tokens = authHeader.split(" ");

  try {
    const jwtData = await verifyIdToken(tokens[1]);
    if (!jwtData?.uid) {
      throw new HTTPError(errors.Unauthorized, "Invalid or malformed token");
    }

    return {
      id: jwtData.id,
      uid: jwtData.uid,
      role: jwtData.role,
      email: jwtData.email,
    };
  } catch (err) {
    logger.error(err);
    if (err instanceof HTTPError) {
      throw err;
    }
    throw new HTTPError(
      errors.Unauthorized,
      (err as Error)?.message || "Invalid or malformed token",
    );
  }
}
