# Regras de negócio: perfis, compartilhamento, menores e alertas

Análise feita antes das mudanças (outubro de 2026) e o que foi implementado em seguida. Nada aqui declara conformidade com a
LGPD: os itens que dependem de validação jurídica ou clínica estão marcados como **pendentes**.

## 1. Como funciona hoje (antes desta versão)

**Perfis e papéis**

| Papel | Como existe no sistema | O que pode fazer |
| --- | --- | --- |
| Pessoa acompanhada (titular) | Toda conta (`users` + `profiles`). Os registros têm `user_id` e toda consulta filtra pela sessão. | Tudo sobre os próprios dados; convida e revoga familiares. |
| Responsável legal | Não é um papel guardado. É deduzido de `guardian_requests` confirmado (`confirmed_by`) + vínculo aceito em `family_members`. | Lê todos os módulos do menor e edita o plano de acompanhamento (`canManagePlan`) enquanto o titular tiver menos de 18 anos. |
| Acompanhante (familiar) | Linha em `family_members` (convite por e-mail, token só como hash, 7 dias) + módulos em `sharing_permissions`. | Somente leitura dos módulos liberados em `/familia/[id]`; baixa o PDF se "Relatórios" estiver liberado. |
| Profissional de saúde | `professional_profiles` com conferência manual pelo administrador. | Nenhum acesso a dados de pacientes. O médico vê dados só pelo link temporário `/r/[token]`. |
| Administrador | `ADMIN_USER_IDS` (proprietário) ou `users.admin_since`, sempre com 2FA. | Gerencia contas; nunca vê registros de saúde. |

**Fluxos já implementados e corretos**

- Convite aceito só pelo próprio convidado, logado, com o mesmo e-mail; convite expira em 7 dias e é de uso único.
- Revogação pelo titular a qualquer momento (também cancela convite pendente).
- O acompanhante não tem nenhuma ação de escrita: as ações de glicemia, refeições, medicamentos, insulina, metas e alertas
  sempre usam o `user.id` da sessão.
- Acesso por conhecer e-mail ou id não funciona: `/familia/[id]`, `/api/relatorio?owner=` e `/api/foto/[id]` conferem o vínculo
  no servidor e respondem 404.
- Menor de 18 anos só usa o app depois da confirmação de um responsável (link ao e-mail informado, conta própria, e-mail
  confirmado, declaração de maioridade e responsabilidade).
- "Não tenho diabetes" esconde insulina, alertas e controles do plano sem apagar o histórico.
- Assistente por regras fixas: sem IA generativa, sem acesso aos dados da pessoa, recusa dose e assuntos fora do tema,
  orienta emergência (SAMU 192), não guarda conversa.
- Nenhuma cobrança, plano pago ou integração de pagamento.

## 2. Problemas encontrados

1. **Sem histórico de auditoria do compartilhamento.** Só as visualizações ficam em `access_logs`; convites, aceites,
   mudanças de permissão e revogações não ficam registrados.
2. **Limite fixo de 10 familiares no código.** O pedido é até 2 por padrão, ajustável pelo administrador sem mexer no código.
3. **Mudar permissões derruba o acesso.** A única forma de mudar módulos é reconvidar, o que volta o vínculo a "pendente".
4. **O PDF do acompanhante ignorava os módulos.** Quem tinha só "Relatórios" recebia refeições, medicamentos e insulina no PDF.
5. **Aceite de convite sem e-mail confirmado.** O fluxo do responsável exige; o do acompanhante não.
6. **Menor administra o próprio compartilhamento sozinho.** O menor podia convidar terceiros e revogar o responsável; o
   responsável não via nem revogava os acessos do menor.
7. **Responsável não é identificado no vínculo**, o que facilita tratar qualquer familiar como responsável no futuro.
8. **E-mails de alerta expõem dados na tela bloqueada.** Assunto e pré-visualização traziam nome e valor da glicemia.
9. **Sem regra de maioridade.** Ao completar 18 anos o responsável perdia a edição em silêncio e mantinha a leitura, sem
   revisão pelo titular.
