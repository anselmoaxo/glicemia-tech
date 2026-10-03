// Só para testes: drizzle com node-postgres num Postgres local (ex.: `postgres://postgres@localhost:5432/teste`).
// O app usa o driver HTTP do Neon, que não fala com um Postgres comum. `batch` aqui roda em sequência (sem a
// atomicidade do Neon), o que basta para conferir regras e permissões.
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";

export function createLocalDb(url: string) {
  const db = drizzle(new Pool({ connectionString: url, max: 4 }), { schema });
  return Object.assign(db, {
    async batch(queries: readonly PromiseLike<unknown>[]) {
      const results: unknown[] = [];
      for (const q of queries) results.push(await q);
      return results;
    },
  });
}
