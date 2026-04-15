export const MB1_ACTION_BOOST = 'boost';
export const MB1_ACTION_STREAM = 'stream';
export const MB1_CURRENCY_BTC = 'BTC';
export const MB1_CURRENCY_USD = 'USD';
export const MB1_SATOSHIS_UNIT = 'satoshis';

export const MB1_ACTION_VALUES = [MB1_ACTION_BOOST, MB1_ACTION_STREAM] as const;
export const MB1_CURRENCY_VALUES = [MB1_CURRENCY_BTC, MB1_CURRENCY_USD] as const;

export type Mb1ActionValue = (typeof MB1_ACTION_VALUES)[number];
export type Mb1CurrencyValue = (typeof MB1_CURRENCY_VALUES)[number];
