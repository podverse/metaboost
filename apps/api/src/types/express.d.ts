import type { UserWithRelations } from "@boilerplate/orm";

declare global {
  namespace Express {
    interface Request {
      user?: UserWithRelations;
    }
  }
}

export {};
