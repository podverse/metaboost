import type { APIRequestContext } from '@playwright/test';

const MAILPIT_BASE_URL = 'http://localhost:8025';
const API_BASE_URL = 'http://localhost:4010/v1';
const MAILPIT_MESSAGES_PATH = '/api/v1/messages';
const RESET_PASSWORD_PATH = '/reset-password';
const RESET_TOKEN_POLL_TIMEOUT_MS = 10_000;
const RESET_TOKEN_POLL_INTERVAL_MS = 250;

type JsonObject = Record<string, unknown>;

const isJsonObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null;

const getString = (value: JsonObject, key: string): string | null => {
  const field = value[key];
  return typeof field === 'string' ? field : null;
};

const getMessageRecipientAddresses = (message: JsonObject): string[] => {
  const to = message.To;
  if (!Array.isArray(to)) {
    return [];
  }
  return to
    .map((entry) => {
      if (!isJsonObject(entry)) {
        return null;
      }
      const address = getString(entry, 'Address');
      return address === null ? null : address.toLowerCase();
    })
    .filter((address): address is string => address !== null);
};

const extractResetTokenFromText = (text: string): string | null => {
  const resetLinkMatch = text.match(/https?:\/\/[^\s"'<>)]*\/reset-password\?token=[^\s"'<>)]+/i);
  if (resetLinkMatch === null) {
    return null;
  }
  const resetUrl = new URL(resetLinkMatch[0]);
  if (!resetUrl.pathname.endsWith(RESET_PASSWORD_PATH)) {
    return null;
  }
  const token = resetUrl.searchParams.get('token');
  return token === null || token === '' ? null : token;
};

const listResetMessagesForEmail = async (
  request: APIRequestContext,
  email: string
): Promise<Map<string, string>> => {
  const response = await request.get(`${MAILPIT_BASE_URL}${MAILPIT_MESSAGES_PATH}`);
  if (!response.ok()) {
    throw new Error(
      `Failed to list Mailpit messages: ${response.status()} ${response.statusText()}`
    );
  }

  const payload = await response.json();
  if (!isJsonObject(payload) || !Array.isArray(payload.messages)) {
    throw new Error('Mailpit messages response is missing a messages array');
  }

  const normalizedEmail = email.toLowerCase();
  const messages = new Map<string, string>();
  for (const rawMessage of payload.messages) {
    if (!isJsonObject(rawMessage)) {
      continue;
    }
    const id = getString(rawMessage, 'ID');
    if (id === null || id === '') {
      continue;
    }
    const created = getString(rawMessage, 'Created') ?? '';
    const recipients = getMessageRecipientAddresses(rawMessage);
    if (!recipients.includes(normalizedEmail)) {
      continue;
    }
    messages.set(id, created);
  }

  return messages;
};

const getResetTokenFromMessage = async (
  request: APIRequestContext,
  messageId: string
): Promise<string | null> => {
  const response = await request.get(`${MAILPIT_BASE_URL}/api/v1/message/${messageId}`);
  if (!response.ok()) {
    throw new Error(
      `Failed to read Mailpit message ${messageId}: ${response.status()} ${response.statusText()}`
    );
  }

  const payload = await response.json();
  if (!isJsonObject(payload)) {
    throw new Error(`Mailpit message ${messageId} has an invalid payload`);
  }

  const textBody = getString(payload, 'Text');
  if (textBody !== null) {
    const textToken = extractResetTokenFromText(textBody);
    if (textToken !== null) {
      return textToken;
    }
  }

  const htmlBody = payload.HTML;
  if (typeof htmlBody === 'string') {
    return extractResetTokenFromText(htmlBody);
  }
  if (Array.isArray(htmlBody)) {
    for (const entry of htmlBody) {
      if (typeof entry !== 'string') {
        continue;
      }
      const token = extractResetTokenFromText(entry);
      if (token !== null) {
        return token;
      }
    }
  }

  return null;
};

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

export async function issueForgotPasswordAndGetResetToken(
  request: APIRequestContext,
  email: string
): Promise<string> {
  const existingMessages = await listResetMessagesForEmail(request, email);
  const forgotPasswordResponse = await request.post(`${API_BASE_URL}/auth/forgot-password`, {
    data: { email },
  });
  if (!forgotPasswordResponse.ok()) {
    throw new Error(
      `Failed to issue forgot-password request: ${forgotPasswordResponse.status()} ${forgotPasswordResponse.statusText()}`
    );
  }

  const startedAtMs = Date.now();
  while (Date.now() - startedAtMs <= RESET_TOKEN_POLL_TIMEOUT_MS) {
    const currentMessages = await listResetMessagesForEmail(request, email);
    const newMessageIds = [...currentMessages.keys()].filter((id) => !existingMessages.has(id));
    for (const messageId of newMessageIds) {
      const token = await getResetTokenFromMessage(request, messageId);
      if (token !== null) {
        return token;
      }
    }
    await sleep(RESET_TOKEN_POLL_INTERVAL_MS);
  }

  throw new Error(`Timed out waiting for a new reset-password email in Mailpit for ${email}`);
}
