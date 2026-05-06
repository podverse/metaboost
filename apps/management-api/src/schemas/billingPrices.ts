import Joi from 'joi';

const currencyCode = Joi.string().length(3).uppercase();

export const scheduleBillingPriceSchema = Joi.object({
  currencyCode: currencyCode.required(),
  billingCadence: Joi.string().valid('monthly', 'annual').required(),
  amountCents: Joi.number().integer().min(0).required(),
  effectiveFrom: Joi.date().required(),
  changeReason: Joi.string().max(2000).allow(null, ''),
});

export const deprecateBillingPriceSchema = Joi.object({
  changeReason: Joi.string().max(2000).allow(null, ''),
});

export type ScheduleBillingPriceBody = {
  currencyCode: string;
  billingCadence: 'monthly' | 'annual';
  amountCents: number;
  effectiveFrom: string | Date;
  changeReason?: string | null;
};

export type DeprecateBillingPriceBody = {
  changeReason?: string | null;
};
