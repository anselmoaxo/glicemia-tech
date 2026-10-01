import { twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// A segunda etapa do login é tratada na própria tela (sem redirecionar para outra página).
export const authClient = createAuthClient({ plugins: [twoFactorClient()] });
