/**
 * Evento do RevenueCat → linha de `subscriptions`.
 *
 * Puro, sem Deno nem rede, para ser testado sozinho. Retorna `null` para tudo
 * que não muda o acesso (TEST, TRANSFER, usuário anônimo, loja não suportada):
 * o webhook responde 200 e o RevenueCat não reenvia.
 */

export interface RevenueCatEvent {
  type: string;
  id: string;
  app_user_id?: string;
  product_id?: string;
  store?: string;
  expiration_at_ms?: number | null;
  event_timestamp_ms: number;
}

export interface SubscriptionUpdate {
  userId: string;
  store: "app_store" | "play_store" | "stripe" | "promotional";
  productId: string;
  status: "active" | "in_grace" | "cancelled" | "expired";
  currentPeriodEnd: string | null;
  eventAt: string;
}

const STATUS_BY_TYPE: Record<string, SubscriptionUpdate["status"]> = {
  INITIAL_PURCHASE: "active",
  RENEWAL: "active",
  UNCANCELLATION: "active",
  PRODUCT_CHANGE: "active",
  NON_RENEWING_PURCHASE: "active",
  // Cancelar desliga a renovação; o acesso vai até o fim do período pago.
  CANCELLATION: "cancelled",
  BILLING_ISSUE: "in_grace",
  EXPIRATION: "expired",
};

const STORE: Record<string, SubscriptionUpdate["store"]> = {
  APP_STORE: "app_store",
  MAC_APP_STORE: "app_store",
  PLAY_STORE: "play_store",
  STRIPE: "stripe",
  RC_BILLING: "stripe",
  PROMOTIONAL: "promotional",
};

/** O app faz `Purchases.logIn(<id do Supabase>)`; ids anônimos ($RCAnonymousID) não têm dono. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function toSubscriptionUpdate(event: RevenueCatEvent): SubscriptionUpdate | null {
  const status = STATUS_BY_TYPE[event.type];
  const store = event.store ? STORE[event.store] : undefined;
  if (!status || !store || !event.product_id) return null;
  if (!event.app_user_id || !UUID_RE.test(event.app_user_id)) return null;
  if (!Number.isFinite(event.event_timestamp_ms)) return null;

  return {
    userId: event.app_user_id,
    store,
    productId: event.product_id,
    status,
    currentPeriodEnd: event.expiration_at_ms
      ? new Date(event.expiration_at_ms).toISOString()
      : null,
    eventAt: new Date(event.event_timestamp_ms).toISOString(),
  };
}
