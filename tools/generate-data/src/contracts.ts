import { faker } from '@faker-js/faker';

import { generateShortId } from '@metaboost/helpers';

const CRUD_MASK_VALUES = [0, 1, 2, 3, 6, 7, 10, 11, 14, 15];

export function makeNamespacedValue(namespace: string, value: string): string {
  return `${namespace}-${value}`;
}

export function randomShortId(): string {
  return generateShortId();
}

export function randomCrudMask(): number {
  return faker.helpers.arrayElement(CRUD_MASK_VALUES);
}

export function assertCrudMask(label: string, value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > 15) {
    throw new Error(`${label} must be an integer between 0 and 15, got: ${value}`);
  }
}

export function assertPositiveInteger(label: string, value: number): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive integer, got: ${value}`);
  }
}

export function assertString(label: string, value: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must be non-empty`);
  }
}
