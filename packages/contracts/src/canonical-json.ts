/**
 * Byte-stable canonical JSON serialization for Quote/Order snapshots
 * (§5.8: "every quote/order byte-stable and reconciling to the franc").
 *
 * Rules: object keys sorted lexicographically (code-unit order), no
 * whitespace, `undefined` object properties omitted, and any value JSON
 * cannot represent faithfully (NaN, ±Infinity, bigint, function, undefined
 * inside arrays) is a hard error — a snapshot that silently degrades is not
 * byte-stable.
 */
export function canonicalJsonStringify(value: unknown): string {
  return serialize(value, '$');
}

function serialize(value: unknown, path: string): string {
  if (value === null) return 'null';
  switch (typeof value) {
    case 'string':
      return JSON.stringify(value);
    case 'boolean':
      return value ? 'true' : 'false';
    case 'number':
      if (!Number.isFinite(value)) {
        throw new TypeError(`canonical JSON: non-finite number at ${path}`);
      }
      return JSON.stringify(value);
    case 'object':
      break;
    default:
      throw new TypeError(`canonical JSON: unsupported ${typeof value} at ${path}`);
  }
  if (Array.isArray(value)) {
    const items = value.map((item, i) => {
      if (item === undefined) {
        throw new TypeError(`canonical JSON: undefined array element at ${path}[${i}]`);
      }
      return serialize(item, `${path}[${i}]`);
    });
    return `[${items.join(',')}]`;
  }
  if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
    throw new TypeError(`canonical JSON: non-plain object at ${path}`);
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record)
    .filter((k) => record[k] !== undefined)
    .sort();
  const entries = keys.map((k) => `${JSON.stringify(k)}:${serialize(record[k], `${path}.${k}`)}`);
  return `{${entries.join(',')}}`;
}
