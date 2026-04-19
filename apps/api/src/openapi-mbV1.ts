/**
 * OpenAPI 3.0 spec for mb-v1 standard endpoints (non-RSS MetaBoost ingest).
 */
export const openApiMbV1Document = {
  openapi: '3.0.0',
  info: {
    title: 'MetaBoost mb-v1 standard API',
    version: '1.0.0',
    description:
      'mb-v1 standard endpoints with prefixless path shapes. No RSS feed or feed/item identity fields.',
  },
  servers: [{ url: '/v1/standard/mb-v1', description: 'MetaBoost mb-v1 implementation mapping' }],
  components: {
    securitySchemes: {
      AppAssertion: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Use scheme `AppAssertion` (not `Bearer`): `Authorization: AppAssertion <jwt>`. JWT is EdDSA (Ed25519); claims bind method, path, and raw JSON body hash per MetaBoost Standard Endpoint signing.',
      },
    },
    schemas: {
      ErrorMessage: {
        type: 'object',
        properties: { message: { type: 'string' } },
      },
      AppAssertionError: {
        type: 'object',
        required: ['message', 'errorCode'],
        properties: {
          message: { type: 'string' },
          errorCode: {
            type: 'string',
            enum: [
              'app_assertion_required',
              'app_assertion_invalid',
              'app_assertion_expired',
              'app_assertion_binding_failed',
              'app_assertion_replay',
              'app_not_registered',
              'app_suspended',
              'app_registry_blocked',
              'app_global_blocked',
              'app_bucket_blocked',
              'registry_unavailable',
            ],
          },
        },
      },
      HttpsRequiredError: {
        type: 'object',
        required: ['message', 'errorCode'],
        properties: {
          message: { type: 'string' },
          errorCode: { type: 'string', enum: ['https_required'] },
        },
      },
      MbV1CapabilityResponse: {
        type: 'object',
        required: ['schema', 'message_char_limit', 'terms_of_service_url', 'schema_definition_url'],
        properties: {
          schema: { type: 'string', enum: ['mb-v1'] },
          message_char_limit: { type: 'integer', minimum: 1 },
          terms_of_service_url: { type: 'string' },
          schema_definition_url: { type: 'string' },
          public_messages_url: { type: 'string', nullable: true },
          sender_blocked: { type: 'boolean' },
          sender_block_message: { type: 'string', nullable: true },
          app_id_checked: { type: 'string', nullable: true },
          app_allowed: { type: 'boolean', nullable: true },
          app_block_reason: {
            type: 'string',
            nullable: true,
            enum: [
              'app_not_registered',
              'registry_unavailable',
              'app_registry_blocked',
              'app_global_blocked',
              'app_bucket_blocked',
            ],
          },
          app_block_message: { type: 'string', nullable: true },
        },
      },
      MbV1BoostBody: {
        type: 'object',
        required: ['currency', 'amount', 'action', 'app_name', 'sender_guid'],
        properties: {
          currency: {
            type: 'string',
            enum: ['BTC', 'USD'],
            description:
              'Currency code. Case-insensitive input is accepted; persisted/output values are canonical uppercase.',
          },
          amount: { type: 'number' },
          amount_unit: {
            type: 'string',
            nullable: true,
            description:
              "Optional amount unit. For BTC, when provided it must be 'satoshis' (case-insensitive input, canonical output 'satoshis').",
          },
          action: { type: 'string', enum: ['boost', 'stream'] },
          app_name: { type: 'string' },
          app_version: { type: 'string', nullable: true },
          sender_name: { type: 'string' },
          sender_guid: { type: 'string', format: 'uuid' },
          message: { type: 'string', nullable: true },
          time_position: { type: 'number', nullable: true },
        },
      },
      MbV1BoostCreatedResponse: {
        type: 'object',
        required: ['message_guid'],
        properties: {
          message_guid: { type: 'string', format: 'uuid' },
        },
      },
      MbV1BoostStreamNoMessageResponse: {
        type: 'object',
        required: ['action', 'message_sent'],
        properties: {
          action: { type: 'string', enum: ['stream'] },
          message_sent: { type: 'boolean', enum: [false] },
        },
      },
      MbV1PublicMessage: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          messageGuid: { type: 'string', format: 'uuid' },
          currency: {
            type: 'string',
            enum: ['BTC', 'USD'],
            description: 'Canonical uppercase currency code.',
          },
          amount: { type: 'string' },
          amountUnit: {
            type: 'string',
            nullable: true,
            description: "Canonical amount unit. BTC subunit is represented as 'satoshis'.",
          },
          appName: { type: 'string' },
          senderName: { type: 'string', nullable: true },
          body: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          sourceBucketContext: {
            type: 'object',
            nullable: true,
            properties: {
              bucket: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  shortId: { type: 'string' },
                  name: { type: 'string' },
                  type: { type: 'string' },
                },
              },
              parentBucket: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  shortId: { type: 'string' },
                  name: { type: 'string' },
                  type: { type: 'string' },
                },
              },
            },
          },
          breadcrumbContext: {
            type: 'object',
            nullable: true,
            description:
              'Reserved for cross-app breadcrumb metadata. mb-v1 responses currently return null.',
            properties: {
              level: { type: 'string', enum: ['channel', 'item'] },
              podcastGuid: { type: 'string', nullable: true },
              podcastLabel: { type: 'string', nullable: true },
              itemGuid: { type: 'string', nullable: true },
              itemLabel: { type: 'string', nullable: true },
              isSubBucket: { type: 'boolean' },
            },
          },
        },
      },
    },
  },
  paths: {
    '/boost/{bucketShortId}': {
      get: {
        summary: 'Get mb-v1 capability',
        description:
          'Returns mb-v1 endpoint metadata so apps can adapt boost submissions and message limits.',
        operationId: 'getMbV1Capability',
        parameters: [
          {
            in: 'path',
            name: 'bucketShortId',
            required: true,
            schema: { type: 'string' },
          },
          {
            in: 'query',
            name: 'sender_guid',
            required: false,
            schema: { type: 'string', format: 'uuid' },
          },
          {
            in: 'query',
            name: 'app_id',
            required: false,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Capability metadata',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MbV1CapabilityResponse' },
              },
            },
          },
          '403': {
            description: 'HTTPS required when policy enforces TLS (cleartext request)',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/HttpsRequiredError' } },
            },
          },
          '404': {
            description: 'Bucket not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
      post: {
        summary: 'Submit mb-v1 boost message',
        description:
          'Submits an mb-v1 message payload to the bucket identified by `bucketShortId`. **Requires** `Authorization: AppAssertion <jwt>`.',
        operationId: 'createMbV1Boost',
        security: [{ AppAssertion: [] }],
        parameters: [
          {
            in: 'path',
            name: 'bucketShortId',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MbV1BoostBody' } },
          },
        },
        responses: {
          '200': {
            description: 'Stream action accepted for telemetry',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MbV1BoostStreamNoMessageResponse' },
              },
            },
          },
          '201': {
            description: 'Boost accepted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MbV1BoostCreatedResponse' },
              },
            },
          },
          '400': {
            description: 'Validation or contract error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '401': {
            description: 'Missing or invalid AppAssertion',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AppAssertionError' } },
            },
          },
          '403': {
            description: 'HTTPS required or app not registered / suspended',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/HttpsRequiredError' },
                    { $ref: '#/components/schemas/AppAssertionError' },
                  ],
                },
              },
            },
          },
          '404': {
            description: 'Bucket not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/messages/public/{bucketShortId}': {
      get: {
        summary: 'List public mb-v1 messages',
        description:
          'Returns public boost messages in reverse chronological order. Stream action rows are excluded.',
        operationId: 'listMbV1PublicMessages',
        parameters: [
          {
            in: 'path',
            name: 'bucketShortId',
            required: true,
            schema: { type: 'string' },
          },
          {
            in: 'query',
            name: 'page',
            schema: { type: 'integer', minimum: 1 },
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', minimum: 1, maximum: 100 },
          },
        ],
        responses: {
          '200': {
            description: 'Public messages',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    messages: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/MbV1PublicMessage' },
                    },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                    totalPages: { type: 'integer' },
                  },
                },
              },
            },
          },
          '403': {
            description: 'HTTPS required when policy enforces TLS (cleartext request)',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/HttpsRequiredError' } },
            },
          },
          '404': {
            description: 'Bucket not found or not public',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
  },
} as const;
