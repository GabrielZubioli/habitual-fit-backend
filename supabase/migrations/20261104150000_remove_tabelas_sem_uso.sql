-- Tabelas criadas e nunca usadas: nenhum código do app, das Edge Functions ou
-- das regras do PowerSync lê ou grava nelas, e estão vazias em produção.
-- - user_meal_slots (nutrition_v2): os horários das refeições ficam em
--   meal_plan_meals;
-- - food_favorites (foods_enrichment): o app não tem alimentos favoritos;
-- - ai_recommendations (ai_coach): o coach usa ai_conversations/ai_messages.
-- Nada aponta para elas (só delas para auth.users e foods); os gatilhos e as
-- policies saem junto.
drop table if exists public.user_meal_slots;
drop table if exists public.food_favorites;
drop table if exists public.ai_recommendations;
