// Modelos dos e-mails do Supabase Auth com a identidade do Habitual Fit.
//
// Exige SMTP próprio: no plano gratuito, com o provedor padrão, o Supabase
// recusa modelos personalizados (e só envia para quem é do time do projeto).
// Com o SMTP configurado, aplique — isso também liga a confirmação de e-mail:
//
//   node supabase/email-templates.cjs > /tmp/auth.json
//   curl -X PATCH https://api.supabase.com/v1/projects/ijeyizatjzsbgclwmtgp/config/auth \
//     -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
//     --data-binary @/tmp/auth.json

const SITE = "https://habitualfit.vercel.app";
const LOGO = `${SITE}/brand/habitual-fit-logo-email.png`;
const C = {
  fundo: "#050807",
  card: "#101715",
  borda: "#1f2a27",
  texto: "#eef3f1",
  suave: "#9aa8a3",
  verde: "#01D798",
  verdeTexto: "#03140e",
};
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const OLA = "{{ if .Data.name }}Olá, {{ .Data.name }}!{{ else }}Olá!{{ end }}";

function layout({ previa, titulo, corpo, botao, link, aviso }) {
  const cta = botao
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px">
  <tr><td bgcolor="${C.verde}" style="border-radius:14px">
    <a href="${link}" target="_blank" style="display:inline-block;padding:16px 32px;font-family:${FONT};font-size:16px;font-weight:700;color:${C.verdeTexto};text-decoration:none;border-radius:14px">${botao}</a>
  </td></tr>
</table>
<p style="margin:20px 0 0;font-size:13px;line-height:20px;color:${C.suave}">Se o botão não funcionar, copie e cole este endereço no navegador:<br><a href="${link}" style="color:${C.verde};word-break:break-all">${link}</a></p>`
    : "";
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background:${C.fundo}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${previa}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.fundo}" style="background:${C.fundo}">
<tr><td align="center" style="padding:40px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px">
    <tr><td align="center" style="padding:0 0 28px">
      <a href="${SITE}" target="_blank"><img src="${LOGO}" width="200" height="42" alt="Habitual Fit" style="display:block;border:0;width:200px;height:auto"></a>
    </td></tr>
    <tr><td bgcolor="${C.card}" style="background:${C.card};border:1px solid ${C.borda};border-radius:24px;padding:36px 32px;font-family:${FONT};color:${C.texto}">
      <h1 style="margin:0 0 16px;font-size:24px;line-height:32px;font-weight:800;color:${C.texto}">${titulo}</h1>
      ${corpo}
      ${cta}
      ${aviso ? `<p style="margin:28px 0 0;padding-top:20px;border-top:1px solid ${C.borda};font-size:13px;line-height:20px;color:${C.suave}">${aviso}</p>` : ""}
    </td></tr>
    <tr><td align="center" style="padding:28px 16px 0;font-family:${FONT};font-size:12px;line-height:18px;color:${C.suave}">
      Habitual Fit · seu treino e sua dieta, montados para você<br>
      Este é um e-mail automático, não é preciso responder.
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

const p = (t) => `<p style="margin:0 0 12px;font-size:16px;line-height:25px;color:${C.texto}">${t}</p>`;
const codigo = (t) =>
  `<p style="margin:24px 0 8px;font-size:32px;line-height:40px;font-weight:800;letter-spacing:6px;color:${C.verde}">${t}</p>`;
const NAO_FOI = "Se não foi você, ignore este e-mail. Nada muda na sua conta.";
const ALERTA =
  "Se não foi você, troque sua senha agora mesmo em habitualfit.vercel.app e revise os acessos da sua conta.";

const modelos = {
  confirmation: {
    assunto: "Confirme seu e-mail · Habitual Fit",
    previa: "Falta só um toque para montar seu plano de treino e dieta.",
    titulo: "Confirme seu e-mail",
    corpo:
      p(OLA) +
      p("Sua conta no Habitual Fit está quase pronta. Confirme seu e-mail para responder algumas perguntas rápidas e receber seu plano de treino e dieta."),
    botao: "Confirmar e-mail",
    link: "{{ .ConfirmationURL }}",
    aviso: "O link vale por 1 hora. " + "Se você não criou uma conta no Habitual Fit, ignore este e-mail.",
  },
  recovery: {
    assunto: "Redefina sua senha · Habitual Fit",
    previa: "Recebemos um pedido para criar uma nova senha.",
    titulo: "Redefina sua senha",
    corpo:
      p(OLA) +
      p("Recebemos um pedido para redefinir a senha da sua conta ({{ .Email }}). Toque no botão abaixo para criar uma nova senha."),
    botao: "Criar nova senha",
    link: "{{ .ConfirmationURL }}",
    aviso: "O link vale por 1 hora e só pode ser usado uma vez. " + NAO_FOI,
  },
  magic_link: {
    assunto: "Seu link de acesso · Habitual Fit",
    previa: "Entre na sua conta com um toque.",
    titulo: "Seu link de acesso",
    corpo: p(OLA) + p("Use o botão abaixo para entrar na sua conta do Habitual Fit."),
    botao: "Entrar no Habitual Fit",
    link: "{{ .ConfirmationURL }}",
    aviso: "O link vale por 1 hora e só pode ser usado uma vez. " + NAO_FOI,
  },
  invite: {
    assunto: "Você foi convidado para o Habitual Fit",
    previa: "Aceite o convite e monte seu plano de treino e dieta.",
    titulo: "Você foi convidado",
    corpo: p("Olá!") + p("Você recebeu um convite para criar sua conta no Habitual Fit e montar seu plano de treino e dieta."),
    botao: "Aceitar convite",
    link: "{{ .ConfirmationURL }}",
    aviso: "Se você não esperava este convite, ignore este e-mail.",
  },
  email_change: {
    assunto: "Confirme seu novo e-mail · Habitual Fit",
    previa: "Confirme a troca do e-mail da sua conta.",
    titulo: "Confirme seu novo e-mail",
    corpo:
      p(OLA) +
      p("Recebemos um pedido para trocar o e-mail da sua conta de {{ .Email }} para <strong>{{ .NewEmail }}</strong>. Confirme para concluir a troca."),
    botao: "Confirmar novo e-mail",
    link: "{{ .ConfirmationURL }}",
    aviso: NAO_FOI,
  },
  reauthentication: {
    assunto: "{{ .Token }} é seu código · Habitual Fit",
    previa: "Use este código para confirmar que é você.",
    titulo: "Seu código de verificação",
    corpo: p(OLA) + p("Use o código abaixo para confirmar que é você:") + codigo("{{ .Token }}"),
    aviso: "O código vale por 1 hora. " + NAO_FOI,
  },
  password_changed_notification: {
    assunto: "Sua senha foi alterada · Habitual Fit",
    previa: "A senha da sua conta acabou de ser alterada.",
    titulo: "Sua senha foi alterada",
    corpo: p(OLA) + p("A senha da sua conta no Habitual Fit ({{ .Email }}) foi alterada."),
    aviso: ALERTA,
  },
  email_changed_notification: {
    assunto: "Seu e-mail foi alterado · Habitual Fit",
    previa: "O e-mail da sua conta foi alterado.",
    titulo: "Seu e-mail foi alterado",
    corpo: p(OLA) + p("O e-mail da sua conta mudou de {{ .OldEmail }} para {{ .Email }}."),
    aviso: ALERTA,
  },
  phone_changed_notification: {
    assunto: "Seu telefone foi alterado · Habitual Fit",
    previa: "O telefone da sua conta foi alterado.",
    titulo: "Seu telefone foi alterado",
    corpo: p(OLA) + p("O número de telefone da sua conta foi alterado."),
    aviso: ALERTA,
  },
  mfa_factor_enrolled_notification: {
    assunto: "Nova verificação adicionada · Habitual Fit",
    previa: "Um novo método de verificação foi adicionado à sua conta.",
    titulo: "Nova verificação adicionada",
    corpo: p(OLA) + p("Um novo método de verificação em duas etapas foi adicionado à sua conta."),
    aviso: ALERTA,
  },
  mfa_factor_unenrolled_notification: {
    assunto: "Verificação removida · Habitual Fit",
    previa: "Um método de verificação foi removido da sua conta.",
    titulo: "Verificação removida",
    corpo: p(OLA) + p("Um método de verificação em duas etapas foi removido da sua conta."),
    aviso: ALERTA,
  },
  identity_linked_notification: {
    assunto: "Novo acesso vinculado · Habitual Fit",
    previa: "Uma nova forma de entrar foi vinculada à sua conta.",
    titulo: "Novo acesso vinculado",
    corpo: p(OLA) + p("Uma nova forma de entrar ({{ .Provider }}) foi vinculada à sua conta."),
    aviso: ALERTA,
  },
  identity_unlinked_notification: {
    assunto: "Acesso desvinculado · Habitual Fit",
    previa: "Uma forma de entrar foi removida da sua conta.",
    titulo: "Acesso desvinculado",
    corpo: p(OLA) + p("Uma forma de entrar ({{ .Provider }}) foi removida da sua conta."),
    aviso: ALERTA,
  },
};

const body = { mailer_autoconfirm: false, mailer_notifications_password_changed_enabled: true };
for (const [k, m] of Object.entries(modelos)) {
  body[`mailer_subjects_${k}`] = m.assunto;
  body[`mailer_templates_${k}_content`] = layout(m);
}
process.stdout.write(JSON.stringify(body));
