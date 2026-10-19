import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite, type Transaction } from '@electric-sql/pglite';

const ROOT = join(import.meta.dirname, '..', '..');

/** Tạo một Postgres nhúng, nạp shim Supabase và chạy mọi migration theo thứ tự. */
export async function createTestDb(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(readFileSync(join(import.meta.dirname, 'supabase-shim.sql'), 'utf8'));
  const dir = join(ROOT, 'supabase', 'migrations');
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(join(dir, file), 'utf8'));
  }
  return db;
}

type Who = { role: 'anon' } | { role: 'authenticated'; userId: string } | { role: 'service_role' };

/**
 * Chạy truy vấn với vai trò Postgres giống PostgREST của Supabase
 * (SET ROLE + request.jwt.claims), trong giao dịch luôn được hoàn tác.
 */
export async function as<T>(db: PGlite, who: Who, fn: (tx: Transaction) => Promise<T>): Promise<T> {
  let result: T | undefined;
  let error: unknown;
  await db
    .transaction(async (tx) => {
      const claims =
        who.role === 'authenticated'
          ? { sub: who.userId, role: 'authenticated' }
          : { role: who.role };
      await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(claims)]);
      await tx.exec(`set local role ${who.role}`);
      try {
        result = await fn(tx);
      } catch (e) {
        error = e;
      }
      await tx.rollback();
    })
    .catch(() => {});
  if (error) throw error;
  return result as T;
}

export const anon = { role: 'anon' } as const;
export const service = { role: 'service_role' } as const;
export const user = (userId: string) => ({ role: 'authenticated', userId }) as const;
