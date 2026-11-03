-- Publicação lida pelo PowerSync (o nome precisa ser "powersync").
--
-- O PowerSync replica do Postgres pela replicação lógica, que o Supabase já
-- deixa ligada; falta só dizer quais tabelas entram. "Todas" é o mais simples
-- e não vaza nada: o que desce para cada aparelho é decidido pelas regras em
-- packages/db/sync/streams.yaml, não pela publicação.
--
-- O papel de replicação (powersync_role) NÃO está aqui de propósito: ele leva
-- senha, e senha não vai para o repositório. Criar à mão — ver
-- docs/powersync.md.

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'powersync') then
    create publication powersync for all tables;
  end if;
end
$$;
