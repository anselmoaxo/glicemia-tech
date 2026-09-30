import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Database = ReturnType<typeof createDb>;

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada");
  return drizzle(neon(url), { schema });
}

// Conexão criada sob demanda: o build não exige banco configurado.
let instance: Database | undefined;

export const db = new Proxy({} as Database, {
  get(_, prop) {
    instance ??= createDb();
    const value = Reflect.get(instance, prop);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
