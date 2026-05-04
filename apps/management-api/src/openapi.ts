import { SUPPORTED_CURRENCIES_ORDERED } from '@metaboost/helpers-currency';

/**
 * OpenAPI 3.0 spec for the Management API. Served at `{MANAGEMENT_API_VERSION_PATH}/api-docs` for Swagger UI.
 */
export const openApiDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Metaboost Management API',
    version: '0.1.2',
    description:
      'Management API for super admin and admins. JWT from POST /auth/login. Use **Authorize** to set the Bearer token. Permissions (admins_crud, users_crud bitmasks, event_visibility) apply to admins; super admin has full access. Capabilities such as changing passwords or assigning permissions are implied by the relevant CRUD bits.',
  },
  servers: [{ url: '/v1', description: 'API v1' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT from POST /v1/auth/login',
      },
    },
    schemas: {
      ManagementUser: {
        type: 'object',
        description:
          'Management user (super admin or admin). Credentials (e.g. passwordHash) are never returned.',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          displayName: { type: 'string' },
          isSuperAdmin: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { type: 'string', format: 'uuid', nullable: true },
          permissions: {
            type: 'object',
            nullable: true,
            properties: {
              adminsCrud: {
                type: 'integer',
                minimum: 0,
                maximum: 15,
                description: 'CRUD bitmask: create=1, read=2, update=4, delete=8',
              },
              usersCrud: {
                type: 'integer',
                minimum: 0,
                maximum: 15,
                description: 'CRUD bitmask for main-app users',
              },
              bucketsCrud: {
                type: 'integer',
                minimum: 0,
                maximum: 15,
                description: 'CRUD bitmask for buckets',
              },
              bucketMessagesCrud: {
                type: 'integer',
                minimum: 0,
                maximum: 15,
                description: 'CRUD bitmask for bucket messages',
              },
              bucketAdminsCrud: {
                type: 'integer',
                minimum: 0,
                maximum: 15,
                description: 'CRUD bitmask for bucket admins and invitations',
              },
              eventVisibility: { type: 'string', enum: ['own', 'all_admins', 'all'] },
            },
          },
        },
      },
      MainUser: {
        type: 'object',
        description: 'Main-app user (id, email, displayName only; passwordHash never returned).',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          displayName: { type: 'string', nullable: true },
        },
      },
      Event: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          actorId: { type: 'string' },
          actorType: { type: 'string', enum: ['super_admin', 'admin'] },
          actorDisplayName: { type: 'string', nullable: true },
          action: { type: 'string' },
          targetType: { type: 'string', nullable: true },
          targetId: { type: 'string', nullable: true },
          timestamp: { type: 'string', format: 'date-time' },
          details: { type: 'string', nullable: true },
        },
      },
      LoginBody: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', description: 'JWT for Authorization: Bearer' },
          user: { $ref: '#/components/schemas/ManagementUser' },
        },
      },
      CreateAdminBody: {
        type: 'object',
        required: ['email', 'password', 'displayName'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          displayName: { type: 'string', maxLength: 50, minLength: 1 },
          adminsCrud: { type: 'integer', minimum: 0, maximum: 15, default: 0 },
          usersCrud: { type: 'integer', minimum: 0, maximum: 15, default: 0 },
          bucketsCrud: { type: 'integer', minimum: 0, maximum: 15, default: 0 },
          bucketMessagesCrud: { type: 'integer', minimum: 0, maximum: 15, default: 0 },
          bucketAdminsCrud: { type: 'integer', minimum: 0, maximum: 15, default: 0 },
          eventVisibility: {
            type: 'string',
            enum: ['own', 'all_admins', 'all'],
            default: 'all_admins',
          },
        },
      },
      UpdateAdminBody: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          displayName: { type: 'string', maxLength: 50, minLength: 1 },
          password: { type: 'string', minLength: 8 },
          adminsCrud: { type: 'integer', minimum: 0, maximum: 15 },
          usersCrud: { type: 'integer', minimum: 0, maximum: 15 },
          bucketsCrud: { type: 'integer', minimum: 0, maximum: 15 },
          bucketMessagesCrud: { type: 'integer', minimum: 0, maximum: 15 },
          bucketAdminsCrud: { type: 'integer', minimum: 0, maximum: 15 },
          eventVisibility: { type: 'string', enum: ['own', 'all_admins', 'all'] },
        },
      },
      ChangePasswordBody: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', minLength: 1 },
          newPassword: { type: 'string', minLength: 8 },
        },
      },
      CreateUserBody: {
        type: 'object',
        description:
          'At least one of email or username is required. If password is omitted, a set-password link is returned in the response.',
        properties: {
          email: { type: 'string', format: 'email' },
          username: { type: 'string', minLength: 1, maxLength: 50 },
          password: { type: 'string', minLength: 8 },
          displayName: { type: 'string', maxLength: 50, nullable: true },
          initialBucketAdminIds: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
          },
        },
      },
      UpdateUserBody: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          displayName: { type: 'string', maxLength: 50, nullable: true },
        },
      },
      ChangeUserPasswordBody: {
        type: 'object',
        required: ['newPassword'],
        properties: { newPassword: { type: 'string', minLength: 8 } },
      },
      Bucket: {
        type: 'object',
        description:
          'Bucket (main-app resource). GET /buckets/:id includes ownerDisplayName when available.',
        properties: {
          id: { type: 'string', format: 'uuid' },
          idText: { type: 'string' },
          ownerId: { type: 'string', format: 'uuid' },
          ownerDisplayName: {
            type: 'string',
            nullable: true,
            description: 'Owner display name or email (GET single bucket only)',
          },
          name: { type: 'string' },
          isPublic: { type: 'boolean' },
          parentBucketId: { type: 'string', format: 'uuid', nullable: true },
          messageBodyMaxLength: { type: 'integer', minimum: 140, maximum: 2500, default: 500 },
          preferredCurrency: {
            type: 'string',
            enum: SUPPORTED_CURRENCIES_ORDERED,
            description:
              'Root preferred currency used by threshold snapshots and public conversion targets.',
          },
          publicBoostDisplayMinimumMinor: {
            type: 'integer',
            minimum: 0,
            maximum: 2147483647,
            description:
              'Optional floor for filtering public boost message lists in root preferred-currency minor units (0 = no owner filter). Editable on the root bucket.',
          },
          conversionEndpointUrl: {
            type: 'string',
            description:
              'Public conversion endpoint URL for converting source amounts into this bucket context.',
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateBucketBody: {
        type: 'object',
        required: ['name', 'ownerId'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 50 },
          isPublic: { type: 'boolean', default: false },
          ownerId: {
            type: 'string',
            format: 'uuid',
            description: 'Main-app user ID who owns the bucket',
          },
        },
      },
      UpdateBucketBody: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 50 },
          isPublic: { type: 'boolean' },
          messageBodyMaxLength: { type: 'integer', minimum: 140, maximum: 2500 },
          preferredCurrency: {
            type: 'string',
            enum: SUPPORTED_CURRENCIES_ORDERED,
            description:
              'Top-level bucket preferred currency used to store and compare threshold snapshot values.',
          },
          publicBoostDisplayMinimumMinor: {
            type: 'integer',
            minimum: 0,
            maximum: 2147483647,
            description:
              'Optional floor for filtering public boost message lists in root preferred-currency minor units (0 = no owner filter).',
          },
          applyToDescendants: { type: 'boolean' },
        },
      },
      BucketMessage: {
        type: 'object',
        description: 'Message in a bucket.',
        properties: {
          id: { type: 'string', format: 'uuid' },
          bucketId: { type: 'string', format: 'uuid' },
          senderName: { type: 'string' },
          body: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      BucketAdminUser: {
        type: 'object',
        description:
          'Main-app user in bucket admin context (id, idText for URLs, email, displayName).',
        properties: {
          id: { type: 'string', format: 'uuid' },
          idText: { type: 'string' },
          email: { type: 'string', format: 'email' },
          displayName: { type: 'string', nullable: true },
        },
      },
      BucketAdmin: {
        type: 'object',
        description: 'Bucket admin (main-app user with CRUD masks for this bucket).',
        properties: {
          id: { type: 'string', format: 'uuid' },
          bucketId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          bucketCrud: { type: 'integer' },
          bucketMessagesCrud: { type: 'integer' },
          bucketAdminsCrud: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          user: { $ref: '#/components/schemas/BucketAdminUser', nullable: true },
        },
      },
      BucketAdminInvitation: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          token: { type: 'string', description: 'Token for shareable invite link' },
          bucketCrud: { type: 'integer' },
          bucketMessagesCrud: { type: 'integer' },
          bucketAdminsCrud: { type: 'integer' },
          status: { type: 'string', enum: ['pending'] },
          expiresAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateBucketAdminInvitationBody: {
        type: 'object',
        properties: {
          bucketCrud: { type: 'integer', minimum: 0, maximum: 15 },
          bucketMessagesCrud: { type: 'integer', minimum: 0, maximum: 15 },
          bucketAdminsCrud: { type: 'integer', minimum: 0, maximum: 15 },
        },
      },
      UpdateBucketAdminBody: {
        type: 'object',
        minProperties: 1,
        properties: {
          bucketCrud: { type: 'integer', minimum: 0, maximum: 15 },
          bucketMessagesCrud: { type: 'integer', minimum: 0, maximum: 15 },
          bucketAdminsCrud: { type: 'integer', minimum: 0, maximum: 15 },
        },
      },
      BucketRoleItem: {
        type: 'object',
        description:
          'Predefined role (id: everything|users_full|bucket_full|read_everything|bucket_read, nameKey, isPredefined: true) or custom role (id: uuid, name, isPredefined: false, createdAt).',
        properties: {
          id: { type: 'string', description: 'Predefined id or UUID for custom' },
          nameKey: { type: 'string', nullable: true, description: 'i18n key for predefined' },
          name: { type: 'string', nullable: true, description: 'Display name for custom' },
          bucketCrud: { type: 'integer', minimum: 0, maximum: 15 },
          bucketMessagesCrud: { type: 'integer', minimum: 0, maximum: 15 },
          bucketAdminsCrud: { type: 'integer', minimum: 0, maximum: 15 },
          isPredefined: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      CreateBucketRoleBody: {
        type: 'object',
        required: ['name', 'bucketCrud', 'bucketMessagesCrud', 'bucketAdminsCrud'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 50 },
          bucketCrud: { type: 'integer', minimum: 0, maximum: 15 },
          bucketMessagesCrud: { type: 'integer', minimum: 0, maximum: 15 },
          bucketAdminsCrud: { type: 'integer', minimum: 0, maximum: 15 },
        },
      },
      UpdateBucketRoleBody: {
        type: 'object',
        minProperties: 1,
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 50 },
          bucketCrud: { type: 'integer', minimum: 0, maximum: 15 },
          bucketMessagesCrud: { type: 'integer', minimum: 0, maximum: 15 },
          bucketAdminsCrud: { type: 'integer', minimum: 0, maximum: 15 },
        },
      },
      TermsVersionStatus: {
        type: 'string',
        enum: ['draft', 'upcoming', 'current', 'deprecated'],
      },
      TermsVersion: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          versionKey: { type: 'string' },
          title: { type: 'string' },
          contentHash: {
            type: 'string',
            description:
              'Fingerprint of localized body text. New rows use SHA-256 hex (64 chars) of contentTextEnUs + "\\n---\\n" + contentTextEs; legacy rows may differ.',
          },
          contentTextEnUs: { type: 'string' },
          contentTextEs: { type: 'string' },
          announcementStartsAt: { type: 'string', format: 'date-time', nullable: true },
          enforcementStartsAt: { type: 'string', format: 'date-time' },
          status: { $ref: '#/components/schemas/TermsVersionStatus' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateTermsVersionBody: {
        type: 'object',
        required: [
          'versionKey',
          'title',
          'contentTextEnUs',
          'contentTextEs',
          'enforcementStartsAt',
          'status',
        ],
        properties: {
          versionKey: { type: 'string', minLength: 1, maxLength: 50 },
          title: { type: 'string', minLength: 1, maxLength: 50 },
          contentTextEnUs: { type: 'string', minLength: 1 },
          contentTextEs: { type: 'string', minLength: 1 },
          announcementStartsAt: { type: 'string', format: 'date-time', nullable: true },
          enforcementStartsAt: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['draft', 'upcoming'] },
        },
      },
      UpdateTermsVersionBody: {
        type: 'object',
        minProperties: 1,
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 50 },
          contentTextEnUs: { type: 'string', minLength: 1 },
          contentTextEs: { type: 'string', minLength: 1 },
          announcementStartsAt: { type: 'string', format: 'date-time', nullable: true },
          enforcementStartsAt: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['draft', 'upcoming'] },
        },
      },
      ErrorMessage: {
        type: 'object',
        properties: { message: { type: 'string' } },
      },
    },
  },
  paths: {
    '/': {
      get: {
        summary: 'Root',
        description: 'Hello message and env info',
        operationId: 'root',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    env: { type: 'object', properties: { port: { type: 'integer' } } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/health': {
      get: {
        summary: 'Health check',
        description: 'Liveness/readiness; generic running message',
        operationId: 'health',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    message: { type: 'string', example: 'The server is running.' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login',
        description:
          'Authenticate as super admin or admin; returns JWT and user. Use the token in Authorize for protected routes.',
        operationId: 'authLogin',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/LoginBody' } },
          },
        },
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } },
            },
          },
          '400': {
            description: 'Email and password required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Current management user',
        description: 'Returns the authenticated super admin or admin. Requires Bearer token.',
        operationId: 'authMe',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { user: { $ref: '#/components/schemas/ManagementUser' } },
                },
              },
            },
          },
          '401': {
            description: 'Missing or invalid token',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/admins': {
      get: {
        summary: 'List admins',
        description: 'List all admins (non–super-admin). Requires admins read permission.',
        operationId: 'listAdmins',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Page number (1-based)',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 100 },
            description: 'Max records per page (capped at server max)',
          },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by display name or email (case-insensitive substring)',
          },
          {
            name: 'sortBy',
            in: 'query',
            schema: { type: 'string', enum: ['email', 'displayName', 'createdAt'] },
            description: 'Sort field (default: createdAt)',
          },
          {
            name: 'sortOrder',
            in: 'query',
            schema: { type: 'string', enum: ['asc', 'desc'] },
            description: 'Sort direction (default: asc)',
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    admins: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ManagementUser' },
                    },
                    total: { type: 'integer', description: 'Total matching records (capped)' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    totalPages: { type: 'integer' },
                    truncatedTotal: {
                      type: 'boolean',
                      description: 'Present and true when actual total exceeds the cap',
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
      post: {
        summary: 'Create admin',
        description: 'Create a new admin. Super admin only.',
        operationId: 'createAdmin',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateAdminBody' } },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { admin: { $ref: '#/components/schemas/ManagementUser' } },
                },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Super admin only',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '409': {
            description: 'Email already in use',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/admins/change-password': {
      post: {
        summary: 'Change own password',
        description:
          'Update password for the authenticated management user. Requires Bearer token.',
        operationId: 'changePassword',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ChangePasswordBody' } },
          },
        },
        responses: {
          '204': { description: 'Password updated' },
          '400': {
            description: 'currentPassword and newPassword required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '401': {
            description: 'Authentication required or current password incorrect',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/admins/{id}': {
      get: {
        summary: 'Get admin by ID',
        description: 'Returns one admin. Requires admins read permission.',
        operationId: 'getAdmin',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { admin: { $ref: '#/components/schemas/ManagementUser' } },
                },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '404': {
            description: 'Admin not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
      patch: {
        summary: 'Update admin',
        description:
          'Update admin. Permission fields (adminsCrud, usersCrud, etc.) can only be changed by super admin.',
        operationId: 'updateAdmin',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UpdateAdminBody' } },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { admin: { $ref: '#/components/schemas/ManagementUser' } },
                },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions or only super admin can update permissions',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '404': {
            description: 'Admin not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
      delete: {
        summary: 'Delete admin',
        description:
          'Remove an admin. Requires admins delete permission. Super admin cannot be deleted.',
        operationId: 'deleteAdmin',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '204': { description: 'Deleted' },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '404': {
            description: 'Admin not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/users': {
      get: {
        summary: 'List main-app users',
        description: 'List all main-app users. Requires users read permission.',
        operationId: 'listUsers',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'search',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filter by email or display name (case-insensitive substring).',
          },
          {
            name: 'filterColumns',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description:
              'Comma-separated column IDs to apply search in: email, displayName. If omitted, search applies to both.',
          },
          {
            name: 'sortBy',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['email', 'displayName', 'createdAt'] },
            description: 'Sort field (default: createdAt)',
          },
          {
            name: 'sortOrder',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['asc', 'desc'] },
            description: 'Sort direction (default: asc)',
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    users: { type: 'array', items: { $ref: '#/components/schemas/MainUser' } },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
      post: {
        summary: 'Create main-app user',
        description:
          'Create a new main-app user. At least one of email or username required. If password omitted, setPasswordLink is returned. Requires users create permission.',
        operationId: 'createUser',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateUserBody' } },
          },
        },
        responses: {
          '201': {
            description: 'Created. Includes setPasswordLink when password was omitted.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['user'],
                  properties: {
                    user: { $ref: '#/components/schemas/MainUser' },
                    setPasswordLink: {
                      type: 'string',
                      description:
                        'Present when password was omitted; share with user to set password.',
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '409': {
            description: 'Email or username already in use',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/users/{id}': {
      get: {
        summary: 'Get main-app user by ID',
        operationId: 'getUser',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { user: { $ref: '#/components/schemas/MainUser' } },
                },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
      patch: {
        summary: 'Update main-app user',
        operationId: 'updateUser',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UpdateUserBody' } },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { user: { $ref: '#/components/schemas/MainUser' } },
                },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
      delete: {
        summary: 'Delete main-app user',
        operationId: 'deleteUser',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '204': { description: 'Deleted' },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/users/{id}/change-password': {
      post: {
        summary: 'Change main-app user password',
        description:
          'Set new password for a main-app user. Requires users_crud update permission or super admin.',
        operationId: 'changeUserPassword',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ChangeUserPasswordBody' } },
          },
        },
        responses: {
          '204': { description: 'Password updated' },
          '400': {
            description: 'newPassword required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/buckets': {
      get: {
        summary: 'List buckets',
        description:
          'List all buckets with optional search and pagination. Requires buckets read permission.',
        operationId: 'listBuckets',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by name (case-insensitive)',
          },
          {
            name: 'sortBy',
            in: 'query',
            schema: { type: 'string', enum: ['name', 'createdAt', 'isPublic'] },
            description: 'Sort field (default: createdAt)',
          },
          {
            name: 'sortOrder',
            in: 'query',
            schema: { type: 'string', enum: ['asc', 'desc'] },
            description: 'Sort direction (default: desc)',
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    buckets: { type: 'array', items: { $ref: '#/components/schemas/Bucket' } },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    totalPages: { type: 'integer' },
                    truncatedTotal: { type: 'boolean' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
      post: {
        summary: 'Create bucket',
        description:
          'Create a bucket. Requires buckets create permission. ownerId is the main-app user UUID who will own the bucket.',
        operationId: 'createBucket',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateBucketBody' } },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { bucket: { $ref: '#/components/schemas/Bucket' } },
                },
              },
            },
          },
          '400': {
            description: 'Owner not found (invalid ownerId)',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/buckets/{id}': {
      get: {
        summary: 'Get bucket by ID',
        operationId: 'getBucket',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { bucket: { $ref: '#/components/schemas/Bucket' } },
                },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions',
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
      patch: {
        summary: 'Update bucket',
        operationId: 'updateBucket',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UpdateBucketBody' } },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { bucket: { $ref: '#/components/schemas/Bucket' } },
                },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions',
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
      delete: {
        summary: 'Delete bucket',
        operationId: 'deleteBucket',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '204': { description: 'Deleted' },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions',
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
    '/buckets/{id}/buckets': {
      post: {
        summary: 'Create child bucket',
        description:
          'Creates a child bucket under the given parent. Owner is inherited from the parent. Requires buckets create permission.',
        operationId: 'createChildBucket',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', description: 'Parent bucket UUID or idText' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  isPublic: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    bucket: { $ref: '#/components/schemas/Bucket' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions',
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
      get: {
        summary: 'List child buckets',
        description:
          'Returns child buckets for the given parent bucket. Id can be bucket UUID or idText.',
        operationId: 'listChildBuckets',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', description: 'Bucket UUID or idText' },
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    buckets: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Bucket' },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions',
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
    '/buckets/{id}/admins': {
      get: {
        summary: 'List bucket admins',
        description:
          'Requires buckets read and bucketAdmins read permission. Id can be bucket UUID or idText.',
        operationId: 'listBucketAdmins',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', description: 'Bucket UUID or idText' },
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    admins: { type: 'array', items: { $ref: '#/components/schemas/BucketAdmin' } },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
        '403': {
          description: 'Insufficient permissions (bucketAdminsCrud read)',
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
  '/buckets/{id}/admins/{userId}': {
    get: {
      summary: 'Get bucket admin by user',
      description:
        'Requires buckets read and bucketAdmins read. userId can be main-app user UUID or idText.',
      operationId: 'getBucketAdmin',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', description: 'Bucket UUID or idText' },
        },
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: { type: 'string', description: 'Main-app user UUID or idText' },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { admin: { $ref: '#/components/schemas/BucketAdmin' } },
              },
            },
          },
        },
        '401': {
          description: 'Authentication required',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
          },
        },
        '403': {
          description: 'Insufficient permissions',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
          },
        },
        '404': {
          description: 'Not found',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
          },
        },
      },
    },
    patch: {
      summary: 'Update bucket admin',
      description: 'Requires buckets read and bucketAdmins update. Owner cannot be edited.',
      operationId: 'updateBucketAdmin',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
      ],
      requestBody: {
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/UpdateBucketAdminBody' } },
        },
      },
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { admin: { $ref: '#/components/schemas/BucketAdmin' } },
              },
            },
          },
        },
        '401': {
          description: 'Authentication required',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
          },
        },
        '403': {
          description: 'Insufficient permissions or bucket owner',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
          },
        },
        '404': {
          description: 'Not found',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
          },
        },
      },
    },
    delete: {
      summary: 'Remove bucket admin',
      description: 'Requires buckets read and bucketAdmins delete. Owner cannot be removed.',
      operationId: 'deleteBucketAdmin',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
      ],
      responses: {
        '204': { description: 'Deleted' },
        '401': {
          description: 'Authentication required',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
          },
        },
        '403': {
          description: 'Insufficient permissions or bucket owner',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
          },
        },
        '404': {
          description: 'Not found',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
          },
        },
      },
    },
  },
  '/buckets/{id}/admin-invitations': {
    get: {
      summary: 'List pending bucket admin invitations',
      description: 'Requires buckets read and bucketAdmins read.',
      operationId: 'listBucketAdminInvitations',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', description: 'Bucket UUID or idText' },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  invitations: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/BucketAdminInvitation' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions',
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
      post: {
        summary: 'Create bucket admin invitation',
        description:
          'Requires buckets read and bucketAdmins create. Returns token for shareable invite link.',
        operationId: 'createBucketAdminInvitation',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateBucketAdminInvitationBody' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    invitation: { $ref: '#/components/schemas/BucketAdminInvitation' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions',
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
    '/buckets/{id}/admin-invitations/{invitationId}': {
      delete: {
        summary: 'Delete bucket admin invitation',
        description: 'Requires buckets read and bucketAdmins delete.',
        operationId: 'deleteBucketAdminInvitation',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          {
            name: 'invitationId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '204': { description: 'Deleted' },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '404': {
            description: 'Not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/buckets/{id}/roles': {
      get: {
        summary: 'List bucket roles',
        description:
          'Returns predefined roles (same for all buckets) and custom roles for this bucket. Requires buckets read and bucketAdmins read.',
        operationId: 'listBucketRoles',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    roles: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/BucketRoleItem' },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Authentication required' },
          '403': { description: 'Insufficient permissions' },
          '404': { description: 'Bucket not found' },
        },
      },
      post: {
        summary: 'Create custom bucket role',
        description: 'Requires buckets read and bucketAdmins create. Parent bucket only.',
        operationId: 'createBucketRole',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateBucketRoleBody' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    role: { $ref: '#/components/schemas/BucketRoleItem' },
                  },
                },
              },
            },
          },
          '400': { description: 'Descendant bucket settings are inherited from root bucket' },
          '401': { description: 'Authentication required' },
          '403': { description: 'Insufficient permissions' },
          '404': { description: 'Bucket not found' },
        },
      },
    },
    '/buckets/{id}/roles/{roleId}': {
      patch: {
        summary: 'Update custom bucket role',
        description: 'Requires buckets read and bucketAdmins update. roleId is UUID.',
        operationId: 'updateBucketRole',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          {
            name: 'roleId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateBucketRoleBody' },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    role: { $ref: '#/components/schemas/BucketRoleItem' },
                  },
                },
              },
            },
          },
          '401': { description: 'Authentication required' },
          '403': { description: 'Insufficient permissions' },
          '404': { description: 'Bucket or role not found' },
        },
      },
      delete: {
        summary: 'Delete custom bucket role',
        description: 'Requires buckets read and bucketAdmins delete.',
        operationId: 'deleteBucketRole',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          {
            name: 'roleId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '204': { description: 'Deleted' },
          '401': { description: 'Authentication required' },
          '403': { description: 'Insufficient permissions' },
          '404': { description: 'Bucket or role not found' },
        },
      },
    },
    '/buckets/{bucketId}/messages': {
      get: {
        summary: 'List boost messages in a bucket',
        description:
          'Requires buckets read and messages read permission. Stream action rows are excluded from this endpoint. Threshold filtering uses root preferred-currency snapshot values and excludes rows without usable threshold snapshot values when effective minimum is greater than 0.',
        operationId: 'listBucketMessages',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'bucketId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          },
          {
            name: 'sort',
            in: 'query',
            schema: { type: 'string', enum: ['recent', 'oldest'] },
          },
          {
            name: 'includeBlockedSenderMessages',
            in: 'query',
            schema: { type: 'boolean' },
            description: 'When true, includes messages from blocked senders.',
          },
          {
            name: 'minimumAmountMinor',
            in: 'query',
            schema: { type: 'integer', minimum: 0 },
            description:
              'Optional extra filter in root preferred-currency minor units. Effective floor is max(request value, root bucket publicBoostDisplayMinimumMinor).',
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    messages: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/BucketMessage' },
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
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions',
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
    '/buckets/{bucketId}/messages/{messageId}': {
      get: {
        summary: 'Get boost message by ID',
        description:
          'Supports optional minimum boost threshold query filtering with minimumAmountMinor. Rows without usable threshold snapshot values are excluded when effective minimum is greater than 0.',
        operationId: 'getBucketMessage',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'bucketId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'messageId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'minimumAmountMinor',
            in: 'query',
            schema: { type: 'integer', minimum: 0 },
            description:
              'Optional extra filter in root preferred-currency minor units. Effective floor is max(request value, root bucket publicBoostDisplayMinimumMinor).',
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { message: { $ref: '#/components/schemas/BucketMessage' } },
                },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '404': {
            description: 'Not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
      delete: {
        summary: 'Delete message',
        operationId: 'deleteBucketMessage',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'bucketId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'messageId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '204': { description: 'Deleted' },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '404': {
            description: 'Not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/buckets/{id}/registry-apps': {
      get: {
        summary: 'List registry apps with per-root-bucket block policy',
        description:
          'Returns registry apps with bucket-level and site-wide block flags for the resolved root bucket. Requires buckets read and bucketAdmins read.',
        operationId: 'listRegistryAppsForManagementBucket',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    apps: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/buckets/{id}/blocked-apps': {
      get: {
        summary: 'List bucket blocked app rows for root',
        description: 'Requires buckets read and bucketAdmins read.',
        operationId: 'listManagementBucketBlockedApps',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'OK' },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
      post: {
        summary: 'Add a bucket-scoped app block for the root bucket',
        description: 'Requires buckets read and bucketAdmins update.',
        operationId: 'addManagementBucketBlockedApp',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['appId'],
                properties: {
                  appId: { type: 'string' },
                  appNameSnapshot: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Created' },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/buckets/{id}/blocked-apps/{blockedAppId}': {
      delete: {
        summary: 'Remove a bucket-scoped app block',
        description: 'Requires buckets read and bucketAdmins update.',
        operationId: 'removeManagementBucketBlockedApp',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          {
            name: 'blockedAppId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '204': { description: 'No content' },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Insufficient permissions',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/events': {
      get: {
        summary: 'List audit events',
        description:
          'Returns events filtered by role and event_visibility: super admin sees all; admins see events according to their event_visibility (own, all_admins, or all).',
        operationId: 'listEvents',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Page number (1-based)',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 100 },
            description: 'Max events per page (capped at server max)',
          },
          {
            name: 'sort',
            in: 'query',
            schema: { type: 'string', enum: ['recent', 'oldest'], default: 'recent' },
            description:
              'Legacy: sort by timestamp (recent = desc, oldest = asc). Ignored when sortBy is set.',
          },
          {
            name: 'sortBy',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['timestamp', 'actor', 'action', 'target', 'details'],
            },
            description: 'Sort field (when set, sortOrder is used)',
          },
          {
            name: 'sortOrder',
            in: 'query',
            schema: { type: 'string', enum: ['asc', 'desc'] },
            description: 'Sort direction (used when sortBy is set)',
          },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            description:
              'Filter by action, actor_type, target_type, target_id, or details (case-insensitive substring)',
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    events: { type: 'array', items: { $ref: '#/components/schemas/Event' } },
                    total: { type: 'integer', description: 'Total matching events (capped)' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    totalPages: { type: 'integer' },
                    truncatedTotal: {
                      type: 'boolean',
                      description: 'Present and true when actual total exceeds the cap',
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/terms-versions': {
      get: {
        summary: 'List terms versions',
        operationId: 'listTermsVersions',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    termsVersions: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/TermsVersion' },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Super admin only',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
      post: {
        summary: 'Create terms version',
        operationId: 'createTermsVersion',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateTermsVersionBody' } },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { termsVersion: { $ref: '#/components/schemas/TermsVersion' } },
                },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Super admin only',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '409': {
            description: 'Conflict (duplicate version key/upcoming constraint)',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/terms-versions/{id}': {
      get: {
        summary: 'Get terms version',
        operationId: 'getTermsVersion',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { termsVersion: { $ref: '#/components/schemas/TermsVersion' } },
                },
              },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Super admin only',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '404': {
            description: 'Terms version not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
      patch: {
        summary: 'Update terms version',
        operationId: 'updateTermsVersion',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UpdateTermsVersionBody' } },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { termsVersion: { $ref: '#/components/schemas/TermsVersion' } },
                },
              },
            },
          },
          '400': {
            description: 'Invalid request or immutable lifecycle state',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Super admin only',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '404': {
            description: 'Terms version not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '409': {
            description: 'Conflict (duplicate upcoming/version key/constraint)',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/terms-versions/{id}/promote-to-current': {
      post: {
        summary: 'Promote upcoming terms to current',
        operationId: 'promoteTermsVersionToCurrent',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Promoted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { termsVersion: { $ref: '#/components/schemas/TermsVersion' } },
                },
              },
            },
          },
          '400': {
            description: 'Only upcoming versions can be promoted',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Super admin only',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '404': {
            description: 'Terms version not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '409': {
            description: 'Promotion conflict',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
  },
} as const;
