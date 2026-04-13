import type { Express } from 'express';

import swaggerUi from 'swagger-ui-express';

import { config } from '../config/index.js';
import { openApiMb1Document } from '../openapi-mb1.js';
import { openApiDocument } from '../openapi.js';

export type ApiDocsBundle = {
  openApiDoc: Omit<typeof openApiDocument, 'servers'> & {
    servers: Array<{ url: string; description: string }>;
  };
  openApiMb1Doc: Omit<typeof openApiMb1Document, 'servers'> & {
    servers: Array<{ url: string; description: string }>;
  };
};

export function createApiDocsBundle(): ApiDocsBundle {
  return {
    openApiDoc: {
      ...openApiDocument,
      servers: [{ url: config.apiVersionPath, description: `API ${config.apiVersionPath}` }],
    },
    openApiMb1Doc: {
      ...openApiMb1Document,
      servers: [
        { url: `${config.apiVersionPath}/s/mb1`, description: 'MetaBoost MB1 implementation' },
      ],
    },
  };
}

export function registerApiDocs(app: Express, apiDocsBundle: ApiDocsBundle): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(apiDocsBundle.openApiDoc));
  app.use(
    '/api-docs/mb1',
    swaggerUi.serveFiles(apiDocsBundle.openApiMb1Doc),
    swaggerUi.setup(apiDocsBundle.openApiMb1Doc)
  );
}
