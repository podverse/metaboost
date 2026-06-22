import type { UserWithRelations } from '@metaboost/orm';
import type { Request, Response } from 'express';

import { describe, expect, it, vi } from 'vitest';

import { requireUser } from '../middleware/auth.js';

describe('requireUser', () => {
  it('returns null, sets 401 JSON when req.user is undefined', () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const res = { status } as unknown as Response;
    const req = { user: undefined } as unknown as Request;

    const user = requireUser(req, res);

    expect(user).toBeNull();
    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ message: 'Authentication required' });
  });

  it('returns req.user when present', () => {
    const minimalUser = { id: 'user-1' } as unknown as UserWithRelations;
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const res = { status } as unknown as Response;
    const req = { user: minimalUser } as unknown as Request;

    const user = requireUser(req, res);

    expect(user).toBe(minimalUser);
    expect(status).not.toHaveBeenCalled();
    expect(json).not.toHaveBeenCalled();
  });
});
