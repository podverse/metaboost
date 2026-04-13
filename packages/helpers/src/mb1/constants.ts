export const MB1_ACTION_BOOST = 'boost';
export const MB1_ACTION_STREAM = 'stream';

export const MB1_ACTION_VALUES = [MB1_ACTION_BOOST, MB1_ACTION_STREAM] as const;

export type Mb1ActionValue = (typeof MB1_ACTION_VALUES)[number];
