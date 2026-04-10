import type { Express } from 'express';

import request from 'supertest';

import { config } from '../../config/index.js';

const API = config.apiVersionPath;

type ApiAgent = ReturnType<typeof request.agent>;

export async function createApiLoginAgent(
  app: Express,
  credentials: { email: string; password: string }
): Promise<ApiAgent> {
  const agent = request.agent(app);
  await agent.post(`${API}/auth/login`).send(credentials).expect(200);
  return agent;
}
