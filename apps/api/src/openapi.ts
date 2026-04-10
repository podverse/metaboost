/**
 * OpenAPI 3.0 spec for the Metaboost API. Served at /api-docs for Swagger UI.
 */
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
          'User as returned in auth responses. id, shortId, email (optional), username (optional), displayName. passwordHash and other credentials are never returned.',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'User ID' },
          shortId: { type: 'string', description: 'URL-safe public id' },
          email: { type: 'string', format: 'email', nullable: true },
          username: { type: 'string', nullable: true },
          displayName: { type: 'string', nullable: true },
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
  },
} as const;
