-- Foto das receitas.
--
-- As receitas prontas do sistema ganham uma foto (domínio público / CC0, ver
-- apps/web/public/receitas/creditos.json no frontend). O caminho é relativo ao
-- app web e derivado do nome da receita: sem acento, minúsculo, hífens.
alter table public.recipes add column if not exists image_url text;

update public.recipes
set image_url = '/receitas/' || trim(both '-' from regexp_replace(
  lower(translate(name,
    'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
    'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')),
  '[^a-z0-9]+', '-', 'g')) || '.webp'
where user_id is null;
