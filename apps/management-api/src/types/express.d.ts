import type { ManagementUser } from "@metaboost/management-orm";

declare global {
  namespace Express {
    interface Request {
      managementUser?: ManagementUser;
    }
  }
}

export {};
