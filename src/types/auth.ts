import type { UserRole } from "@prisma/client";
import type { Request } from "express";

export class AuthData {
  id: number;
  uid: string;
  role: UserRole;
  email?: string;
}

export interface UserJwt {
  id?: number;
  uid?: string;
  email: string;
  role?: UserRole;
  usedFor: JwtUsedFor;
}

export class SellerServiceData {
  id: number;

  sellerUserId: number;
}

export enum JwtUsedFor {
  CREATE_PASSWORD = "create-password",
  FORGOT_PASSWORD = "forgot-password",
}

export type AuthRequest = Request & { user?: AuthData };

export type ServiceRequest = Request & { user?: SellerServiceData };
