import camelCase from 'lodash/camelCase';
import isPlainObject from 'lodash/isPlainObject';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function snakeToCamelDeep<T>(input: any): T {
  if (Array.isArray(input)) return input.map(snakeToCamelDeep) as T;
  if (isPlainObject(input)) {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [camelCase(key), snakeToCamelDeep(value)]),
    ) as T;
  }

  return input;
}
