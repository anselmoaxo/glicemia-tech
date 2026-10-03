// Modelos dos e-mails do app. Puro (sem Resend), para poder testar o conteúdo.
//
// Regras do layout (e-mail é um HTML antigo: tabelas, estilos embutidos e nada de recursos modernos de CSS):
//  - largura máxima de 560 px, que encolhe sozinha no celular;
//  - texto grande (17–18 px) e um único botão grande por mensagem;
//  - o endereço do botão aparece por extenso, para quem não consegue tocar nele;
//  - versão em texto puro junto (acessibilidade e entrega) e suporte ao modo escuro.
export type EmailContent = { subject: string; html: string; text: string };

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const INK = "#4f46e5";
const FONT = "'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";

/** Só aceita endereços http(s); qualquer outra coisa vira o endereço do app. */
const safeUrl = (url: string, fallback: string) => (/^https?:\/\//i.test(url) ? url : fallback);

const first = (name: string) => name.trim().split(/\s+/)[0] ?? "";

type Box = { html: string; tone?: "info" | "alert" };

type Shell = {
  preheader: string;
  title: string;
  /** parágrafos já em HTML (use esc() no que vier de fora) */
  intro: string[];
  box?: Box;
  button?: { label: string; url: string };
  /** frases de segurança/validade, em destaque no quadro de aviso */
  notes: string[];
  appUrl: string;
};

function shell(p: Shell): string {
  const paragraphs = p.intro
    .map((t) => `<p class="txt" style="margin:0 0 16px;font-size:18px;line-height:1.6;color:#0f172a">${t}</p>`)
    .join("");

  const box = p.box
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px"><tr><td class="box" style="background:${
        p.box.tone === "alert" ? "#fbe6dc" : "#f8fafc"
      };border-radius:14px;padding:18px 20px;text-align:center;font-family:${FONT}">${p.box.html}</td></tr></table>`
    : "";

  const button = p.button
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 12px"><tr><td align="center">
<a class="btn" href="${esc(p.button.url)}" style="display:block;background:${INK};color:#ffffff;text-decoration:none;font-size:19px;font-weight:700;line-height:1.2;padding:18px 24px;border-radius:14px;text-align:center;font-family:${FONT}">${esc(p.button.label)}</a>
</td></tr></table>
<p class="muted" style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#475569">Se o botão não abrir, copie este endereço e cole no navegador:<br><span style="word-break:break-all"><a href="${esc(p.button.url)}" class="muted" style="color:#475569">${esc(p.button.url)}</a></span></p>`
    : "";

  const notes = p.notes.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 4px"><tr><td class="box" style="background:#f8fafc;border-left:4px solid ${INK};border-radius:8px;padding:14px 16px;font-family:${FONT}">${p.notes
        .map((n, i) => `<p class="txt" style="margin:${i === 0 ? 0 : 8}px 0 0;font-size:15px;line-height:1.5;color:#0f172a">${n}</p>`)
        .join("")}</td></tr></table>`
    : "";

  return `<!doctype html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(p.title)}</title>
