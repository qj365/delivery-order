import { Prisma, type UserPermissionType } from "@prisma/client";
import type { AuthRequest } from "@src/types/auth";
import type { NextFunction, Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import { type FieldErrors, ValidateError } from "tsoa";
import type { z } from "zod";
import errors from "../../../static/errors.json";
import logger from "../logger";
import { HTTPError } from "./errors";

export function errorHandler(
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  e: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent) {
    return next(e);
  }
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  let err: any = e;
  logger.error(err);

  if (err instanceof ValidateError) {
    console.log("middleware =>", err.fields);
    const details: string[] = [];
    for (const key of Object.keys(err.fields)) {
      details.push(`${key}: ${err.fields[key].message}`);
    }

    err = {
      ...errors.ValidationError,
      details: details.join(", "),
    };
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025" || err.code === "P2022") {
      err = errors.NotFound;
    }

    if (err.code === "P2002") {
      err = { ...errors.ValidationError, details: err.message };
    }
  }

  if (err.statusCode) {
    res.status(err.statusCode).json({
      ...err,
      message: err.message,
    });
    return;
  }
  // Unknown error
  return res.status(500).json(errors.InternalServerError);
}

export const rateLimitMiddleware = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

export function notFoundRouteHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  next(errors.NotFoundEndpoint);
}

export interface RawBodyRequest extends Request {
  rawBody: Buffer;
}
export const rawBodySaver = (
  req: RawBodyRequest,
  _res: Response,
  buf?: Buffer,
  _encoding?: string,
) => {
  if (req.originalUrl.startsWith("/payment/hook") && buf?.length) {
    req.rawBody = buf;
  }
};

export function validateBody(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const check = await schema.safeParseAsync(req.body);

      if (!check.success) {
        const fieldErrors: FieldErrors = {};

        for (const issue of check.error.issues) {
          const fieldPath = issue.path.join(".");
          fieldErrors[fieldPath] = {
            value: issue.message,
            message: issue.message,
          };
        }

        throw new ValidateError(fieldErrors, "Validation failed");
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
