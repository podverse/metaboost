import { customAlphabet } from 'nanoid';

/** Length of generated short ids (URL-safe). Column length is SHORT_ID_LENGTH (12) in db/field-lengths. */
const SHORT_ID_GENERATED_LENGTH = 10;

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/** Generates a URL-safe short id of SHORT_ID_GENERATED_LENGTH characters. */
export const generateShortId = customAlphabet(ALPHABET, SHORT_ID_GENERATED_LENGTH);
