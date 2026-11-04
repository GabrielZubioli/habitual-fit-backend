/**
 * Exclusão da conta — pedida pelo próprio usuário, irreversível.
 *
 * Precisa de servidor porque apagar `auth.users` exige a service role. O resto
 * do banco vai junto por cascata (tudo que é do usuário referencia
 * `auth.users ON DELETE CASCADE`; ver migration `account_deletion`). Os
 * arquivos do Storage não estão no banco, então são removidos antes: fotos de
 * progresso e avatar ficam em `<bucket>/<user_id>/...`.
 *
 * Implantar: `npx supabase functions deploy delete-account`
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUCKETS = ["progress-photos", "avatars"];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const jwt = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  // O id vem do JWT validado pelo Auth, nunca do corpo da requisição.
  const { data: auth, error: authError } = await admin.auth.getUser(jwt);
  if (authError || !auth.user) return json({ error: "unauthorized" }, 401);
  const userId = auth.user.id;

  for (const bucket of BUCKETS) {
    const store = admin.storage.from(bucket);
    // Todos os arquivos sob `<userId>/`, paginando de 1000 em 1000.
    const paths: string[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await store.list(userId, { limit: 1000, offset });
      if (error) return json({ error: "storage_error" }, 500);
      paths.push(...data.map((f) => `${userId}/${f.name}`));
      if (data.length < 1000) break;
    }
    if (paths.length === 0) continue;
    const { error } = await store.remove(paths);
    if (error) {
      console.error("delete-account: falha ao limpar storage", bucket, error.message);
      return json({ error: "storage_error" }, 500);
    }
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.error("delete-account: falha ao apagar usuário", error.message);
    return json({ error: "delete_failed" }, 500);
  }
  return json({ ok: true });
});
