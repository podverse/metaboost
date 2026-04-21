import type { TermsVersionStatus } from '@metaboost/orm';

import Joi from 'joi';

import { SHORT_TEXT_MAX_LENGTH } from '@metaboost/helpers';

export type CreateTermsVersionBody = {
  versionKey: string;
  title: string;
  contentTextEnUs: string;
  contentTextEs: string;
  announcementStartsAt?: string | null;
  enforcementStartsAt: string;
  status: Extract<TermsVersionStatus, 'draft' | 'upcoming'>;
};

export type UpdateTermsVersionBody = {
  title?: string;
  contentTextEnUs?: string;
  contentTextEs?: string;
  announcementStartsAt?: string | null;
  enforcementStartsAt?: string;
  status?: Extract<TermsVersionStatus, 'draft' | 'upcoming'>;
};

const isoDate = Joi.string().isoDate();

export const createTermsVersionSchema = Joi.object<CreateTermsVersionBody>({
  versionKey: Joi.string().min(1).max(SHORT_TEXT_MAX_LENGTH).trim().required(),
  title: Joi.string().min(1).max(SHORT_TEXT_MAX_LENGTH).trim().required(),
  contentTextEnUs: Joi.string().min(1).required(),
  contentTextEs: Joi.string().min(1).required(),
  announcementStartsAt: isoDate.allow(null),
  enforcementStartsAt: isoDate.required(),
  status: Joi.string().valid('draft', 'upcoming').required(),
});

export const updateTermsVersionSchema = Joi.object<UpdateTermsVersionBody>({
  title: Joi.string().min(1).max(SHORT_TEXT_MAX_LENGTH).trim(),
  contentTextEnUs: Joi.string().min(1),
  contentTextEs: Joi.string().min(1),
  announcementStartsAt: isoDate.allow(null),
  enforcementStartsAt: isoDate,
  status: Joi.string().valid('draft', 'upcoming'),
}).min(1);
