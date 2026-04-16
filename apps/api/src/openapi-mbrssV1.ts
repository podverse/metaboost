/**
 * OpenAPI 3.0 spec for mbrss-v1 standard endpoints.
 * Served separately from Metaboost app-specific OpenAPI.
 */
export const openApiMbrssV1Document = {
  openapi: '3.0.0',
  info: {
    title: 'MetaBoost mbrss-v1 standard API',
    version: '1.0.0',
    description:
      'mbrss-v1 standard endpoints with prefixless path shapes. This spec is independent from MetaBoost app-specific routes.',
  },
  servers: [{ url: '/v1/s/mbrss-v1', description: 'MetaBoost mbrss-v1 implementation mapping' }],
  components: {
    schemas: {
      ErrorMessage: {
        type: 'object',
        properties: { message: { type: 'string' } },
      },
      MbrssV1CapabilityResponse: {
        type: 'object',
        required: ['schema', 'message_char_limit', 'terms_of_service_url', 'schema_definition_url'],
        properties: {
          schema: { type: 'string', enum: ['mbrss-v1'] },
          message_char_limit: { type: 'integer', minimum: 1 },
          terms_of_service_url: { type: 'string' },
          schema_definition_url: { type: 'string' },
          public_messages_url: { type: 'string', nullable: true },
        },
      },
      MbrssV1BoostBody: {
        type: 'object',
        required: [
          'currency',
          'amount',
          'action',
          'app_name',
          'feed_guid',
          'feed_title',
          'sender_guid',
        ],
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
          feed_guid: { type: 'string' },
          podcast_index_feed_id: { type: 'integer', nullable: true },
          feed_title: { type: 'string' },
          item_guid: { type: 'string' },
          item_title: { type: 'string' },
          time_position: { type: 'number', nullable: true },
        },
      },
      MbrssV1BoostCreatedResponse: {
        type: 'object',
        required: ['message_guid'],
        properties: {
          message_guid: { type: 'string', format: 'uuid' },
        },
      },
      MbrssV1BoostStreamNoMessageResponse: {
        type: 'object',
        required: ['action', 'message_sent'],
        properties: {
          action: { type: 'string', enum: ['stream'] },
          message_sent: { type: 'boolean', enum: [false] },
        },
      },
      MbrssV1PublicMessage: {
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
          senderGuid: { type: 'string', nullable: true },
          body: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/boost/{bucketShortId}': {
      get: {
        summary: 'Get mbrss-v1 capability',
        description:
          'Returns mbrss-v1 endpoint metadata so apps can adapt boost submissions and message limits.',
        operationId: 'getMbrssV1Capability',
        parameters: [
          {
            in: 'path',
            name: 'bucketShortId',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Capability metadata',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MbrssV1CapabilityResponse' },
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
      post: {
        summary: 'Submit mbrss-v1 boost message',
        description: 'Submits an mbrss-v1 message payload and returns a message guid.',
        operationId: 'createMbrssV1Boost',
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
            'application/json': { schema: { $ref: '#/components/schemas/MbrssV1BoostBody' } },
          },
        },
        responses: {
          '200': {
            description: 'Stream action accepted for telemetry; no display message response guid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MbrssV1BoostStreamNoMessageResponse' },
              },
            },
          },
          '201': {
            description: 'Boost accepted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MbrssV1BoostCreatedResponse' },
              },
            },
          },
          '400': {
            description: 'Validation or contract error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
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
        summary: 'List public mbrss-v1 messages',
        description:
          'Returns public boost messages in reverse chronological order for a bucket. Stream action rows are excluded.',
        operationId: 'listMbrssV1PublicMessages',
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
                      items: { $ref: '#/components/schemas/MbrssV1PublicMessage' },
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
          '404': {
            description: 'Bucket not found or not public',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/messages/public/{bucketShortId}/channel/{podcastGuid}': {
      get: {
        summary: 'List public messages scoped by channel',
        description:
          'Returns channel-scoped public boost messages for a bucket. Stream action rows are excluded.',
        operationId: 'listMbrssV1PublicMessagesByChannel',
        parameters: [
          {
            in: 'path',
            name: 'bucketShortId',
            required: true,
            schema: { type: 'string' },
          },
          {
            in: 'path',
            name: 'podcastGuid',
            required: true,
            schema: { type: 'string' },
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
                      items: { $ref: '#/components/schemas/MbrssV1PublicMessage' },
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
          '404': {
            description: 'Bucket not found or not public',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/messages/public/{bucketShortId}/item/{itemGuid}': {
      get: {
        summary: 'List public messages scoped by item',
        description:
          'Returns item-scoped public boost messages for a bucket. Stream action rows are excluded.',
        operationId: 'listMbrssV1PublicMessagesByItem',
        parameters: [
          {
            in: 'path',
            name: 'bucketShortId',
            required: true,
            schema: { type: 'string' },
          },
          {
            in: 'path',
            name: 'itemGuid',
            required: true,
            schema: { type: 'string' },
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
                      items: { $ref: '#/components/schemas/MbrssV1PublicMessage' },
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
