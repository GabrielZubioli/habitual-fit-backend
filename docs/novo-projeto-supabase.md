# Criar um novo projeto Supabase (pós-Lovable)

Guia para provisionar um projeto Supabase próprio e aplicar o schema do Habitual Fit.
O schema completo (tabelas, RLS, triggers, seeds, bucket) está em
`supabase/migrations/`.

## 1. Criar o projeto no painel

1. Acesse https://supabase.com → entre / crie conta.
2. **New project** → escolha a organização.
3. Preencha:
   - **Name**: `forja` (ou o que preferir).
   - **Database Password**: gere uma senha forte e **guarde** (usada no CLI).
   - **Region**: mais próxima (ex.: South America / São Paulo).
4. Aguarde o provisionamento (~2 min).

## 2. Pegar as credenciais

Em **Project Settings → API**:

- **Project URL** → `https://<ref>.supabase.co`
- **Publishable key** (ou `anon` key legada) → chave pública do client.
- **Service role key** → **secreta**, só servidor. Nunca no bundle do client / nunca com prefixo `VITE_`.

Em **Project Settings → General**: o **Reference ID** (`<ref>`).

## 3. Aplicar o schema (recomendado: Supabase CLI)

```sh
# na raiz do repo
npx supabase login                 # abre o navegador p/ autenticar
npx supabase link --project-ref <ref>   # pede a Database Password
npx supabase db push               # aplica supabase/migrations/* no banco novo
```

`db push` roda, em ordem:

1. schema + RLS + triggers + seeds (exercícios e alimentos);
2. hardening de permissões;
3. criação do bucket `progress-photos`.

> **Alternativa sem CLI:** Painel → **SQL Editor** → cole o conteúdo de cada
> arquivo de `supabase/migrations/` **na ordem dos nomes** e execute um a um.
> Se der erro de permissão nas policies de `storage.objects`, crie-as pela UI
> **Storage → Policies** (mesmas regras: acesso só a `auth.uid()/...`).

## 4. Configurar autenticação

Em **Authentication → Sign In / Providers → Email**:

- **Dev/rápido:** desligue **"Confirm email"** → cadastro já loga na hora.
- **Produção:** mantenha ligado e configure **SMTP próprio** em
  **Authentication → Emails → SMTP** (ex.: Resend/SendGrid) para os emails chegarem.

(Opcional) **Google**: Authentication → Providers → Google → informar Client ID/Secret
e adicionar o redirect. Necessário só quando for reativar o login Google.

## 5. Apontar o app para o banco novo

Atualize a raiz `.env` (as duas variantes — a `VITE_` é lida no client, a sem
prefixo no SSR):

```env
VITE_SUPABASE_URL="https://<ref>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<publishable-key>"
VITE_SUPABASE_PROJECT_ID="<ref>"
SUPABASE_URL="https://<ref>.supabase.co"
SUPABASE_PUBLISHABLE_KEY="<publishable-key>"
SUPABASE_PROJECT_ID="<ref>"
# só se precisar de operações admin no servidor (NUNCA no client):
# SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

E `supabase/config.toml`:

```toml
project_id = "<ref>"
```

Reinicie o `npm run dev` para recarregar as variáveis.

## 6. Testar

- Criar conta com senha **forte e única** (a proteção contra senha vazada rejeita
  senhas comuns).
- Se desligou a confirmação de email, o cadastro deve logar direto e cair no
  dashboard; o trigger `handle_new_user` cria o `profiles` + `user_roles`.

## Observações

- O app **mobile** usará o mesmo projeto Supabase (chaves em `apps/mobile/.env`,
  prefixo `EXPO_PUBLIC_`), e a instância **PowerSync** aponta para o Postgres deste
  projeto. Ver [../arquitetura/monorepo.md](../arquitetura/monorepo.md).
- Os `.env` contêm segredos — confirme que estão no `.gitignore` antes de commitar.
