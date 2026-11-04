-- Tutorial de boas-vindas: quando a pessoa concluiu ou pulou.
--
-- Nulo = ainda não viu; o app mostra o tutorial uma vez e grava a data ao
-- concluir ou pular. Fica no perfil (e não só no aparelho) para não reaparecer
-- em outro navegador.
alter table public.profiles
  add column if not exists tutorial_completed_at timestamptz;

-- Quem já usa o app não é usuário novo: não recebe o tutorial de surpresa.
update public.profiles
   set tutorial_completed_at = now()
 where onboarding_completed = true
   and tutorial_completed_at is null;
