import { SUPPORTED_CURRENCIES_ORDERED } from '@metaboost/helpers-currency';

/**
 * OpenAPI 3.0 spec for the Metaboost API. Served at /api-docs for Swagger UI.
 */
const SUPPORTED_AMOUNT_UNITS = [
  'satoshis',
  'cents',
  'pence',
  'yen',
  'rappen',
  'ore',
  'paise',
  'centavos',
  'won',
] as const;

export const openApiDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Metaboost API',
    version: '0.1.2',
    description:
      'HTTP API with JWT auth. Use **Authorize** to set a Bearer token from login/signup, then call protected endpoints.',
  },
  servers: [{ url: '/v1', description: 'API v1' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'JWT Bearer auth for protected routes. Browser clients typically use session cookies; API clients may supply a Bearer token.',
      },
    },
    schemas: {
      User: {
        type: 'object',
        description:
          'User as returned in auth responses. Includes profile fields and Terms of Service acceptance status. passwordHash and other credentials are never returned.',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'User ID' },
          shortId: { type: 'string', description: 'URL-safe public id' },
          email: { type: 'string', format: 'email', nullable: true },
          username: { type: 'string', nullable: true },
          displayName: { type: 'string', nullable: true },
          preferredCurrency: { type: 'string', nullable: true },
          termsAcceptedAt: { type: 'string', format: 'date-time', nullable: true },
          acceptedTermsEffectiveAt: { type: 'string', format: 'date-time', nullable: true },
          latestTermsEffectiveAt: { type: 'string', format: 'date-time' },
          termsEnforcementStartsAt: { type: 'string', format: 'date-time' },
          hasAcceptedLatestTerms: { type: 'boolean' },
          currentTermsVersionKey: { type: 'string' },
          termsPolicyPhase: {
            type: 'string',
            enum: ['pre_announcement', 'announcement', 'grace', 'enforced'],
          },
          acceptedCurrentTerms: { type: 'boolean' },
          mustAcceptTermsNow: { type: 'boolean' },
          termsBlockerMessage: { type: 'string', nullable: true },
        },
      },
      LoginBody: {
        type: 'object',
        required: ['email', 'password'],
        description: 'email field accepts either email or username (identifier).',
        properties: {
          email: { type: 'string', description: 'Email or username' },
          password: { type: 'string', minLength: 1 },
        },
      },
      LoginResponse: {
        type: 'object',
        description: 'Successful authentication response.',
        properties: {
          user: { $ref: '#/components/schemas/User' },
        },
      },
      AcceptLatestTermsBody: {
        type: 'object',
        required: ['agreeToTerms'],
        properties: {
          agreeToTerms: {
            type: 'boolean',
            enum: [true],
            description: 'Must be true to record acceptance of the latest Terms of Service.',
          },
        },
      },
      ChangePasswordBody: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', minLength: 1 },
          newPassword: { type: 'string', minLength: 1 },
        },
      },
      SignupBody: {
        type: 'object',
        required: ['email', 'username', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          username: { type: 'string', minLength: 1, maxLength: 50 },
          password: { type: 'string', minLength: 1 },
          displayName: { type: 'string', nullable: true },
        },
      },
      VerifyEmailBody: {
        type: 'object',
        properties: {
          token: { type: 'string', description: 'Verification token from email link' },
        },
      },
      ForgotPasswordBody: {
        type: 'object',
        required: ['email'],
        properties: { email: { type: 'string', format: 'email' } },
      },
      ResetPasswordBody: {
        type: 'object',
        required: ['token', 'newPassword'],
        properties: {
          token: { type: 'string' },
          newPassword: { type: 'string', minLength: 1 },
        },
      },
      SetPasswordBody: {
        type: 'object',
        required: ['token', 'newPassword'],
        description:
          'Invite completion payload. Base requirement is token + newPassword. In admin-only invite modes, username is required; in admin_only_email, both username and email are required.',
        properties: {
          token: { type: 'string' },
          newPassword: { type: 'string', minLength: 1 },
          username: { type: 'string', minLength: 1, maxLength: 50, nullable: true },
          email: { type: 'string', format: 'email', nullable: true },
        },
      },
      RequestEmailChangeBody: {
        type: 'object',
        required: ['newEmail'],
        properties: { newEmail: { type: 'string', format: 'email' } },
      },
      ConfirmEmailChangeBody: {
        type: 'object',
        properties: { token: { type: 'string' } },
      },
      ErrorMessage: {
        type: 'object',
        properties: { message: { type: 'string' } },
      },
      BucketBlockedSender: {
        type: 'object',
        description:
          'A sender GUID blocked from bucket message lists for the entire tree rooted at rootBucketId.',
        properties: {
          id: { type: 'string', format: 'uuid' },
          rootBucketId: { type: 'string', format: 'uuid' },
          senderGuid: { type: 'string', description: 'Sender UUID string from mb-v1 app meta' },
          labelSnapshot: {
            type: 'string',
            nullable: true,
            description: 'Display name captured when the sender was blocked',
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      BlockedSendersListResponse: {
        type: 'object',
        properties: {
          blockedSenders: {
            type: 'array',
            items: { $ref: '#/components/schemas/BucketBlockedSender' },
          },
        },
      },
      BlockedSenderUpsertResponse: {
        type: 'object',
        properties: {
          blockedSender: { $ref: '#/components/schemas/BucketBlockedSender' },
        },
      },
      AddBlockedSenderBody: {
        type: 'object',
        required: ['senderGuid'],
        properties: {
          senderGuid: { type: 'string', minLength: 1 },
          labelSnapshot: { type: 'string', nullable: true },
        },
      },
      PublicBucket: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          shortId: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string' },
          isPublic: { type: 'boolean' },
          parentBucketId: { type: 'string', format: 'uuid', nullable: true },
          messageBodyMaxLength: { type: 'integer', minimum: 140, maximum: 2500 },
          preferredCurrency: {
            type: 'string',
            enum: SUPPORTED_CURRENCIES_ORDERED,
          },
          minimumMessageAmountMinor: {
            type: 'integer',
            minimum: 0,
            maximum: 2147483647,
            description:
              'Root minimum boost amount in preferred-currency minor units. Boost POST ingest is rejected when below this threshold.',
          },
          conversionEndpointUrl: {
            type: 'string',
            description:
              'Public bucket conversion endpoint returning cached conversion ratio metadata for client-side amount conversion (`source_currency` + `amount_unit` query params).',
          },
          ancestors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                shortId: { type: 'string' },
                name: { type: 'string' },
              },
            },
          },
        },
      },
      PublicBucketResponse: {
        type: 'object',
        properties: {
          bucket: { $ref: '#/components/schemas/PublicBucket' },
        },
      },
      CurrencyAmount: {
        type: 'object',
        required: ['currency', 'amountMinor', 'amountUnit'],
        properties: {
          currency: { type: 'string', enum: SUPPORTED_CURRENCIES_ORDERED },
          amountMinor: { type: 'integer', minimum: 0 },
          amountUnit: { type: 'string', enum: SUPPORTED_AMOUNT_UNITS },
        },
      },
      ConversionMetadata: {
        type: 'object',
        required: ['exchangeRatesFetchedAt', 'fiatBaseCurrency', 'serverStandardCurrency'],
        properties: {
          exchangeRatesFetchedAt: { type: 'string', format: 'date-time' },
          fiatBaseCurrency: { type: 'string', enum: SUPPORTED_CURRENCIES_ORDERED },
          serverStandardCurrency: { type: 'string', enum: SUPPORTED_CURRENCIES_ORDERED },
          supportedCurrencies: {
            type: 'array',
            items: { type: 'string', enum: SUPPORTED_CURRENCIES_ORDERED },
          },
          currencyUnits: {
            type: 'object',
            additionalProperties: { type: 'string', enum: SUPPORTED_AMOUNT_UNITS },
          },
        },
      },
      PublicBucketConversionResponse: {
        type: 'object',
        required: ['source', 'target', 'ratio', 'metadata'],
        properties: {
          source: { $ref: '#/components/schemas/ConversionSnapshotCurrencyContext' },
          target: { $ref: '#/components/schemas/ConversionSnapshotCurrencyContext' },
          ratio: { $ref: '#/components/schemas/ConversionSnapshotRatio' },
          metadata: { $ref: '#/components/schemas/ConversionMetadata' },
        },
      },
      ConversionSnapshotCurrencyContext: {
        type: 'object',
        required: ['currency', 'amountUnit', 'minorUnitExponent'],
        properties: {
          currency: { type: 'string', enum: SUPPORTED_CURRENCIES_ORDERED },
          amountUnit: { type: 'string', enum: SUPPORTED_AMOUNT_UNITS },
          minorUnitExponent: { type: 'integer', minimum: 0, maximum: 8 },
        },
      },
      ConversionSnapshotRatio: {
        type: 'object',
        required: ['sourceMajorToTargetMajor', 'targetMajorToSourceMajor', 'roundingMode'],
        properties: {
          sourceMajorToTargetMajor: {
            type: 'string',
            description: 'Major-unit ratio: target major units for one source major unit.',
          },
          targetMajorToSourceMajor: {
            type: 'string',
            description: 'Major-unit ratio: source major units for one target major unit.',
          },
          roundingMode: { type: 'string', enum: ['half_up'] },
        },
      },
      PublicExchangeRatesResponse: {
        type: 'object',
        required: ['source', 'conversions', 'metadata'],
        properties: {
          source: { $ref: '#/components/schemas/CurrencyAmount' },
          conversions: {
            type: 'array',
            items: { $ref: '#/components/schemas/CurrencyAmount' },
          },
          metadata: { $ref: '#/components/schemas/ConversionMetadata' },
        },
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
          'Authenticate with email or username and password; returns JWT and user. Use the token in Authorize for protected routes.',
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
          '429': {
            description: 'Too many requests; rate limit exceeded. Retry after the window.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Logout',
        description: 'Client should discard the token; server returns 204.',
        operationId: 'authLogout',
        responses: {
          '204': { description: 'No content' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Current user',
        description: 'Returns the authenticated user. Requires Bearer token.',
        operationId: 'authMe',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { user: { $ref: '#/components/schemas/User' } },
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
      delete: {
        summary: 'Delete current account',
        description:
          'Permanently deletes the authenticated user account and related data, then clears auth cookies.',
        operationId: 'authDeleteMe',
        security: [{ bearerAuth: [] }],
        responses: {
          '204': { description: 'Account deleted' },
          '401': {
            description: 'Authentication required',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/auth/terms-acceptance': {
      patch: {
        summary: 'Accept latest Terms of Service',
        description:
          'Records that the authenticated user accepts the current active Terms of Service version.',
        operationId: 'authAcceptLatestTerms',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AcceptLatestTermsBody' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated user with latest terms acceptance status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { user: { $ref: '#/components/schemas/User' } },
                },
              },
            },
          },
          '400': {
            description: 'agreeToTerms must be true',
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
        },
      },
    },
    '/auth/change-password': {
      post: {
        summary: 'Change password',
        description: 'Updates password for the authenticated user. Requires Bearer token.',
        operationId: 'authChangePassword',
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
          '429': {
            description: 'Too many requests; rate limit exceeded.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/auth/signup': {
      post: {
        summary: 'Sign up',
        description:
          'Register a new user only when AUTH_MODE=user_signup_email. Returns 403 in admin_only_username and admin_only_email modes. Success always returns a generic message to avoid account enumeration.',
        operationId: 'authSignup',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/SignupBody' } },
          },
        },
        responses: {
          '201': {
            description: 'Created or already registered (generic success response)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Registration complete.' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error (e.g. email, username, password required)',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '409': {
            description: 'Username already in use',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Registration is by admin only',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '429': {
            description: 'Too many requests; rate limit exceeded.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/auth/verify-email': {
      post: {
        summary: 'Verify email',
        description:
          'Confirm email using token from verification email. Available in admin_only_email and user_signup_email; disabled in admin_only_username.',
        operationId: 'authVerifyEmail',
        requestBody: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/VerifyEmailBody' } },
          },
        },
        responses: {
          '200': {
            description: 'Email verified',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { message: { type: 'string' } } },
              },
            },
          },
          '400': {
            description: 'Invalid or expired link',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Email verification not enabled',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '429': {
            description: 'Too many requests; rate limit exceeded.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        summary: 'Forgot password',
        description:
          'Request password reset email. Always returns 200 (no user enumeration). Available in admin_only_email and user_signup_email; disabled in admin_only_username.',
        operationId: 'authForgotPassword',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ForgotPasswordBody' } },
          },
        },
        responses: {
          '200': {
            description: 'If an account exists, a reset link was sent',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { message: { type: 'string' } } },
              },
            },
          },
          '403': {
            description: 'Email verification not enabled',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '429': {
            description: 'Too many requests; rate limit exceeded.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        summary: 'Reset password',
        description:
          'Set new password using token from reset email. Available in admin_only_email and user_signup_email; disabled in admin_only_username.',
        operationId: 'authResetPassword',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ResetPasswordBody' } },
          },
        },
        responses: {
          '204': { description: 'Password updated' },
          '400': {
            description: 'Invalid or expired link',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Email verification not enabled',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '429': {
            description: 'Too many requests; rate limit exceeded.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/auth/set-password': {
      post: {
        summary: 'Set password',
        description:
          'Complete an admin invitation using a set-password token. For admin_only_username, provide username + password. For admin_only_email, provide email + username + password. This endpoint is intended for invite tokens issued from management user creation in admin-only modes.',
        operationId: 'authSetPassword',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/SetPasswordBody' } },
          },
        },
        responses: {
          '204': { description: 'Password set' },
          '400': {
            description: 'Invalid or expired token or required-field validation error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '409': {
            description: 'Username or email already in use',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '429': {
            description: 'Too many requests; rate limit exceeded.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/auth/request-email-change': {
      post: {
        summary: 'Request email change',
        description:
          'Send verification email to new address. Requires Bearer token. Available in admin_only_email and user_signup_email; disabled in admin_only_username.',
        operationId: 'authRequestEmailChange',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RequestEmailChangeBody' } },
          },
        },
        responses: {
          '200': {
            description: 'Verification email sent',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { message: { type: 'string' } } },
              },
            },
          },
          '400': {
            description: 'newEmail required or same as current',
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
          '409': {
            description: 'Email already in use',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Email verification not enabled',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '429': {
            description: 'Too many requests; rate limit exceeded.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/auth/confirm-email-change': {
      post: {
        summary: 'Confirm email change',
        description:
          'Apply new email using token from verification email. Available in admin_only_email and user_signup_email; disabled in admin_only_username.',
        operationId: 'authConfirmEmailChange',
        requestBody: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ConfirmEmailChangeBody' } },
          },
        },
        responses: {
          '200': {
            description: 'Email updated',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { message: { type: 'string' } } },
              },
            },
          },
          '400': {
            description: 'Invalid or expired link',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '403': {
            description: 'Email verification not enabled',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '429': {
            description: 'Too many requests; rate limit exceeded.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/exchange-rates': {
      get: {
        summary: 'List public exchange-rate conversions',
        description:
          'Converts a source amount across currently cached supported currencies. `amount_unit` is required and validated per `source_currency` denomination policy.',
        operationId: 'getPublicExchangeRates',
        parameters: [
          {
            name: 'source_currency',
            in: 'query',
            required: true,
            schema: { type: 'string', enum: SUPPORTED_CURRENCIES_ORDERED },
          },
          {
            name: 'source_amount',
            in: 'query',
            required: true,
            schema: { type: 'integer', minimum: 0 },
            description: 'Source amount in minor units.',
          },
          {
            name: 'amount_unit',
            in: 'query',
            required: true,
            schema: { type: 'string', enum: SUPPORTED_AMOUNT_UNITS },
            description:
              'Required denomination unit for source currency. Validation is currency-specific.',
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PublicExchangeRatesResponse' },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '503': {
            description: 'Conversion unavailable with current cached rates',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/buckets/public/{id}': {
      get: {
        summary: 'Get public bucket metadata',
        description:
          'Returns public bucket metadata for app clients, including preferred currency, minimum boost threshold, and conversion endpoint URL.',
        operationId: 'getPublicBucket',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Bucket id (UUID) or short id',
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PublicBucketResponse' },
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
    '/buckets/public/{id}/conversion': {
      get: {
        summary: 'Get cached conversion ratios for bucket context',
        description:
          'Returns conversion ratio metadata derived from cached server exchange rates so clients can convert amounts locally. `amount_unit` is required and validated per `source_currency` denomination policy.',
        operationId: 'getPublicBucketConversionRatios',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Bucket id (UUID) or short id',
          },
          {
            name: 'source_currency',
            in: 'query',
            required: true,
            schema: { type: 'string', enum: SUPPORTED_CURRENCIES_ORDERED },
          },
          {
            name: 'amount_unit',
            in: 'query',
            required: true,
            schema: { type: 'string', enum: SUPPORTED_AMOUNT_UNITS },
            description:
              'Required denomination unit for source currency. Validation is currency-specific.',
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PublicBucketConversionResponse' },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '404': {
            description: 'Bucket not found or not public',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '503': {
            description: 'Conversion unavailable with current cached rates',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
    '/buckets/{bucketId}/blocked-senders': {
      get: {
        summary: 'List blocked senders',
        description:
          'Lists sender GUIDs blocked for the tree rooted at this bucket (resolved server-side). Requires permission to delete messages on the bucket. Optional query `q` filters sender GUID and label snapshot.',
        operationId: 'listBlockedSenders',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'bucketId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Bucket id (UUID) or short id',
          },
          {
            name: 'q',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Case-insensitive filter on sender GUID and label snapshot',
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BlockedSendersListResponse' },
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
            description: 'Forbidden',
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
        summary: 'Block a sender',
        description:
          'Upserts a blocked sender row for the tree root of the given bucket. Requires permission to delete messages.',
        operationId: 'addBlockedSender',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'bucketId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Bucket id (UUID) or short id',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/AddBlockedSenderBody' } },
          },
        },
        responses: {
          '201': {
            description: 'Created or updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BlockedSenderUpsertResponse' },
              },
            },
          },
          '400': {
            description: 'Validation error',
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
            description: 'Forbidden',
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
    '/buckets/{bucketId}/blocked-senders/{blockedSenderId}': {
      delete: {
        summary: 'Remove blocked sender',
        description:
          'Deletes a blocked-sender row by id for the tree root of the given bucket. Requires permission to delete messages.',
        operationId: 'removeBlockedSender',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'bucketId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Bucket id (UUID) or short id',
          },
          {
            name: 'blockedSenderId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '204': { description: 'Removed' },
          '400': {
            description: 'Invalid id',
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
            description: 'Forbidden',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
          '404': {
            description: 'Bucket or blocked-sender row not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorMessage' } },
            },
          },
        },
      },
    },
  },
} as const;
