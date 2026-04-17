import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    /** Raw JSON body bytes (POST /v1/standard/* only), for AppAssertion `bh` verification. */
    rawBody?: Buffer;
  }
}
