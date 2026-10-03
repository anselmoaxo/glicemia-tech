-- Repete o preenchimento da 0017 (idempotente): o Preview da Vercel usa o mesmo banco da produção, então a 0017 pode ter
-- sido aplicada antes desta versão ir ao ar, e responsáveis confirmados nesse intervalo pelo código antigo ficariam sem papel.
UPDATE "family_members" AS fm SET "role" = 'guardian' FROM "guardian_requests" AS gr WHERE gr."minor_id" = fm."owner_id" AND gr."confirmed_by" = fm."member_user_id" AND gr."confirmed_at" IS NOT NULL AND fm."role" <> 'guardian';
