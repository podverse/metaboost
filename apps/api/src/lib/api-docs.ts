import type { Express } from 'express';

import swaggerUi from 'swagger-ui-express';

import { config } from '../config/index.js';
import { openApiMbrssV1Document } from '../openapi-mbrssV1.js';
import { openApiDocument } from '../openapi.js';

export type ApiDocsBundle = {
  openApiDoc: Omit<typeof openApiDocument, 'servers'> & {
    servers: Array<{ url: string; description: string }>;
  };
  openApiMbrssV1Doc: Omit<typeof openApiMbrssV1Document, 'servers'> & {
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
          url: `${config.apiVersionPath}/s/mbrss-v1`,
          description: 'MetaBoost mbrss-v1 implementation',
        },
      ],
    },
  };
}

export function registerApiDocs(app: Express, apiDocsBundle: ApiDocsBundle): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(apiDocsBundle.openApiDoc));
  app.use(
    '/api-docs/mbrss-v1',
    swaggerUi.serveFiles(apiDocsBundle.openApiMbrssV1Doc),
    swaggerUi.setup(apiDocsBundle.openApiMbrssV1Doc)
  );
}
