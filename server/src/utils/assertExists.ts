import { NotFoundError } from '../errors/index.js';

/**
 * Queries `delegate.findUnique({ where: { id } })` and returns the record.
 * Throws NotFoundError with `<entityName> not found` if the result is null.
 *
 * T is inferred from the delegate's return type so the caller receives
 * a fully-typed, non-null record without any `any`.
 */
export async function assertExists<T>(
  delegate: { findUnique: (args: { where: { id: string } }) => Promise<T | null> },
  id: string,
  entityName: string,
): Promise<T> {
  const record = await delegate.findUnique({ where: { id } });
  if (record === null) throw new NotFoundError(`${entityName} not found`);
  return record;
}
