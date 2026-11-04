/**
 * Webhook do RevenueCat — a única escrita em `subscriptions`.
 *
 * O RevenueCat junta App Store, Play Store e Stripe (web) num só fluxo de
 * eventos. Esta função traduz o evento (`mapping.ts`) e aplica com
 * `apply_subscription_event`, que só aceita eventos mais novos que o último —
 * reenvio e fora de ordem viram no-op no próprio banco.
 *
 * Autenticação: o RevenueCat não assina o corpo; ele manda o header
 * `Authorization` com o valor configurado no painel. Comparamos com o secret.
 *
 * Implantar: `npx supabase functions deploy billing-webhook`
 * Configurar: `npx supabase secrets set REVENUECAT_WEBHOOK_AUTH=<valor longo e aleatório>`
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { toSubscriptionUpdate, type RevenueCatEvent } from "./mapping.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const expected = Deno.env.get("REVENUECAT_WEBHOOK_AUTH");
  if (!expected) return json({ error: "not_configured" }, 503);
  if (!timingSafeEqual(req.headers.get("authorization") ?? "", expected)) {
    return json({ error: "unauthorized" }, 401);
  }

  let event: RevenueCatEvent;
  try {
    event = (await req.json()).event;
    if (!event || typeof event.type !== "string") throw new Error();
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  const update = toSubscriptionUpdate(event);
  if (!update) return json({ ignored: event.type });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  const { error } = await admin.rpc("apply_subscription_event", {
    _user_id: update.userId,
    _store: update.store,
    _product_id: update.productId,
    _status: update.status,
    _current_period_end: update.currentPeriodEnd,
    _event_at: update.eventAt,
  });

  if (error) {
    // 500 faz o RevenueCat tentar de novo — é o que queremos numa falha do
    // banco. Usuário inexistente (FK) também cai aqui e se esgota nas retries.
    // Só o id do evento vai para o log: nada de dado pessoal.
    console.error("apply_subscription_event falhou", event.id, error.code);
    return json({ error: "db_error" }, 500);
  }
  return json({ ok: true });
});

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}
