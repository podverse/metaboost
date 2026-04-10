import type { UserWithRelations } from "@metaboost/orm";

declare global {
  namespace Express {
    interface Request {
      user?: UserWithRelations;
    }
  }
}

export {};
