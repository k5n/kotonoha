// Mock implementation of @tauri-apps/plugin-sql for browser mode
// Uses sql.js for SQLite simulation

import initSqlJs from 'sql.js';

let sqlJs: initSqlJs.SqlJsStatic | null = null;

async function initializeSqlJs(): Promise<void> {
  if (sqlJs) return;
  sqlJs = await initSqlJs({
    locateFile: (file) => `https://sql.js.org/dist/${file}`,
  });
}

const ERROR_CODES = {
  SQLITE_ERROR: 'SQLITE_ERROR',
} as const;

class SqliteError extends Error {
  constructor(
    message: string,
    public readonly code: string = ERROR_CODES.SQLITE_ERROR
  ) {
    super(message);
    this.name = 'SqliteError';
  }
}

interface QueryResult {
  lastInsertId?: number;
  rowsAffected: number;
}

class Database {
  private static instance: Database | null = null;
  private static db: initSqlJs.Database | null = null;
  private static initialized = false;

  constructor(_path: string) {
    if (Database.instance) return Database.instance;
    Database.instance = this;
    // path is ignored in mock, but kept for API compatibility
  }

  public static async ensureInitialized(): Promise<void> {
    if (Database.initialized) return;
    await initializeSqlJs();
    if (!sqlJs) throw new Error('sql.js not initialized');

    Database.db = new sqlJs.Database();
    Database.db.run(INITIAL_SCHEMA);
    Database.initialized = true;
  }

  private handleError(error: unknown): never {
    const message = error instanceof Error ? error.message : String(error);
    throw new SqliteError(message);
  }

  async select<T>(sql: string, bindValues?: initSqlJs.BindParams): Promise<T> {
    await Database.ensureInitialized();
    if (!Database.db) throw new SqliteError('Database not initialized');

    try {
      const stmt = Database.db.prepare(sql);
      if (bindValues) {
        stmt.bind(bindValues);
      }
      const results: initSqlJs.ParamsObject[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();

      return results as T;
    } catch (error) {
      this.handleError(error);
    }
  }

  async execute(sql: string, bindValues?: initSqlJs.BindParams): Promise<QueryResult> {
    await Database.ensureInitialized();
    if (!Database.db) throw new SqliteError('Database not initialized');

    try {
      if (bindValues) {
        Database.db.run(sql, bindValues);
      } else {
        Database.db.run(sql);
      }

      const execRes = Database.db.exec('SELECT last_insert_rowid() as id');
      const lastInsertId = execRes?.[0]?.values?.[0]?.[0] ? (execRes[0].values[0][0] as number) : 0;

      return { lastInsertId, rowsAffected: 1 };
    } catch (error) {
      this.handleError(error);
    }
  }

  async close(): Promise<void> {
    await Database.ensureInitialized();
    if (!Database.initialized || !Database.db) return;

    try {
      Database.db.close();
    } catch {
      // Ignore close errors
    }
  }
}

const INITIAL_SCHEMA = `
CREATE TABLE episode_groups (
    id TEXT PRIMARY KEY,
    parent_group_id TEXT,
    content TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    group_type TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT DEFAULT NULL
);
CREATE TABLE episodes (
    id TEXT PRIMARY KEY,
    episode_group_id TEXT NOT NULL,
    content TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT DEFAULT NULL
);
CREATE TABLE subtitle_lines (
    id TEXT PRIMARY KEY,
    episode_id TEXT NOT NULL,
    sequence_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT DEFAULT NULL
);
CREATE TABLE sentence_cards (
    id TEXT PRIMARY KEY,
    subtitle_line_id TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT DEFAULT NULL
);
`;

export default Database;
