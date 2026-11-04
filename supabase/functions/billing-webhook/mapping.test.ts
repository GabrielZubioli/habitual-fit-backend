// deno test supabase/functions/billing-webhook/mapping.test.ts
import { assertEquals } from "jsr:@std/assert@1";
import { toSubscriptionUpdate, type RevenueCatEvent } from "./mapping.ts";

const USER = "4bedb450-8ef2-11e9-b475-0800200c9a66";
const base: RevenueCatEvent = {
  type: "INITIAL_PURCHASE",
  id: "evt-1",
  app_user_id: USER,
  product_id: "forja_anual",
  store: "APP_STORE",
  expiration_at_ms: 1_800_000_000_000,
  event_timestamp_ms: 1_790_000_000_000,
};

Deno.test("compra inicial vira assinatura ativa com fim do período", () => {
  const u = toSubscriptionUpdate(base)!;
  assertEquals(u.status, "active");
  assertEquals(u.store, "app_store");
  assertEquals(u.currentPeriodEnd, new Date(1_800_000_000_000).toISOString());
});

Deno.test("cancelamento mantém o período (cancelled, não expired)", () => {
  assertEquals(toSubscriptionUpdate({ ...base, type: "CANCELLATION" })!.status, "cancelled");
  assertEquals(toSubscriptionUpdate({ ...base, type: "EXPIRATION" })!.status, "expired");
  assertEquals(toSubscriptionUpdate({ ...base, type: "BILLING_ISSUE" })!.status, "in_grace");
});

Deno.test("ignora o que não muda acesso", () => {
  assertEquals(toSubscriptionUpdate({ ...base, type: "TEST" }), null);
  assertEquals(toSubscriptionUpdate({ ...base, type: "TRANSFER" }), null);
  assertEquals(toSubscriptionUpdate({ ...base, app_user_id: "$RCAnonymousID:abc" }), null);
  assertEquals(toSubscriptionUpdate({ ...base, store: "AMAZON" }), null);
});

Deno.test("Stripe e RC Billing caem em stripe", () => {
  assertEquals(toSubscriptionUpdate({ ...base, store: "RC_BILLING" })!.store, "stripe");
});
