/**
 * OpenAPI 3.0 spec for MB1 standard endpoints.
 * Served separately from Metaboost app-specific OpenAPI.
 */
export const openApiMb1Document = {
  openapi: '3.0.0',
  info: {
    title: 'MetaBoost MB1 Standard API',
    version: '1.0.0',
    description:
      'MB1 standard endpoints with prefixless path shapes. This spec is independent from MetaBoost app-specific routes.',
  },
  servers: [{ url: '/v1/s/mb1', description: 'MetaBoost MB1 implementation mapping' }],
  components: {
    schemas: {
      ErrorMessage: {
        type: 'object',
        properties: { message: { type: 'string' } },
      },
      Mb1CapabilityResponse: {
        type: 'object',
        required: ['schema', 'message_char_limit', 'terms_of_service_url', 'schema_definition_url'],
        properties: {
          schema: { type: 'string', enum: ['mb1'] },
          message_char_limit: { type: 'integer', minimum: 1 },
          terms_of_service_url: { type: 'string' },
          schema_definition_url: { type: 'string' },
          public_messages_url: { type: 'string', nullable: true },
        },
      },
      Mb1BoostBody: {
        type: 'object',
        required: ['currency', 'amount', 'action', 'app_name', 'feed_guid', 'feed_title'],
        properties: {
          currency: { type: 'string' },
          amount: { type: 'number' },
          amount_unit: { type: 'string', nullable: true },
          action: { type: 'string', enum: ['boost', 'stream'] },
          app_name: { type: 'string' },
          app_version: { type: 'string', nullable: true },
          sender_name: { type: 'string' },
          sender_id: { type: 'string' },
          message: { type: 'string' },
          feed_guid: { type: 'string' },
          podcast_index_feed_id: { type: 'integer', nullable: true },
          feed_title: { type: 'string' },
          item_guid: { type: 'string' },
          item_title: { type: 'string' },
          time_position: { type: 'number', nullable: true },
        },
      },
      Mb1BoostCreatedResponse: {
        type: 'object',
        required: ['message_guid'],
        properties: {
          message_guid: { type: 'string', format: 'uuid' },
        },
      },
      Mb1BoostStreamNoMessageResponse: {
        type: 'object',
        required: ['action', 'message_sent'],
        properties: {
          action: { type: 'string', enum: ['stream'] },
          message_sent: { type: 'boolean', enum: [false] },
        },
      },
      Mb1ConfirmPaymentBody: {
        type: 'object',
        required: ['message_guid', 'payment_verified_by_app'],
        properties: {
          message_guid: { type: 'string', format: 'uuid' },
          payment_verified_by_app: { type: 'boolean' },
        },
      },
      Mb1ConfirmPaymentResponse: {
        type: 'object',
        required: ['message_guid', 'payment_verified_by_app'],
        properties: {
          message_guid: { type: 'string', format: 'uuid' },
          payment_verified_by_app: { type: 'boolean' },
        },
      },
    },
  },
  paths: {
    '/boost/{bucketShortId}': {
      get: {
        summary: 'Get mb1 capability',
        description:
          'Returns mb1 endpoint metadata so apps can adapt boost submissions and message limits.',
        operationId: 'getMb1Capability',
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
                schema: { $ref: '#/components/schemas/Mb1CapabilityResponse' },
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
        summary: 'Submit mb1 boost message',
        description: 'Submits an mb1 message payload and returns a message guid.',
        operationId: 'createMb1Boost',
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
            'application/json': { schema: { $ref: '#/components/schemas/Mb1BoostBody' } },
          },
        },
        responses: {
          '200': {
            description: 'Stream action accepted; no message created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Mb1BoostStreamNoMessageResponse' },
              },
            },
          },
          '201': {
            description: 'Boost accepted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Mb1BoostCreatedResponse' },
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
    '/boost/{bucketShortId}/confirm-payment': {
      post: {
        summary: 'Confirm mb1 payment',
        description: 'Confirms whether app-side payment verification succeeded for a message guid.',
        operationId: 'confirmMb1Payment',
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
            'application/json': {
              schema: { $ref: '#/components/schemas/Mb1ConfirmPaymentBody' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Payment confirmation accepted',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Mb1ConfirmPaymentResponse' },
              },
            },
          },
          '404': {
            description: 'Bucket or message not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/messages/public/{bucketShortId}': {
      get: {
        summary: 'List public mb1 messages',
        description:
          'Returns public boost messages in reverse chronological order for a bucket. Stream action rows are excluded.',
        operationId: 'listMb1PublicMessages',
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
                    messages: { type: 'array', items: { type: 'object' } },
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
        operationId: 'listMb1PublicMessagesByChannel',
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
                    messages: { type: 'array', items: { type: 'object' } },
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
        operationId: 'listMb1PublicMessagesByItem',
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
                    messages: { type: 'array', items: { type: 'object' } },
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