<style>
  @media (prefers-color-scheme: dark) {
    .page { background:#0f172a !important; }
    .card { background:#1e293b !important; }
    .txt { color:#f8fafc !important; }
    .muted, .muted a { color:#94a3b8 !important; }
    .box { background:#312e81 !important; }
    .btn { background:#c7d2fe !important; color:#1e1b4b !important; }
  }
  @media only screen and (max-width:480px) {
    .pad { padding:24px 18px !important; }
    .title { font-size:24px !important; }
  }
</style>
</head>
<body class="page" style="margin:0;padding:0;background:#f8fafc;font-family:${FONT}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px">${esc(p.preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="page" style="background:#f8fafc">
<tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
    <tr><td style="background:${INK};border-radius:18px 18px 0 0;padding:18px 28px">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:10px;vertical-align:middle"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" width="36" height="36" style="width:36px;height:36px;background:#6366f1;border-radius:10px;font-size:20px;line-height:36px;text-align:center">&#128167;</td></tr></table></td>
        <td style="vertical-align:middle;font-family:${FONT};font-size:21px;font-weight:700;color:#ffffff;letter-spacing:-0.2px">Glicose Tech</td>
      </tr></table>
    </td></tr>
    <tr><td class="card pad" style="background:#ffffff;border-radius:0 0 18px 18px;padding:32px 30px;font-family:${FONT}">
      <h1 class="txt title" style="margin:0 0 18px;font-size:28px;line-height:1.2;color:#0f172a;letter-spacing:-0.3px">${esc(p.title)}</h1>
      ${paragraphs}${box}${button}${notes}
    </td></tr>
    <tr><td style="padding:18px 8px;text-align:center;font-family:${FONT}">
      <p class="muted" style="margin:0;font-size:13px;line-height:1.6;color:#475569">Glicose Tech · seu caderno de glicemia<br>Esta mensagem foi enviada automaticamente. Não é preciso responder.<br><a href="${esc(p.appUrl)}" class="muted" style="color:#475569">${esc(p.appUrl.replace(/^https?:\/\//, ""))}</a></p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

/** Versão em texto puro, no mesmo formato para todas as mensagens. */
function plain(parts: string[]) {
  return parts.filter(Boolean).join("\n\n") + "\n\n—\nGlicose Tech · seu caderno de glicemia\nMensagem automática: não é preciso responder.";
}

// ───────────────────────────── Confirmação de e-mail ─────────────────────────────
export function verificationEmail(p: { name: string; url: string; appUrl: string; hours?: number }): EmailContent {
  const hours = p.hours ?? 24;
  const url = safeUrl(p.url, p.appUrl);
  return {
    subject: "Confirme seu e-mail no Glicose Tech",
    html: shell({
      preheader: "Falta só um clique para ativar sua conta.",
      title: "Confirme seu e-mail",
      intro: [`Olá, ${esc(first(p.name))}! Falta só um passo para ativar sua conta: confirmar que este e-mail é seu.`],
      button: { label: "Confirmar meu e-mail", url },
      notes: [`O link vale por <strong>${hours} horas</strong>.`, "Se você não criou uma conta no Glicose Tech, ignore esta mensagem. Nada será feito."],
      appUrl: p.appUrl,
    }),
    text: plain([
      `Olá, ${first(p.name)}! Falta só um passo para ativar sua conta: confirmar que este e-mail é seu.`,
      `Confirmar meu e-mail: ${url}`,
      `O link vale por ${hours} horas. Se você não criou uma conta no Glicose Tech, ignore esta mensagem.`,
    ]),
  };
}

// ───────────────────────────── Redefinir senha ─────────────────────────────
export function resetPasswordEmail(p: { name: string; url: string; appUrl: string; minutes?: number }): EmailContent {
  const minutes = p.minutes ?? 60;
  const url = safeUrl(p.url, p.appUrl);
  return {
    subject: "Redefinir sua senha do Glicose Tech",
    html: shell({
      preheader: "Crie uma nova senha para a sua conta.",
      title: "Crie uma nova senha",
      intro: [`Olá, ${esc(first(p.name))}! Recebemos um pedido para criar uma nova senha para a sua conta.`],
      button: { label: "Criar nova senha", url },
      notes: [
        `O link vale por <strong>${minutes} minutos</strong> e só pode ser usado uma vez.`,
        "Se você não pediu isso, ignore esta mensagem: sua senha continua a mesma. Nunca compartilhe este link.",
      ],
      appUrl: p.appUrl,
    }),
    text: plain([
      `Olá, ${first(p.name)}! Recebemos um pedido para criar uma nova senha para a sua conta.`,
      `Criar nova senha: ${url}`,
      `O link vale por ${minutes} minutos e só pode ser usado uma vez. Se você não pediu isso, ignore esta mensagem: sua senha continua a mesma.`,
    ]),
  };
}

export function guardianEmail(p: { minorName: string; url: string; appUrl: string }): EmailContent {
  const url = safeUrl(p.url, p.appUrl);
  return {
    subject: `Confirme como responsável por ${p.minorName} no Glicose Tech`,
    html: shell({
      preheader: "Confirmação de responsável legal.",
      title: "Confirmação do responsável legal",
      intro: [
        `<strong>${esc(p.minorName)}</strong> é menor de 18 anos e indicou este e-mail como o do responsável legal para usar o Glicose Tech.`,
        "Se você é pai, mãe ou responsável legal e concorda, confirme abaixo. Você também passará a acompanhar os registros, somente para leitura.",
      ],
      button: { label: "Confirmar como responsável", url },
      notes: [
        "O link vale por <strong>7 dias</strong>. Para confirmar, entre ou crie uma conta usando <strong>este mesmo e-mail</strong>.",
        "Se você não reconhece este pedido, ignore a mensagem: nada será liberado.",
      ],
      appUrl: p.appUrl,
    }),
    text: plain([
      `${p.minorName} é menor de 18 anos e indicou este e-mail como o do responsável legal no Glicose Tech.`,
      `Para confirmar (entre com este mesmo e-mail): ${url}`,
      "O link vale por 7 dias. Se não reconhece o pedido, ignore.",
    ]),
  };
}

export function passwordChangedEmail(p: { name: string; appUrl: string }): EmailContent {
  return {
    subject: "Sua senha do Glicose Tech foi alterada",
    html: shell({
      preheader: "Aviso de segurança da conta.",
      title: "Senha alterada",
      intro: [
        `Olá, ${esc(first(p.name))}. A senha da sua conta acaba de ser alterada.`,
        "Se foi você, não precisa fazer nada. Se não reconhece essa alteração, redefina a senha agora e ative a verificação em duas etapas no Perfil.",
      ],
      button: { label: "Abrir o Glicose Tech", url: safeUrl(p.appUrl, p.appUrl) },
      notes: ["Este é um aviso de segurança obrigatório e não pode ser desativado."],
      appUrl: p.appUrl,
    }),
    text: plain([
      `Olá, ${first(p.name)}. A senha da sua conta acaba de ser alterada.`,
      "Se não foi você, redefina a senha agora e ative a verificação em duas etapas no Perfil.",
      p.appUrl,
    ]),
  };
}

// ───────────────────────────── Alerta de glicemia ─────────────────────────────
const SAFE_MESSAGE =
  "Aviso para conferir a medição e seguir a orientação recebida do seu profissional de saúde. A faixa foi configurada por você; o app não interpreta o valor nem recomenda doses ou conduta.";
const SAFE_MESSAGE_FAMILY =
  "Aviso para conferir com a pessoa e seguir a orientação recebida do profissional de saúde dela. A faixa foi configurada pela própria pessoa (ou pelo responsável); o app não interpreta o valor nem recomenda doses ou conduta.";
export const DELIVERY_NOTICE =
  "Avisos por e-mail podem atrasar ou não chegar e dependem do registro manual no app: não use o Glicose Tech como único meio de vigilância ou de emergência. Em caso de sinais graves, procure atendimento de emergência (SAMU 192).";
const WHY = "Você recebe este aviso porque os alertas por e-mail foram ativados. Dá para desligar ou mostrar menos detalhes no Perfil.";

/**
 * Aviso de medição fora da faixa. Por padrão (`details` falso) o assunto, a pré-visualização e o corpo NÃO trazem valor,
 * nome nem direção: o assunto e a pré-visualização aparecem na tela bloqueada do celular. Com `details` (escolha do
 * titular no Perfil) o e-mail mostra o valor.
 */
export function alertEmail(p: {
  value: number;
  direction: "low" | "high";
  appUrl: string;
  /** vazio = alerta para a própria pessoa; preenchido = alerta para um familiar */
  ownerName?: string;
  link: string;
  details?: boolean;
}): EmailContent {
  const above = p.direction === "high";
  const where = above ? "acima" : "abaixo";
  const family = Boolean(p.ownerName);
  const url = safeUrl(p.link, p.appUrl);
  const color = above ? "#b4431a" : "#3342b8";
  const button = { label: family ? "Ver os registros" : "Abrir o Glicose Tech", url };
  const notes = [esc(family ? SAFE_MESSAGE_FAMILY : SAFE_MESSAGE), esc(DELIVERY_NOTICE), WHY];

  if (!p.details) {
    const lead = family
      ? `Há um novo aviso de medição em um perfil que você acompanha. Abra o app para ver.`
      : `Há um novo aviso sobre uma medição registrada por você. Abra o app para ver.`;
    return {
      subject: "Novo aviso no Glicose Tech",
      html: shell({
        preheader: "Abra o app para ver o aviso.",
        title: "Novo aviso",
        intro: [esc(lead)],
        button,
        notes,
        appUrl: p.appUrl,
      }),
      text: plain([lead, `${button.label}: ${url}`, family ? SAFE_MESSAGE_FAMILY : SAFE_MESSAGE, DELIVERY_NOTICE, WHY]),
    };
  }

  const subject = family ? `Aviso de glicemia de ${p.ownerName}` : "Sua glicemia ficou fora da faixa";
  const lead = family
    ? `<strong>${esc(p.ownerName!)}</strong> registrou uma medição ${where} da faixa configurada.`
    : `Sua última medição ficou <strong>${where} da faixa</strong> que você configurou.`;

  return {
    subject,
    html: shell({
      preheader: family ? `${p.ownerName} registrou ${p.value} mg/dL, ${where} da faixa.` : `Sua medição foi ${p.value} mg/dL, ${where} da faixa.`,
      title: family ? "Aviso de glicemia" : "Glicemia fora da faixa",
      intro: [lead],
      box: {
        tone: "alert",
        html: `<p style="margin:0;font-size:46px;line-height:1.1;font-weight:700;color:${color};font-family:${FONT}">${p.value}<span style="font-size:20px;font-weight:400"> mg/dL</span></p><p style="margin:6px 0 0;font-size:17px;font-weight:600;color:${color};font-family:${FONT}">${above ? "Acima da faixa" : "Abaixo da faixa"}</p>`,
      },
      button,
      notes,
      appUrl: p.appUrl,
    }),
    text: plain([
      family ? `${p.ownerName} registrou uma medição ${where} da faixa configurada: ${p.value} mg/dL.` : `Sua última medição ficou ${where} da faixa que você configurou: ${p.value} mg/dL.`,
      family ? SAFE_MESSAGE_FAMILY : SAFE_MESSAGE,
      `${button.label}: ${url}`,
      DELIVERY_NOTICE,
      WHY,
    ]),
  };
}

// ───────────────────────────── Código de verificação em duas etapas ─────────────────────────────
export function twoFactorCodeEmail(p: { name: string; code: string; appUrl: string; minutes?: number }): EmailContent {
  const minutes = p.minutes ?? 3;
  return {
    subject: `Seu código de acesso: ${p.code}`,
    html: shell({
      preheader: `Seu código é ${p.code}. Vale por ${minutes} minutos.`,
      title: "Seu código de acesso",
      intro: [`Olá, ${esc(first(p.name))}! Use este código para concluir a entrada no Glicose Tech:`],
      box: {
        html: `<p style="margin:0;font-size:44px;line-height:1.1;font-weight:700;letter-spacing:10px;color:${INK};font-family:'Courier New',monospace" class="txt">${esc(p.code)}</p>`,
      },
      notes: [
        `O código vale por <strong>${minutes} minutos</strong> e só pode ser usado uma vez.`,
        "Se não foi você quem tentou entrar, ignore esta mensagem e troque sua senha. Nunca passe este código a ninguém.",
      ],
      appUrl: p.appUrl,
    }),
    text: plain([
      `Olá, ${first(p.name)}! Seu código de acesso ao Glicose Tech é: ${p.code}`,
      `Ele vale por ${minutes} minutos e só pode ser usado uma vez. Se não foi você quem tentou entrar, ignore esta mensagem e troque sua senha. Nunca passe este código a ninguém.`,
    ]),
  };
}

// ───────────────────────────── Lembrete para medir ─────────────────────────────
// Sem nenhum dado de saúde: só o convite para registrar.

const CONFERIR =
  "Este é um aviso para você conferir a informação. A falta de registro não significa que você não mediu ou não tomou: pode ser só que ainda não foi anotado. Siga o plano recebido do seu profissional de saúde.";

export function missedMeasureEmail(p: { appUrl: string; forFamily?: boolean }): EmailContent {
  const url = p.forFamily ? `${p.appUrl}/familia` : `${p.appUrl}/glicemia/nova`;
  const who = p.forFamily ? "da pessoa que você acompanha" : "da sua rotina";
  return {
    subject: "Aviso: medição prevista sem registro",
    html: shell({
      preheader: "Não encontramos o registro de uma medição prevista.",
      title: "Medição prevista sem registro",
      intro: [`Ainda não há registro de uma medição prevista ${who} no Glicose Tech.`, CONFERIR],
      button: { label: p.forFamily ? "Abrir o acompanhamento" : "Registrar agora", url },
      notes: [`Para mudar horários e avisos, abra <a href="${esc(p.appUrl)}/acompanhamento" style="color:${INK}">Configurações de acompanhamento</a>.`],
      appUrl: p.appUrl,
    }),
    text: plain([`Ainda não há registro de uma medição prevista ${who}.`, CONFERIR, url]),
  };
}

export function medUnconfirmedEmail(p: { appUrl: string }): EmailContent {
  const url = `${p.appUrl}/medicamentos`;
  return {
    subject: "Aviso: medicamento sem confirmação",
    html: shell({
      preheader: "Há um horário de medicamento sem resposta.",
      title: "Medicamento sem confirmação",
      intro: ["Um horário de medicamento ou insulina que você cadastrou ainda está sem resposta (tomou ou não tomou).", CONFERIR],
      button: { label: "Abrir medicamentos", url },
      notes: [`Para mudar os avisos, abra <a href="${esc(p.appUrl)}/acompanhamento" style="color:${INK}">Configurações de acompanhamento</a>.`],
      appUrl: p.appUrl,
    }),
    text: plain(["Um horário de medicamento ou insulina que você cadastrou está sem resposta.", CONFERIR, url]),
  };
}

export function reminderEmail(p: { appUrl: string }): EmailContent {
  const url = `${p.appUrl}/glicemia/nova`;
  const manage = `${p.appUrl}/alertas`;
  return {
    subject: "Lembrete: hora de registrar sua glicemia",
    html: shell({
      preheader: "Um lembrete que você agendou no Glicose Tech.",
      title: "Hora de registrar sua glicemia",
      intro: ["Este é o lembrete que você programou. Quando medir, anote o valor, o horário e o contexto da medição."],
      button: { label: "Registrar agora", url },
      notes: [`Para mudar o horário, pausar ou excluir este lembrete, abra <a href="${esc(manage)}" style="color:${INK}">Alertas e lembretes</a>.`],
      appUrl: p.appUrl,
    }),
    text: plain([
      "Hora de registrar sua glicemia. Este é o lembrete que você programou.",
      `Registrar agora: ${url}`,
      `Para mudar, pausar ou excluir lembretes: ${manage}`,
    ]),
  };
}
