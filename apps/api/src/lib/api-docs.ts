import type { Express } from 'express';

import swaggerUi from 'swagger-ui-express';

import { config } from '../config/index.js';
import { openApiMbrssV1Document } from '../openapi-mbrssV1.js';
import { openApiMbV1Document } from '../openapi-mbV1.js';
import { openApiDocument } from '../openapi.js';

export type ApiDocsBundle = {
  openApiDoc: Omit<typeof openApiDocument, 'servers'> & {
    servers: Array<{ url: string; description: string }>;
  };
  openApiMbrssV1Doc: Omit<typeof openApiMbrssV1Document, 'servers'> & {
    servers: Array<{ url: string; description: string }>;
  };
  openApiMbV1Doc: Omit<typeof openApiMbV1Document, 'servers'> & {
    servers: Array<{ url: string; description: string }>;
  };
};

export function createApiDocsBundle(): ApiDocsBundle {
  return {
    openApiDoc: {
      ...openApiDocument,
      servers: [{ url: config.apiVersionPath, description: `API ${config.apiVersionPath}` }],
    },
    openApiMbrssV1Doc: {
      ...openApiMbrssV1Document,
      servers: [
        {
          url: `${config.apiVersionPath}/standard/mbrss-v1`,
          description: 'MetaBoost mbrss-v1 implementation',
        },
      ],
    },
    openApiMbV1Doc: {
      ...openApiMbV1Document,
      servers: [
        {
          url: `${config.apiVersionPath}/standard/mb-v1`,
          description: 'MetaBoost mb-v1 implementation',
        },
      ],
    },
  };
}

export function versionedApiDocsBasePath(): string {
  return `${config.apiVersionPath}/api-docs`;
}

export function registerApiDocs(app: Express, apiDocsBundle: ApiDocsBundle): void {
  const docsBase = versionedApiDocsBasePath();
  app.use(docsBase, swaggerUi.serve, swaggerUi.setup(apiDocsBundle.openApiDoc));
  app.use(
    `${docsBase}/mbrss-v1`,
    swaggerUi.serveFiles(apiDocsBundle.openApiMbrssV1Doc),
    swaggerUi.setup(apiDocsBundle.openApiMbrssV1Doc)
  );
  app.use(
    `${docsBase}/mb-v1`,
    swaggerUi.serveFiles(apiDocsBundle.openApiMbV1Doc),
    swaggerUi.setup(apiDocsBundle.openApiMbV1Doc)
  );
}
