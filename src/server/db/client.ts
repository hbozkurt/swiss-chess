import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';

export type Db = ReturnType<typeof drizzle<typeof schema>>;
/** A transaction handle, as passed into `db.transaction((tx) => ...)`. */
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
/** What repository functions accept: the top-level `db`, or a `tx` from an in-flight transaction. */
export type DbOrTx = Db | Tx;

export function createDb(sqlitePath: string): Db {
  const sqlite = new Database(sqlitePath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  return drizzle(sqlite, { schema });
}

export function migrateDb(db: Db): void {
  migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle/migrations') });
}

let singleton: Db | null = null;

function getSingleton(): Db {
  if (!singleton) {
    singleton = createDb(process.env.DATABASE_PATH ?? './data/swiss-chess.db');
    // Applying migrations is idempotent (drizzle tracks what's already run), so
    // it's safe to do this unconditionally on first use — this is a
    // single-process local tool, not a multi-instance deployment.
    migrateDb(singleton);
  }
  return singleton;
}

// Lazy: merely importing this module (e.g. for `createDb`/`migrateDb` in
// tests, which use their own in-memory instance via `createTestDb`) must not
// open or migrate the real on-disk database as a side effect — only actually
// using `db` should. Vitest can load this module from multiple parallel
// workers; eagerly opening the same file from each one causes `SQLITE_BUSY`.
export const db: Db = new Proxy({} as Db, {
  get(_target, prop, _receiver) {
    const real = getSingleton();
    const value = Reflect.get(real as object, prop, real);
    return typeof value === 'function' ? value.bind(real) : value;
  },
});
