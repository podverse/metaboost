import type { ManagementUser } from "@boilerplate/management-orm";

declare global {
  namespace Express {
    interface Request {
      managementUser?: ManagementUser;
    }
  }
}

export {};
