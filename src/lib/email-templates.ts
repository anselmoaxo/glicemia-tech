// Textos dos e-mails transacionais. Puro (sem Resend), para poder testar o conteúdo.
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const INK = "#0f3d4c";

function layout(title: string, bodyHtml: string, footer: string) {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#eef3f1;font-family:Arial,Helvetica,sans-serif;color:#10232a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;padding:28px">
<tr><td>
<p style="margin:0 0 4px;font-size:20px;font-weight:bold;color:${INK}">Glicose Tech</p>
<h1 style="margin:16px 0 12px;font-size:22px">${esc(title)}</h1>
${bodyHtml}
<p style="margin:24px 0 0;font-size:14px;color:#4a5f66">${footer}</p>
</td></tr></table></td></tr></table></body></html>`;
}

const button = (url: string, label: string) =>
  `<p style="margin:20px 0"><a href="${esc(url)}" style="display:inline-block;background:${INK};color:#ffffff;text-decoration:none;font-size:18px;font-weight:bold;padding:14px 24px;border-radius:12px">${esc(label)}</a></p>
<p style="margin:0;font-size:14px;color:#4a5f66">Se o botão não abrir, copie e cole este endereço no navegador:<br><span style="word-break:break-all">${esc(url)}</span></p>`;

const first = (name: string) => esc(name.trim().split(/\s+/)[0] || "");

export function verificationEmail(name: string, url: string, hours = 24) {
  return {
    subject: "Confirme seu e-mail no Glicose Tech",
    html: layout(
      "Confirme seu e-mail",
      `<p style="font-size:16px;line-height:1.5">Olá, ${first(name)}! Para ativar sua conta, confirme que este e-mail é seu.</p>${button(url, "Confirmar meu e-mail")}
<p style="font-size:14px;color:#4a5f66">O link vale por ${hours} horas.</p>`,
      "Se você não criou uma conta no Glicose Tech, ignore esta mensagem. Nada será feito.",
    ),
  };
}

export function resetPasswordEmail(name: string, url: string, minutes = 60) {
  return {
    subject: "Redefinir sua senha do Glicose Tech",
    html: layout(
      "Redefinir sua senha",
      `<p style="font-size:16px;line-height:1.5">Olá, ${first(name)}! Recebemos um pedido para criar uma nova senha para a sua conta.</p>${button(url, "Criar nova senha")}
<p style="font-size:14px;color:#4a5f66">O link vale por ${minutes} minutos e só pode ser usado uma vez.</p>`,
      "Se você não pediu isso, ignore esta mensagem: sua senha continua a mesma. Por segurança, nunca compartilhe este link.",
    ),
  };
}
