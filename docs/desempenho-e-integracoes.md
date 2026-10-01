# Desempenho, e-mails, n8n e acompanhamento (migração 0015)

## 1. Desempenho

**Medido (build de produção, tela Início):** JS inicial 9 chunks, ~500 KB para ~145 KB (sem compressão). O Recharts (~360 KB) agora
é baixado só quando o gráfico aparece, com aviso "Carregando gráfico..." (`glucose-chart-lazy.tsx`, também no relatório).

**Por análise do código (idas ao banco por navegação):**

| Item | Antes | Depois |
| --- | --- | --- |
| Perfil no layout + página | 4 consultas (incluía um INSERT a cada navegação, duas vezes) | 1 consulta, em cache só durante a requisição |
| Fuso do perfil | 1 consulta por chamada | 1 por requisição |

Não medi tempo em milissegundos: precisa de um banco de teste e de usuários reais. O custo de cada ida ao banco depende da
**região**: o Neon e a função da Vercel devem estar na mesma região (ex.: `gru1`/São Paulo ou `iad1` junto do Neon). Isso é
configuração do projeto e do plano, não do código. Itens verificados e mantidos: índice `(user_id, measured_at desc)` nas
medições, paginação por página (20), série do gráfico limitada a 500 pontos, agregações no banco.

**Cache:** nenhum dado de saúde é guardado em cache compartilhado. O cache usado é o `cache()` do React, que vale só durante uma
requisição de um usuário.

**Não feito (de propósito):** cookie cache de sessão do Better Auth (economiza uma consulta, mas atrasa o efeito de suspender
uma conta). Pode ser ligado depois se aceitarem esse atraso.

## 2. Acompanhamento (`/acompanhamento`)

- Dias e horários em que a pessoa costuma medir, medições previstas por dia, tolerância para lembrar, acompanhamento de
  medicamentos/insulina (horários vêm de *Medicamentos*, conforme a prescrição), canais e autorização de familiares.
  **Nenhum valor vem preenchido** e o app não sugere frequência, dose nem calcula insulina.
- Perfil marcado como **"Não tenho diabetes"**: os controles de diabetes ficam ocultos (acompanhamento, alertas, insulina) e o
  que for salvo é zerado, a menos que a pessoa ligue o "acompanhamento específico".
- **Quem edita:** a própria pessoa, ou o **responsável legal confirmado** de um menor (`/familia/[id]/configuracoes`), com
  registro em "Quem acessou meus dados". Familiar comum e administrador nunca editam (conferido no servidor, em `canManagePlan`).
- **Verificações** (`runPlanChecks`, chamado por `/api/cron/lembretes`): a falta de registro só gera aviso depois do horário
  **mais a tolerância**, até 6 h depois, e uma única vez por ocorrência (chave única). Uma medição até 60 min antes do horário
  já conta. Estados mostrados: *lembrete enviado*, *medição registrada*, *medicamento registrado como tomado/não tomado* e
  *sem confirmação*; falta de confirmação **não é tratada como descumprimento**.
- Limite: o aviso a familiares por medição esquecida usa quem tem acesso à glicemia; avisos de medicamento não vão a familiares.
- Para as verificações rodarem é preciso o agendador chamando `/api/cron/lembretes` a cada 10–15 min (veja o README).

## 3. Webhook do n8n (`/acompanhamento/n8n`)

Variáveis: nenhuma nova (URL e segredo ficam cifrados no banco com chave derivada de `BETTER_AUTH_SECRET`; trocar esse segredo
exige salvar a URL de novo).

- Só dispara para os eventos habilitados, depois de **autorização explícita** do dono (texto na tela diz o que é enviado).
- **O que é enviado:** `schema`, `id` do evento, `type`, `occurredAt` e `profileRef` (código anônimo). Nunca nome, e-mail,
  valores, diagnóstico nem alimentação.
- **Segurança:** só `https`, portas 443/5678, sem IP nem domínio interno; o DNS é validado ao salvar **e a cada conexão**
  (protege contra SSRF e DNS rebinding); sem redirecionamentos; timeout de 5 s; segredo mostrado só uma vez; assinatura
  `X-Glicose-Signature: v1=HMAC-SHA256("{timestamp}.{corpo}")`.
- **Confiabilidade:** envio fora do caminho do registro (a medição salva mesmo com o n8n fora do ar); até 5 tentativas com
  espera de 1 min, 5 min, 30 min, 2 h e 6 h; reserva da tentativa evita envio simultâneo; reenvio manual usa o **mesmo `id`**
  (o n8n deve ignorar ids repetidos); histórico com data, evento, status, tentativas e erro resumido.
- Evento de teste sem dados de saúde, limitado a 5 por hora.
- Limite: a integração é do próprio perfil (um responsável não configura o webhook de um menor).

## 4. E-mails e histórico

Situações em que o app envia e-mail (tela *E-mails enviados* e `categoryLabel`):

| Categoria | Obrigatório? |
| --- | --- |
| Confirmação de cadastro, recuperação de senha, **aviso de senha alterada**, código de 2 etapas, convite, responsável legal | Sim |
| Medição fora da faixa pessoal, lembrete para medir, medição prevista sem registro, medicamento sem confirmação | Não (a pessoa liga/desliga) |

O histórico guarda tipo, motivo, **destinatário mascarado** (`a***@dominio.com`), status, horários e id do provedor, **sem o
conteúdo**. "Enviado" = o Resend aceitou; **"Entregue" só quando o Resend informa**. Para receber entregue/rejeitado/atrasado
automaticamente: Resend > Webhooks > endpoint `https://SEU-DOMINIO/api/webhooks/resend`, com os eventos de e-mail, e a
variável **`RESEND_WEBHOOK_SECRET`** (assinatura conferida; sem a variável a rota responde 503). O botão "Atualizar status"
consulta o Resend para envios de até 3 dias. Envios com o mesmo `idempotencyKey` não duplicam. Visão técnica do administrador
em `/admin/emails` (só metadados).

## 5. Acesso de familiares

Somente leitura, aplicado no servidor: nenhuma ação de escrita aceita id de outra pessoa (todas usam o usuário da sessão); a
leitura passa por `getAccessibleModules`. Exceção única e explícita: o responsável legal confirmado edita o plano de acompanhamento
do menor, com registro.

## Como testar

1. `npm run db:migrate` (migração `0015`). 2. Em Perfil, marque "Não tenho diabetes": `/mais` perde Insulina e Alertas, e
`/acompanhamento` mostra só o interruptor específico. 3. Marque "Acompanhamento de diabetes", defina um horário e tolerância,
chame `GET /api/cron/lembretes` (com `CRON_SECRET`) depois do horário: aparece "Sem confirmação" no histórico, uma vez só.
4. `/acompanhamento/n8n`: salve uma URL pública, aceite a autorização e envie o teste. 5. `TEST_DATABASE_URL=... npm test` roda os
testes de isolamento e de não duplicação.
