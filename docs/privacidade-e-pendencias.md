# Privacidade, segurança e pendências

Este documento lista o que o código faz e o que **depende de validação jurídica, política de privacidade ou
processo organizacional**. Implementar controles técnicos não significa conformidade completa com a LGPD.

## Controles técnicos implementados

- Autorização no servidor: `requireUser()` (sessão + conta não suspensa), `requireAdmin()` (lista `ADMIN_USER_IDS` **e
  2FA ligado**), `getAccessibleModules()` para familiares. Toda consulta filtra pelo `userId` da sessão.
- Familiares: vínculo explícito por convite (token só como hash), permissões por módulo, **somente leitura**, revogação
  pelo titular. Cada visita ao acompanhamento e cada download de relatório ficam em `access_logs`; o titular vê em
  *Compartilhar com familiar → Quem acessou meus dados*.
- Foto de perfil: validada pelo conteúdo real (JPG/PNG/WebP, até 512 KB), guardada no banco e servida só por
  `/api/foto/[userId]` autenticada (titular ou familiar com vínculo), com `no-store`, `nosniff` e CSP restritiva.
- Exportação: `/api/exportar` entrega apenas os dados do usuário da sessão (JSON completo; CSV de glicemias com
  neutralização de fórmulas de planilha).
- Consentimentos: `consent_logs` (LGPD no cadastro; ciência do responsável legal para menores de 18 anos).
- Solicitações de suporte/privacidade/exclusão: `support_requests`, tratadas em `/admin/solicitacoes` com auditoria.
- Auditoria administrativa: `admin_audit_logs` (suspender, reativar, excluir, atualizar solicitação, revogar vínculo).
  O painel mostra só contagens e metadados; **não existe acesso do administrador a medições ou conversas**
  (nem "acesso excepcional"): se um dia for necessário, deve ter motivo obrigatório, prazo e auditoria.
- Assistente (`/assistente`): regras fixas, sem IA generativa, sem acesso a dados da pessoa, **sem gravar conversas** e
  sem registrar o conteúdo em log. Limite de 15 perguntas por minuto por usuário.
- Perfil profissional: sempre "não verificado"; não concede acesso a dados.

## Pendências e decisões que dependem de validação externa

1. **Política de Privacidade e Termos de Uso** revisados por advogado; base legal do tratamento de dados de saúde
   (dado sensível, art. 11 da LGPD); definição do encarregado (DPO) e canal oficial de titulares.
2. **Menores de idade**: o app registra a ciência do responsável por uma caixa de seleção. A LGPD (art. 14) exige
   consentimento específico de um dos pais ou responsável; **não há verificação da identidade nem do parentesco**.
   Um processo de verificação precisa ser definido com apoio jurídico.
3. **Retenção e exclusão**: hoje a exclusão da conta apaga tudo (cascade); `access_logs`, `consent_logs` e
   `support_requests` do usuário também são apagados. Defina prazos legais de guarda (ex.: logs de acesso) e, se
   preciso, preserve o mínimo exigido em outro local.
4. **Perfil profissional**: validar o registro (CRM, CRN etc.) exige consulta aos conselhos profissionais (ou
   documento enviado e conferido por pessoa) e fluxo de aprovação no painel. Enquanto não existir, o selo não pode
   ser exibido. A coluna `verification_status` só aceita `unverified`; ao criar o processo, altere o `check`.
5. **Criptografia em repouso**: depende do provedor (Neon cifra o disco). Dados de saúde não têm criptografia por
   campo na aplicação.
6. **Notificações**: o app não promete entrega imediata nem é serviço de emergência. Alertas por e-mail dependem do
   Resend, e os lembretes dependem de um agendador externo (`CRON_SECRET`).
7. **Unidade mmol/L**: o app trabalha apenas em mg/dL. Suporte a mmol/L exige alterar entrada, exibição, gráficos e
   alertas com testes clínicos de conversão; não foi feito.
8. **Limites clínicos**: o app não traz nenhum limite pré-definido. Faixas e metas são sempre digitadas pela pessoa.
9. **Assistente**: a tabela de carboidratos (`src/lib/assistant/foods.ts`) traz valores médios aproximados e deve ser
   revisada por nutricionista antes de ampliada. Textos educativos (`engine.ts`) também merecem revisão clínica.
10. **CSP completa** e proteção extra de cabeçalhos: não foi adicionada (exige nonces no Next); os cabeçalhos básicos
    já existem em `next.config.ts`.
11. **Testes de isolamento com banco**: `src/test/isolation.integration.test.ts` só roda com `TEST_DATABASE_URL`.

## Atualização: responsável de menores, profissionais e política

- **Responsável legal (migração 0014):** o menor de 18 anos só usa o app depois que o responsável confirma. O link vai ao e-mail
  informado (token só como hash, 7 dias); o responsável precisa de **conta própria, com o mesmo e-mail já confirmado**, declarar
  ser maior de idade e responsável. Isso comprova controle do e-mail, **não parentesco**. Exige o Resend configurado. Limites:
  um menor pode informar uma data de nascimento adulta no cadastro; a verificação documental (ex.: gov.br, documento) continua
  sendo uma decisão jurídica/organizacional. O responsável vira familiar com leitura de todos os módulos.
- **Registro profissional:** conferência manual por administrador em `/admin/profissionais`, no portal oficial do conselho, com
  caixa de confirmação e auditoria; ninguém verifica o próprio registro; alterar o registro volta a "aguardando". Confira os
  endereços de `src/lib/privacy/professional.ts` (CFM é a busca de médicos; os demais apontam para a página do conselho).
- **Política de Privacidade:** minuta pública em `/politica-de-privacidade`, com campos `[ ]` a preencher e revisão jurídica.
