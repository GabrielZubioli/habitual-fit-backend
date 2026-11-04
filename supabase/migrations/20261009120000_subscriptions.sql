-- Assinaturas (RevenueCat) e recursos de paridade (ver forja-frontend/replica/architecture.md).
--
-- Ofensiva, meta semanal, PRs, resumo e programas são derivados no @forja/domain
-- a partir de workout_sessions/workout_sets — nada disso vira tabela. Aqui entra
-- só o que precisa ser guardado: o estado da assinatura. (Meta semanal = days_per_week
-- da rotina; som do descanso é preferência do aparelho, fica no localStorage.)


-- --------------------------------------------------------- subscriptions
-- Uma linha por usuário, escrita apenas pela Edge Function `billing-webhook`
-- (service_role). O cliente só lê: ninguém se concede premium pelo PostgREST.
CREATE TABLE IF NOT EXISTS public.subscriptions (
  user_id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store              TEXT NOT NULL CHECK (store IN ('app_store', 'play_store', 'stripe', 'promotional')),
  product_id         TEXT NOT NULL,
  status             TEXT NOT NULL CHECK (status IN ('active', 'in_grace', 'cancelled', 'expired')),
  current_period_end TIMESTAMPTZ,
  -- Timestamp do último evento aplicado: o webhook descarta eventos mais
  -- antigos (o provedor reenvia e não garante ordem).
  last_event_at      TIMESTAMPTZ NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own subscription read" ON public.subscriptions;
CREATE POLICY "own subscription read" ON public.subscriptions
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
DROP TRIGGER IF EXISTS trg_subscriptions_updated ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Premium = assinatura ativa (ou em carência) ainda dentro do período.
-- `cancelled` continua premium até o fim do período já pago.
CREATE OR REPLACE FUNCTION public.is_premium()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = auth.uid()
      AND status IN ('active', 'in_grace', 'cancelled')
      AND (current_period_end IS NULL OR current_period_end > now())
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_premium() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_premium() TO authenticated;

-- --------------------------------------------------------- índices
-- Painel de recordes: lê só as séries marcadas como PR, por exercício.
CREATE INDEX IF NOT EXISTS idx_workout_sets_pr ON public.workout_sets(exercise_id) WHERE is_pr;

-- --------------------------------------------------------- apply_subscription_event
-- Upsert condicional: o provedor reenvia eventos e não garante ordem, então um
-- evento só vale se for mais novo que o último aplicado. Numa instrução só, sem
-- janela entre ler e gravar. Chamado apenas pela Edge Function (service_role).
CREATE OR REPLACE FUNCTION public.apply_subscription_event(
  _user_id UUID,
  _store TEXT,
  _product_id TEXT,
  _status TEXT,
  _current_period_end TIMESTAMPTZ,
  _event_at TIMESTAMPTZ
) RETURNS VOID LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  INSERT INTO public.subscriptions AS s
    (user_id, store, product_id, status, current_period_end, last_event_at)
  VALUES (_user_id, _store, _product_id, _status, _current_period_end, _event_at)
  ON CONFLICT (user_id) DO UPDATE SET
    store = excluded.store,
    product_id = excluded.product_id,
    status = excluded.status,
    current_period_end = excluded.current_period_end,
    last_event_at = excluded.last_event_at
  WHERE s.last_event_at < excluded.last_event_at;
$$;
REVOKE EXECUTE ON FUNCTION public.apply_subscription_event(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ)
  FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.apply_subscription_event(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ)
  TO service_role;
