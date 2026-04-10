import type { Express } from 'express';

import request from 'supertest';

import { config } from '../../config/index.js';

const API = config.apiVersionPath;

type ManagementAgent = ReturnType<typeof request.agent>;

export async function createManagementLoginAgent(
  app: Express,
  credentials: { username: string; password: string }
): Promise<ManagementAgent> {
  const agent = request.agent(app);
  await agent.post(`${API}/auth/login`).send(credentials).expect(200);
  return agent;
}
