import { Pool } from "pg";

const globalForDatabase = globalThis as unknown as { publicomPool?: Pool };

export const database = globalForDatabase.publicomPool ?? new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") globalForDatabase.publicomPool = database;
