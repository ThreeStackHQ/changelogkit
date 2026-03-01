import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
let _db: ReturnType<typeof drizzle> | null = null;
export function getDb() {
  if (!_db) { const sql = postgres(process.env.DATABASE_URL!, { max: 10 }); _db = drizzle(sql, { schema }); }
  return _db;
}
export const db = new Proxy({} as ReturnType<typeof getDb>, { get(_, p) { return getDb()[p as keyof ReturnType<typeof getDb>]; } });