10. **Visão do acompanhante sem contexto de tempo.** Não mostrava quando o dado foi registrado, não sinalizava dado antigo e
    não mostrava os avisos fora da faixa; a troca entre perfis era pouco explícita.
11. **Textos de alerta incompletos.** Faltava dizer que é um aviso para conferir a medição e que avisos podem atrasar ou não
    chegar e não substituem vigilância ou emergência.
12. **Alertas para familiares** iam também para conta de familiar suspensa.
13. **Gratuidade não registrada** em nenhum lugar do código.
14. **Sem aviso de falta de conexão** no app.

## 3. Riscos para dados e usuários atuais

- **Titulares com mais de 2 acompanhantes**: o novo limite vale só para convites novos; nenhum vínculo existente é removido.
- **Menores que já convidaram familiares**: os vínculos continuam; daqui em diante convites novos de um menor passam pelo responsável.
- **E-mails de alerta mais discretos por padrão**: quem já recebia alertas passa a receber um aviso sem valor; pode voltar a
  ver o valor no Perfil. É uma mudança perceptível, escolhida a favor da privacidade.
- **Aceite exigindo e-mail confirmado** (só quando o envio de e-mail está configurado): convidados com e-mail ainda não
  confirmado precisam confirmar antes de aceitar.
- **Migrações**: só adicionam tabelas e colunas e trocam duas `CHECK` por versões mais amplas. Nada é apagado; o código
  antigo continua funcionando com o banco novo, então dá para voltar o deploy sem desfazer a migração.

## 4. Migração proposta e aplicada (`0017`)

| Mudança | Compatibilidade |
| --- | --- |
| `family_members.role` (`companion`/`guardian`, padrão `companion`) | Preenchida para responsáveis já confirmados a partir de `guardian_requests`. |
| `family_members.revoked_at` | Nula nos registros existentes. |
| Tabela `sharing_events` (auditoria do compartilhamento, sem dado clínico) | Nova, vazia. |
| Tabela `app_settings` com `max_companions = 2` | Nova; o código usa 2 se a linha não existir. |
| `profiles.notification_details` (padrão `false`) e `profiles.majority_reviewed_at` | Colunas novas com padrão. |
| `consent_logs.kind` aceita `majority_review`; `admin_audit_logs.action` aceita `setting_update` | `CHECK` ampliada, valores antigos continuam válidos. |

## 5. Regras implementadas nesta versão

Ver a seção "Entrega" do pull request e os testes em `src/lib/sharing/*.test.ts` e `src/test/sharing.integration.test.ts`.

## 6. Pendências (dependem de decisão jurídica, clínica ou de produto)

- **Validação jurídica** da base legal (art. 11 e art. 14 da LGPD), do texto de consentimento do responsável, da política de
  privacidade e dos termos. O app comprova controle do e-mail do responsável, **não parentesco nem guarda**.
- **Perfil gerenciado sem conta própria** (criança pequena sem e-mail): exige separar "perfil" de "conta" no banco. Não feito.
- **Responsável editar registros do menor**: não existe necessidade atual no app; se surgir, deve ser permissão separada,
  concedida só pelo responsável legal, sem misturar com "visualizar".
- **Adolescente revogar o responsável**: bloqueado enquanto menor (só pelo suporte). A regra precisa de validação jurídica.
- **Retenção dos registros de auditoria** após exclusão da conta: hoje são apagados junto (cascade).
- **Link do médico** (`/r/[token]`) é um link sem conta, válido por 1, 7 ou 30 dias e revogável. Mantido por ser funcionalidade
  existente; avalie se deve continuar ou ter prazo menor.
- **Textos de alertas e do assistente** precisam de revisão por profissional de saúde.
