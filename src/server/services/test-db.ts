import { createDb, migrateDb, type Db } from '../db/client';

/** An in-memory SQLite database with migrations applied, for integration tests. */
export function createTestDb(): Db {
  const db = createDb(':memory:');
  migrateDb(db);
  return db;
}
