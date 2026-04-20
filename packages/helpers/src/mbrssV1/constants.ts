export const MBRSS_V1_ACTION_BOOST = 'boost';
export const MBRSS_V1_ACTION_STREAM = 'stream';
export const MBRSS_V1_CURRENCY_BTC = 'BTC';
export const MBRSS_V1_CURRENCY_USD = 'USD';
export const MBRSS_V1_SATOSHIS_UNIT = 'satoshis';

export const MBRSS_V1_ACTION_VALUES = [MBRSS_V1_ACTION_BOOST, MBRSS_V1_ACTION_STREAM] as const;
export const MBRSS_V1_CURRENCY_VALUES = [MBRSS_V1_CURRENCY_BTC, MBRSS_V1_CURRENCY_USD] as const;

export type MbrssV1ActionValue = (typeof MBRSS_V1_ACTION_VALUES)[number];
export type MbrssV1CurrencyValue = (typeof MBRSS_V1_CURRENCY_VALUES)[number];
