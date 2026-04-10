import Joi from 'joi';

import { SHORT_TEXT_MAX_LENGTH } from '@metaboost/helpers';

export const createMessageSchema = Joi.object({
  senderName: Joi.string().min(1).max(SHORT_TEXT_MAX_LENGTH).required(),
  body: Joi.string().min(1).required(),
  isPublic: Joi.boolean().optional(),
});

export const updateMessageSchema = Joi.object({
  body: Joi.string().min(1).optional(),
  isPublic: Joi.boolean().optional(),
}).min(1);

export type CreateMessageBody = { senderName: string; body: string; isPublic?: boolean };
export type UpdateMessageBody = { body?: string; isPublic?: boolean };
